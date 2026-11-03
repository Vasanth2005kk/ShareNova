"""Local filesystem storage for uploaded files.

Files are stored under ``STORAGE_DIR/shares/<uid>/<random>_<safe-name>``. Only the
relative storage key is saved in the database; every key is resolved and checked to
stay inside the storage root, which prevents path traversal.
"""

import logging
import secrets
from pathlib import Path

from flask import current_app
from werkzeug.datastructures import FileStorage
from werkzeug.utils import secure_filename

logger = logging.getLogger(__name__)


def storage_root() -> Path:
    root: Path = current_app.config["STORAGE_DIR"]
    root.mkdir(parents=True, exist_ok=True)
    return root


def resolve(storage_key: str) -> Path | None:
    """Map a storage key to an absolute path inside the storage root, or None if invalid."""
    if not storage_key:
        return None
    root = storage_root()
    path = (root / storage_key).resolve()
    if path == root or not path.is_relative_to(root):
        logger.warning("Rejected storage key outside storage root: %r", storage_key)
        return None
    return path


def generate_storage_key(uid: str, filename: str) -> str:
    safe_name = secure_filename(filename) or "file"
    return f"shares/{uid}/{secrets.token_hex(8)}_{safe_name}"


def save_upload(storage_key: str, upload: FileStorage) -> int:
    """Stream an uploaded file to disk and return its size in bytes."""
    path = resolve(storage_key)
    if path is None:
        raise ValueError("Invalid storage key")
    path.parent.mkdir(parents=True, exist_ok=True)
    upload.save(path)
    return path.stat().st_size


def existing_path(storage_key: str) -> Path | None:
    path = resolve(storage_key)
    if path is None or not path.is_file():
        return None
    return path


def delete_file(storage_key: str) -> None:
    """Delete a stored file (missing files are ignored) and prune empty share folders."""
    path = resolve(storage_key)
    if path is None:
        return
    try:
        path.unlink(missing_ok=True)
    except OSError:
        logger.exception("Failed to delete stored file %s", storage_key)
        return
    root = storage_root()
    for parent in path.parents:
        if parent == root:
            break
        try:
            parent.rmdir()  # only succeeds if empty
        except OSError:
            break


def delete_files(storage_keys: list[str]) -> None:
    for key in storage_keys:
        delete_file(key)
