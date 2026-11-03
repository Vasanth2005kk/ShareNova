"""6-digit share code generation and validation."""

import re
import secrets

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Share

UID_LENGTH = 6
_UID_RE = re.compile(rf"\d{{{UID_LENGTH}}}")
_SEPARATORS_RE = re.compile(r"[\s-]")


def _candidate() -> str:
    return str(secrets.randbelow(10**UID_LENGTH)).zfill(UID_LENGTH)


def generate_uid(session: Session, max_retries: int = 20) -> str:
    """Return a code not currently used by any share (expired or not)."""
    for _ in range(max_retries):
        candidate = _candidate()
        taken = session.execute(
            select(Share.id).where(Share.urlid == candidate).limit(1)
        ).first()
        if taken is None:
            return candidate
    raise RuntimeError("Failed to generate a unique share code")


def normalize_uid(raw: str) -> str:
    """Strip spaces/dashes ("123 456" -> "123456"). Other characters are kept so
    that malformed codes fail validation instead of matching a different share."""
    return _SEPARATORS_RE.sub("", raw or "")


def is_valid_uid(uid: str) -> bool:
    return bool(_UID_RE.fullmatch(uid or ""))


def format_uid(uid: str) -> str:
    """'123456' -> '123 456'."""
    return " ".join(uid[i : i + 3] for i in range(0, len(uid), 3))
