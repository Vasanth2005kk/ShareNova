"""/api/shares — create, read, update, delete shares and verify passwords."""

from flask import Blueprint, current_app, request

from app.errors import ApiError, success
from app.extensions import limiter, password_limit, retrieval_limit, update_limit, upload_limit
from app.security import require_access
from app.services import password_service, share_service, validation
from app.services.share_service import DEFAULT_ROOM_EXPIRY
from app.services.uid_service import format_uid

bp = Blueprint("shares", __name__, url_prefix="/api/shares")


def _get_active_or_404(uid: str):
    share = share_service.get_active_share(uid)
    if share is None:
        raise ApiError(404, "Share not found or has expired")
    return share


@bp.get("/active")
@limiter.limit(retrieval_limit)
def list_active():
    try:
        limit = int(request.args.get("limit", 5))
    except ValueError:
        raise ApiError(400, "limit must be an integer") from None
    limit = max(1, min(limit, 50))
    return success(share_service.list_active_shares(limit))


@bp.post("/file")
@limiter.limit(upload_limit)
def create_file_share():
    uploads = [f for f in request.files.getlist("files") if f and f.filename]
    if not uploads:
        raise ApiError(400, "No files uploaded")
    max_files = current_app.config["MAX_FILES_PER_SHARE"]
    if len(uploads) > max_files:
        raise ApiError(400, f"Maximum {max_files} files per upload")

    errors: list[dict] = []
    expires_in = validation.expires_in_value(request.form.get("expiresIn"), errors)
    password = validation.password_value(request.form.get("password"), errors)
    if errors:
        raise ApiError(400, "Validation failed", errors)

    share = share_service.create_file_share(uploads, expires_in, password)
    return success({"uid": share.urlid, "formattedUID": format_uid(share.urlid)}, 201)


@bp.post("/text")
@limiter.limit(upload_limit)
def create_text_share():
    data = validation.text_share_create(validation.json_body())
    share = share_service.create_text_share(**data)
    return success({"uid": share.urlid, "formattedUID": format_uid(share.urlid)}, 201)


@bp.put("/text/<uid>")
@limiter.limit(update_limit)
def update_text_share(uid: str):
    uid = validation.clean_uid(uid)
    data = validation.text_share_update(validation.json_body())

    share = share_service.find_share(uid)
    if share is not None and share.is_expired:
        # Expired but not yet swept by the cleanup worker: remove it so the code can be reused.
        share_service.delete_share(share)
        share = None

    if share is None:
        # The editor room no longer exists on the server: recreate it under the same code.
        share_service.create_text_share(
            content=data["content"],
            title=data["title"],
            language=data["language"],
            expires_in=DEFAULT_ROOM_EXPIRY,
            target_uid=uid,
        )
        return success({"uid": uid, "updated": True})

    if share.text_share is None:
        raise ApiError(409, "This code belongs to a file share and cannot be edited")

    require_access(share)
    share_service.update_text_share(share, data["content"], data["title"], data["language"])
    return success({"uid": uid, "updated": True})


@bp.get("/<uid>")
@limiter.limit(retrieval_limit)
def get_share(uid: str):
    share = _get_active_or_404(validation.clean_uid(uid))
    return success(share_service.share_metadata(share))


@bp.post("/<uid>/verify")
@limiter.limit(password_limit)
def verify_password(uid: str):
    uid = validation.clean_uid(uid)
    password = validation.password_verify(validation.json_body())

    share = share_service.get_active_share(uid)
    if share is None or not share.password:
        raise ApiError(404, "Share not found or is not password-protected")
    if not password_service.verify_password(password, share.password):
        raise ApiError(401, "Incorrect password")

    return success({"sessionToken": password_service.create_session_token(uid)})


@bp.get("/<uid>/content")
@limiter.limit(retrieval_limit)
def get_text_content(uid: str):
    share = _get_active_or_404(validation.clean_uid(uid))
    require_access(share, "Authentication required — verify password first")

    content = share_service.text_content(share)
    if content is None:
        raise ApiError(404, "Text content not found")
    return success(content)


@bp.delete("/<uid>")
@limiter.limit(update_limit)
def delete_share(uid: str):
    uid = validation.clean_uid(uid)
    share = _get_active_or_404(uid)
    require_access(share)
    share_service.delete_share(share)
    return success({"uid": uid, "deleted": True})
