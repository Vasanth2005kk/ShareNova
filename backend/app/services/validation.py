"""Request payload validation (JSON bodies, form fields and uploaded files)."""

import os

import magic
from flask import current_app, request
from werkzeug.datastructures import FileStorage

from app.errors import ApiError
from app.services.uid_service import is_valid_uid, normalize_uid

EXPIRY_OPTIONS = ("30m", "1h", "6h", "24h", "7d", "30d")

BLOCKED_MIMES = {
    "application/x-msdownload",
    "application/x-msdos-program",
    "application/x-sh",
    "application/x-bat",
    "application/x-msi",
    "application/x-dosexec",
    "application/x-executable",
}
BLOCKED_EXTENSIONS = {
    ".exe", ".bat", ".cmd", ".com", ".msi", ".scr",
    ".pif", ".vbs", ".js", ".ws", ".wsf",
}
_MAGIC_SNIFF_BYTES = 2048


def _fail(details: list[dict]):
    raise ApiError(400, "Validation failed", details)


def clean_uid(raw: str) -> str:
    uid = normalize_uid(raw)
    if not is_valid_uid(uid):
        raise ApiError(400, "Invalid UID format - must be 6 digits")
    return uid


def json_body() -> dict:
    body = request.get_json(silent=True)
    if not isinstance(body, dict):
        raise ApiError(400, "Request body must be a JSON object")
    return body


def _optional_str(body: dict, field: str, max_len: int, errors: list, empty_to_none=True):
    value = body.get(field)
    if value is None:
        return None
    if not isinstance(value, str):
        errors.append({"field": field, "message": "must be a string"})
        return None
    if empty_to_none and value == "":
        return None
    if len(value) > max_len:
        errors.append({"field": field, "message": f"must be at most {max_len} characters"})
    return value


def _content(body: dict, errors: list, required: bool) -> str:
    max_len = current_app.config["MAX_TEXT_LENGTH"]
    if "content" not in body or body["content"] is None:
        if required:
            errors.append({"field": "content", "message": "is required"})
        return ""
    value = body["content"]
    if not isinstance(value, str):
        errors.append({"field": "content", "message": "must be a string"})
        return ""
    if len(value) > max_len:
        errors.append({"field": "content", "message": f"must be at most {max_len} characters"})
    return value


def expires_in_value(raw, errors: list) -> str | None:
    if raw in (None, ""):
        return None
    if raw not in EXPIRY_OPTIONS:
        errors.append({"field": "expiresIn", "message": f"must be one of {', '.join(EXPIRY_OPTIONS)}"})
        return None
    return raw


def password_value(raw, errors: list) -> str | None:
    if raw in (None, ""):
        return None
    if not isinstance(raw, str):
        errors.append({"field": "password", "message": "must be a string"})
        return None
    if len(raw) > 128:
        errors.append({"field": "password", "message": "must be at most 128 characters"})
    return raw


def text_share_create(body: dict) -> dict:
    errors: list[dict] = []
    data = {
        "title": _optional_str(body, "title", 200, errors),
        "content": _content(body, errors, required=False),
        "language": _optional_str(body, "language", 50, errors),
        "expires_in": expires_in_value(body.get("expiresIn"), errors),
        "password": password_value(body.get("password"), errors),
    }
    if errors:
        _fail(errors)
    return data


def text_share_update(body: dict) -> dict:
    errors: list[dict] = []
    data = {
        "title": _optional_str(body, "title", 200, errors),
        "content": _content(body, errors, required=True),
        "language": _optional_str(body, "language", 50, errors),
    }
    if errors:
        _fail(errors)
    return data


def password_verify(body: dict) -> str:
    password = body.get("password")
    if not isinstance(password, str) or not password:
        _fail([{"field": "password", "message": "is required"}])
    return password


def display_filename(upload: FileStorage) -> str:
    """Original file name without any client-supplied directory components."""
    name = (upload.filename or "").replace("\\", "/").rsplit("/", 1)[-1].strip()
    return name[:255] or "file"


def check_upload_allowed(upload: FileStorage, filename: str) -> None:
    """Reject executables by extension and by magic bytes (not the client Content-Type)."""
    ext = os.path.splitext(filename)[1].lower()
    if ext in BLOCKED_EXTENSIONS:
        raise ApiError(400, f'File type "{ext}" is not allowed: {filename}')

    head = upload.stream.read(_MAGIC_SNIFF_BYTES)
    upload.stream.seek(0)
    detected = magic.from_buffer(head, mime=True) if head else "application/x-empty"
    if detected in BLOCKED_MIMES:
        raise ApiError(400, f'File type "{detected}" is not allowed: {filename}')
