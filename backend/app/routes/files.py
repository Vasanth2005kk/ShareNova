"""File downloads from local storage: single files and the whole share as a ZIP."""

import logging
import os
import tempfile
import zipfile

from flask import Blueprint, send_file
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import db
from app.errors import ApiError
from app.extensions import limiter, retrieval_limit
from app.models import File
from app.security import require_access
from app.services import share_service, storage_service, validation

logger = logging.getLogger(__name__)

files_bp = Blueprint("files", __name__, url_prefix="/api/files")
download_bp = Blueprint("download", __name__, url_prefix="/api/download")

_ZIP_SPOOL_BYTES = 32 * 1024 * 1024  # keep small archives in memory, spill larger ones to disk


@files_bp.get("/<file_id>/download")
@limiter.limit(retrieval_limit)
def download_file(file_id: str):
    file = db.execute(
        select(File).where(File.id == file_id).options(selectinload(File.share))
    ).scalar_one_or_none()
    if file is None or file.share.is_expired:
        raise ApiError(404, "File not found or share has expired")

    require_access(file.share)

    path = storage_service.existing_path(file.fileurl)
    if path is None:
        logger.warning("File %s is in the database but missing on disk", file.id)
        raise ApiError(404, "File not found")

    return send_file(
        path,
        mimetype=file.filetype or "application/octet-stream",
        as_attachment=True,
        download_name=file.filename,
        conditional=True,
    )


def _unique_name(name: str, used: set[str]) -> str:
    """Avoid duplicate entries in the archive: 'a.txt', 'a (1).txt', ..."""
    candidate, (stem, ext), n = name, os.path.splitext(name), 1
    while candidate in used:
        candidate = f"{stem} ({n}){ext}"
        n += 1
    used.add(candidate)
    return candidate


@download_bp.get("/<uid>/all")
@limiter.limit(retrieval_limit)
def download_all_as_zip(uid: str):
    uid = validation.clean_uid(uid)
    share = share_service.get_active_share(uid)
    if share is None:
        raise ApiError(404, "Share not found or has expired")

    require_access(share)

    present = [(f, storage_service.existing_path(f.fileurl)) for f in share.files]
    present = [(f, p) for f, p in present if p is not None]
    if not present:
        raise ApiError(404, "No files found for this share")

    archive = tempfile.SpooledTemporaryFile(max_size=_ZIP_SPOOL_BYTES)
    try:
        used: set[str] = set()
        with zipfile.ZipFile(archive, "w", zipfile.ZIP_DEFLATED, compresslevel=5) as zf:
            for f, path in present:
                zf.write(path, arcname=_unique_name(f.filename, used))
        archive.seek(0)
    except Exception:
        archive.close()
        raise

    # send_file closes the temporary file when the response is finished.
    return send_file(
        archive,
        mimetype="application/zip",
        as_attachment=True,
        download_name=f"sharenova-{uid}.zip",
    )
