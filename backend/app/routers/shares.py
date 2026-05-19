"""
shares.py — Share creation, retrieval, password verification, and text content routes.
Replaces: backend/src/routes/shares.ts
"""

from fastapi import APIRouter, Depends, Request, UploadFile, Form, Header
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import ValidationError

from app.database import get_db
from app.schemas import TextShareCreate, PasswordVerify
from app.services import share_service, password_service
from app.services.uid_service import normalize_uid, is_valid_uid, format_uid
from app.middleware.rate_limiter import limiter, RETRIEVAL_LIMIT, PASSWORD_LIMIT, UPLOAD_LIMIT
from app.middleware.mime_validator import validate_file
from app.config import settings

router = APIRouter(prefix="/api/shares")


# ─── POST /api/shares/file — Create file share ─────────


@router.post("/file")
@limiter.limit(UPLOAD_LIMIT)
async def create_file_share(
    request: Request,
    files: list[UploadFile] = [],
    expiresIn: str | None = Form(default=None),
    password: str | None = Form(default=None),
    db: AsyncSession = Depends(get_db),
):
    if not files:
        return JSONResponse(
            status_code=400,
            content={"success": False, "error": "No files uploaded"},
        )

    if len(files) > 20:
        return JSONResponse(
            status_code=400,
            content={"success": False, "error": "Maximum 20 files per upload"},
        )

    # Read all file contents and validate
    file_data = []
    total_size = 0
    for f in files:
        content = await f.read()
        total_size += len(content)

        if total_size > settings.MAX_UPLOAD_BYTES:
            return JSONResponse(
                status_code=400,
                content={
                    "success": False,
                    "error": f"Total upload size exceeds {settings.MAX_UPLOAD_BYTES // (1024 * 1024)}MB limit",
                },
            )

        # MIME validation via magic bytes
        mime_error = validate_file(f.filename or "unknown", content)
        if mime_error:
            return JSONResponse(
                status_code=400,
                content={"success": False, "error": mime_error},
            )

        file_data.append(
            {
                "filename": f.filename or "unknown",
                "buffer": content,
                "mime_type": f.content_type or "application/octet-stream",
                "size": len(content),
            }
        )

    uid = await share_service.create_file_share(
        db, file_data, expires_in=expiresIn, password=password
    )

    return JSONResponse(
        status_code=201,
        content={
            "success": True,
            "data": {"uid": uid, "formattedUID": format_uid(uid)},
        },
    )


# ─── POST /api/shares/text — Create text share ─────────


@router.post("/text")
@limiter.limit(UPLOAD_LIMIT)
async def create_text_share(
    request: Request,
    body: TextShareCreate,
    db: AsyncSession = Depends(get_db),
):
    uid = await share_service.create_text_share(
        db,
        content=body.content,
        title=body.title,
        language=body.language,
        expires_in=body.expiresIn,
        password=body.password,
    )

    return JSONResponse(
        status_code=201,
        content={
            "success": True,
            "data": {"uid": uid, "formattedUID": format_uid(uid)},
        },
    )


# ─── GET /api/shares/{uid} — Get share metadata ────────


@router.get("/{uid}")
@limiter.limit(RETRIEVAL_LIMIT)
async def get_share(
    request: Request,
    uid: str,
    db: AsyncSession = Depends(get_db),
):
    clean_uid = normalize_uid(uid)
    if not is_valid_uid(clean_uid):
        return JSONResponse(
            status_code=400,
            content={"success": False, "error": "Invalid UID format - must be 6 digits"},
        )

    share = await share_service.get_share_by_uid(db, clean_uid)
    if not share:
        return JSONResponse(
            status_code=404,
            content={"success": False, "error": "Share not found or has expired"},
        )

    return {"success": True, "data": share}


# ─── POST /api/shares/{uid}/verify — Password verify ───


@router.post("/{uid}/verify")
@limiter.limit(PASSWORD_LIMIT)
async def verify_share_password(
    request: Request,
    uid: str,
    body: PasswordVerify,
    db: AsyncSession = Depends(get_db),
):
    clean_uid = normalize_uid(uid)
    if not is_valid_uid(clean_uid):
        return JSONResponse(
            status_code=400,
            content={"success": False, "error": "Invalid UID format"},
        )

    pw_hash = await share_service.get_share_password_hash(db, clean_uid)
    if not pw_hash:
        return JSONResponse(
            status_code=404,
            content={"success": False, "error": "Share not found or is not password-protected"},
        )

    is_valid = await password_service.verify_password(body.password, pw_hash)
    if not is_valid:
        return JSONResponse(
            status_code=401,
            content={"success": False, "error": "Incorrect password"},
        )

    session_token = password_service.create_session_token(clean_uid)

    return {"success": True, "data": {"sessionToken": session_token}}


# ─── GET /api/shares/{uid}/content — Get text content ──


@router.get("/{uid}/content")
@limiter.limit(RETRIEVAL_LIMIT)
async def get_text_content(
    request: Request,
    uid: str,
    db: AsyncSession = Depends(get_db),
    x_session_token: str | None = Header(default=None, alias="X-Session-Token"),
):
    clean_uid = normalize_uid(uid)
    if not is_valid_uid(clean_uid):
        return JSONResponse(
            status_code=400,
            content={"success": False, "error": "Invalid UID format"},
        )

    share = await share_service.get_share_by_uid(db, clean_uid)
    if not share:
        return JSONResponse(
            status_code=404,
            content={"success": False, "error": "Share not found or has expired"},
        )

    # If private, validate session token
    if share["isPrivate"]:
        if not x_session_token or not password_service.validate_session_token(
            x_session_token, clean_uid
        ):
            return JSONResponse(
                status_code=401,
                content={
                    "success": False,
                    "error": "Authentication required — verify password first",
                },
            )

    content = await share_service.get_text_content(db, clean_uid)
    if not content:
        return JSONResponse(
            status_code=404,
            content={"success": False, "error": "Text content not found"},
        )

    return {"success": True, "data": content}
