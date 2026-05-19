"""
storage_service.py — Local filesystem storage adapter.
Replaces: backend/src/services/StorageService.ts
"""

import asyncio
import random
import string
from pathlib import Path

from app.config import settings

_STORAGE_ROOT = Path(settings.STORAGE_DIR).expanduser()
if not _STORAGE_ROOT.is_absolute():
    _STORAGE_ROOT = (Path(__file__).resolve().parents[2] / _STORAGE_ROOT).resolve()
_STORAGE_ROOT.mkdir(parents=True, exist_ok=True)


def _resolve_storage_path(storage_key: str) -> Path:
    path = (_STORAGE_ROOT / storage_key).resolve()
    if not path.is_relative_to(_STORAGE_ROOT):
        raise ValueError("Invalid storage key")
    return path


def _cleanup_empty_parents(path: Path) -> None:
    for parent in path.parents:
        if parent == _STORAGE_ROOT:
            break
        try:
            parent.rmdir()
        except OSError:
            break


async def upload_file(storage_key: str, body: bytes, mime_type: str) -> None:
    """Persist a file buffer to local storage."""
    path = _resolve_storage_path(storage_key)
    path.parent.mkdir(parents=True, exist_ok=True)
    await asyncio.to_thread(path.write_bytes, body)


def get_file_path(storage_key: str) -> Path | None:
    """Resolve a storage key to an on-disk path."""
    try:
        path = _resolve_storage_path(storage_key)
    except ValueError:
        return None
    if not path.exists():
        return None
    return path


async def get_file_bytes(storage_key: str) -> bytes | None:
    """Get file content as bytes (used for ZIP streaming)."""
    try:
        path = _resolve_storage_path(storage_key)
    except ValueError:
        return None
    if not path.exists():
        return None
    return await asyncio.to_thread(path.read_bytes)


async def delete_file(storage_key: str) -> None:
    """Delete a single file from local storage."""
    try:
        path = _resolve_storage_path(storage_key)
    except ValueError:
        return
    await asyncio.to_thread(path.unlink, missing_ok=True)
    _cleanup_empty_parents(path)


async def delete_files(storage_keys: list[str]) -> None:
    """Delete multiple files from local storage."""
    for storage_key in storage_keys:
        await delete_file(storage_key)


def generate_storage_key(uid: str, filename: str) -> str:
    """Generate a storage key: shares/{uid}/{random}_{filename}."""
    safe_name = Path(filename).name or "file"
    suffix = "".join(random.choices(string.ascii_lowercase + string.digits, k=6))
    return f"shares/{uid}/{suffix}_{safe_name}"
