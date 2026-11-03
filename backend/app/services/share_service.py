"""Business logic for creating, reading, updating and deleting shares."""

import logging
from datetime import datetime, timedelta
from uuid import uuid4

from flask import current_app
from sqlalchemy import or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import selectinload
from werkzeug.datastructures import FileStorage

from app.database import db
from app.errors import ApiError
from app.models import File, Share, TextShare
from app.services import password_service, storage_service
from app.services.uid_service import generate_uid
from app.services.validation import check_upload_allowed, display_filename
from app.utils import to_iso_utc, utcnow

logger = logging.getLogger(__name__)

EXPIRY_DELTAS: dict[str, timedelta] = {
    "30m": timedelta(minutes=30),
    "1h": timedelta(hours=1),
    "6h": timedelta(hours=6),
    "24h": timedelta(hours=24),
    "7d": timedelta(days=7),
    "30d": timedelta(days=30),
}

# Used when the editor saves to a room code that no longer exists on the server.
DEFAULT_ROOM_EXPIRY = "24h"


def calculate_expiry(expires_in: str | None) -> datetime | None:
    delta = EXPIRY_DELTAS.get(expires_in or "")
    return utcnow() + delta if delta else None


# ─── Lookup ──────────────────────────────────────────────


def find_share(uid: str) -> Share | None:
    """Return the share for a code, including expired ones not yet cleaned up."""
    return db.execute(
        select(Share)
        .where(Share.urlid == uid)
        .options(selectinload(Share.files), selectinload(Share.text_share))
    ).scalar_one_or_none()


def get_active_share(uid: str) -> Share | None:
    """Return the share for a code, or None if it doesn't exist or has expired."""
    share = find_share(uid)
    if share is None or share.is_expired:
        return None
    return share


def share_metadata(share: Share) -> dict:
    if share.files:
        total_size = sum(f.filesize for f in share.files)
    elif share.text_share is not None:
        total_size = len(share.text_share.content.encode("utf-8"))
    else:
        total_size = 0

    return {
        "uid": share.urlid,
        "type": share.share_type,
        "isPrivate": share.is_private,
        "expiresAt": to_iso_utc(share.expires_at),
        "createdAt": to_iso_utc(share.created_at),
        "totalSize": str(total_size),
        "fileCount": len(share.files),
        "files": [
            {"id": f.id, "filename": f.filename, "mimeType": f.filetype, "size": str(f.filesize)}
            for f in share.files
        ],
        "textShare": (
            {"title": share.title, "language": share.text_share.language}
            if share.text_share is not None
            else None
        ),
    }


def list_active_shares(limit: int) -> list[dict]:
    """Recent non-expired shares (metadata only, no content or password hashes)."""
    now = utcnow()
    shares = db.execute(
        select(Share)
        .where(or_(Share.expires_at.is_(None), Share.expires_at > now))
        .options(selectinload(Share.text_share))
        .order_by(Share.created_at.desc())
        .limit(limit)
    ).scalars().all()

    return [
        {
            "uid": s.urlid,
            "type": s.share_type,
            "isPrivate": s.is_private,
            "expiresAt": to_iso_utc(s.expires_at),
            "createdAt": to_iso_utc(s.created_at),
            "title": s.title,
        }
        for s in shares
    ]


# ─── Create ──────────────────────────────────────────────


def _commit_new_share(share: Share, stored_keys: list[str]) -> None:
    db.add(share)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        storage_service.delete_files(stored_keys)
        raise ApiError(409, "That share code is already in use, please try again") from None


def create_file_share(
    uploads: list[FileStorage], expires_in: str | None, password: str | None
) -> Share:
    max_bytes = current_app.config["MAX_UPLOAD_BYTES"]
    uid = generate_uid(db)
    stored_keys: list[str] = []
    file_rows: list[File] = []
    total_size = 0

    try:
        for upload in uploads:
            filename = display_filename(upload)
            check_upload_allowed(upload, filename)

            key = storage_service.generate_storage_key(uid, filename)
            stored_keys.append(key)
            size = storage_service.save_upload(key, upload)
            total_size += size
            if total_size > max_bytes:
                raise ApiError(
                    400, f"Total upload size exceeds {max_bytes // (1024 * 1024)}MB limit"
                )

            file_rows.append(
                File(
                    id=str(uuid4()),
                    urlid=uid,
                    filename=filename,
                    filetype=upload.mimetype or "application/octet-stream",
                    filesize=size,
                    fileurl=key,
                )
            )
    except BaseException:
        storage_service.delete_files(stored_keys)
        raise

    share = Share(
        id=str(uuid4()),
        urlid=uid,
        title=None,
        password=password_service.hash_password(password) if password else None,
        is_private=bool(password),
        expires_at=calculate_expiry(expires_in),
        files=file_rows,
    )
    _commit_new_share(share, stored_keys)
    logger.info("Created file share %s (%d files, %d bytes)", uid, len(file_rows), total_size)
    return share


def create_text_share(
    content: str,
    title: str | None = None,
    language: str | None = None,
    expires_in: str | None = None,
    password: str | None = None,
    target_uid: str | None = None,
) -> Share:
    uid = target_uid or generate_uid(db)
    share = Share(
        id=str(uuid4()),
        urlid=uid,
        title=title,
        password=password_service.hash_password(password) if password else None,
        is_private=bool(password),
        expires_at=calculate_expiry(expires_in),
        text_share=TextShare(
            id=str(uuid4()), urlid=uid, content=content, language=language or "plaintext"
        ),
    )
    _commit_new_share(share, [])
    logger.info("Created text share %s", uid)
    return share


# ─── Update ──────────────────────────────────────────────


def update_text_share(
    share: Share, content: str, title: str | None = None, language: str | None = None
) -> None:
    if share.text_share is None:
        share.text_share = TextShare(
            id=str(uuid4()), urlid=share.urlid, content=content, language=language or "plaintext"
        )
    else:
        share.text_share.content = content
        if language is not None:
            share.text_share.language = language
    if title is not None:
        share.title = title
    db.commit()


def text_content(share: Share) -> dict | None:
    if share.text_share is None:
        return None
    return {
        "title": share.title,
        "content": share.text_share.content,
        "language": share.text_share.language,
    }


# ─── Delete ──────────────────────────────────────────────


def delete_share(share: Share) -> None:
    """Delete the DB rows first, then the physical files, then any session tokens."""
    uid = share.urlid
    storage_keys = [f.fileurl for f in share.files]
    db.delete(share)
    db.commit()
    storage_service.delete_files(storage_keys)
    password_service.revoke_tokens_for(uid)
    logger.info("Deleted share %s (%d files)", uid, len(storage_keys))
