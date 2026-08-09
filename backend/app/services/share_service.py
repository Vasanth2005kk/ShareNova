"""
share_service.py — Core CRUD operations for shares.
Replaces: backend/src/services/ShareService.ts
"""

from datetime import datetime, timedelta, timezone
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import Share, File, TextShare
from app.services.uid_service import generate_uid, format_uid, is_valid_uid
from app.services.password_service import hash_password
from app.services import storage_service

# ─── Expiry mapping ──────────────────────────────────────

EXPIRY_MAP: dict[str, timedelta] = {
    "30m": timedelta(minutes=30),
    "1h": timedelta(hours=1),
    "6h": timedelta(hours=6),
    "24h": timedelta(hours=24),
    "7d": timedelta(days=7),
    "30d": timedelta(days=30),
}


def _calculate_expiry(expires_in: str | None) -> datetime | None:
    if not expires_in or expires_in not in EXPIRY_MAP:
        return None
    return datetime.now(timezone.utc) + EXPIRY_MAP[expires_in]


def _is_expired(expires_at: datetime | None) -> bool:
    if not expires_at:
        return False
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    return expires_at < datetime.now(timezone.utc)


# ─── Create file share ──────────────────────────────────


async def create_file_share(
    db: AsyncSession,
    files: list[dict],
    expires_in: str | None = None,
    password: str | None = None,
) -> str:
    """Create a file share: upload files to storage, create DB records, return UID."""
    uid = await generate_uid(db)
    expires_at = _calculate_expiry(expires_in)
    is_private = bool(password)
    pw_hash = await hash_password(password) if password else None

    # Upload all files to storage
    file_records = []
    for f in files:
        storage_key = storage_service.generate_storage_key(uid, f["filename"])
        await storage_service.upload_file(storage_key, f["buffer"], f["mime_type"])
        file_records.append(
            File(
                id=str(uuid4()),
                urlid=uid,
                filename=f["filename"],
                filetype=f["mime_type"],
                filesize=f["size"],
                fileurl=storage_key,
            )
        )

    share = Share(
        id=str(uuid4()),
        urlid=uid,
        title=None,
        password=pw_hash,
        is_private=is_private,
        expires_at=expires_at,
        files=file_records,
    )

    db.add(share)
    await db.commit()
    return uid


# ─── Create text share ──────────────────────────────────


async def create_text_share(
    db: AsyncSession,
    content: str,
    title: str | None = None,
    language: str | None = None,
    expires_in: str | None = None,
    password: str | None = None,
    target_uid: str | None = None,
) -> str:
    """Create a text share: store in DB, return UID."""
    if target_uid and is_valid_uid(target_uid):
        uid = target_uid
    else:
        uid = await generate_uid(db)
    expires_at = _calculate_expiry(expires_in)
    is_private = bool(password)
    pw_hash = await hash_password(password) if password else None

    text_share = TextShare(
        id=str(uuid4()),
        urlid=uid,
        content=content,
        language=language or "plaintext",
    )

    share = Share(
        id=str(uuid4()),
        urlid=uid,
        title=title,
        password=pw_hash,
        is_private=is_private,
        expires_at=expires_at,
        text_share=text_share,
    )

    db.add(share)
    await db.commit()
    return uid


# ─── Get share metadata ─────────────────────────────────


async def get_share_by_uid(db: AsyncSession, uid: str) -> dict | None:
    """Get share metadata by UID. Does NOT include text content."""
    result = await db.execute(
        select(Share)
        .where(Share.urlid == uid)
        .options(selectinload(Share.files), selectinload(Share.text_share))
    )
    share = result.scalar_one_or_none()
    if not share:
        return None

    # Check expiry
    if _is_expired(share.expires_at):
        return None

    total_size = (
        sum(f.filesize for f in share.files)
        if share.files
        else len(share.text_share.content.encode("utf-8"))
    )
    share_type = "TEXT" if share.text_share else "FILE"
    return {
        "uid": share.urlid,
        "type": share_type,
        "isPrivate": share.is_private,
        "expiresAt": share.expires_at.isoformat() if share.expires_at else None,
        "createdAt": share.created_at.isoformat(),
        "totalSize": str(total_size),
        "fileCount": len(share.files),
        "files": [
            {
                "id": f.id,
                "filename": f.filename,
                "mimeType": f.filetype,
                "size": str(f.filesize),
            }
            for f in share.files
        ],
        "textShare": (
            {"title": share.title, "language": share.text_share.language}
            if share.text_share
            else None
        ),
    }


# ─── Update text share ───────────────────────────────────


async def update_text_share(
    db: AsyncSession,
    uid: str,
    content: str,
    title: str | None = None,
    language: str | None = None,
) -> bool:
    """Update text content and title for an existing share in DB."""
    result = await db.execute(
        select(Share).where(Share.urlid == uid).options(selectinload(Share.text_share))
    )
    share = result.scalar_one_or_none()
    if not share:
        return False

    if _is_expired(share.expires_at):
        return False

    if share.text_share:
        share.text_share.content = content
        if title is not None:
            share.title = title
        if language is not None:
            share.text_share.language = language
    else:
        text_share = TextShare(
            id=str(uuid4()),
            urlid=uid,
            content=content,
            language=language or "plaintext",
        )
        share.text_share = text_share
        if title is not None:
            share.title = title

    await db.commit()
    return True


# ─── Get text content ───────────────────────────────────


async def get_text_content(db: AsyncSession, uid: str) -> dict | None:
    """Get text content for a share."""
    result = await db.execute(
        select(Share).where(Share.urlid == uid).options(selectinload(Share.text_share))
    )
    share = result.scalar_one_or_none()
    if not share or not share.text_share:
        return None
    if _is_expired(share.expires_at):
        return None
    return {
        "title": share.title,
        "content": share.text_share.content,
        "language": share.text_share.language,
    }


# ─── Get password hash ──────────────────────────────────


async def get_share_password_hash(db: AsyncSession, uid: str) -> str | None:
    """Get the password hash for a share."""
    result = await db.execute(select(Share.password).where(Share.urlid == uid))
    row = result.scalar_one_or_none()
    return row


# ─── Get file for download ──────────────────────────────


async def get_file_for_download(db: AsyncSession, file_id: str) -> dict | None:
    """Get file details for download (including internal storageKey)."""
    result = await db.execute(
        select(File).where(File.id == file_id).options(selectinload(File.share))
    )
    file = result.scalar_one_or_none()
    if not file:
        return None
    if _is_expired(file.share.expires_at):
        return None
    return {
        "storage_key": file.fileurl,
        "filename": file.filename,
        "mime_type": file.filetype,
        "share_uid": file.share.urlid,
        "is_private": file.share.is_private,
    }


# ─── Get all files for ZIP ──────────────────────────────


async def get_share_files(db: AsyncSession, uid: str) -> list[dict] | None:
    """Get all files for a share (used for ZIP download)."""
    result = await db.execute(
        select(Share).where(Share.urlid == uid).options(selectinload(Share.files))
    )
    share = result.scalar_one_or_none()
    if not share:
        return None
    if _is_expired(share.expires_at):
        return None
    return [{"storage_key": f.fileurl, "filename": f.filename} for f in share.files]
