"""
uid_service.py — Cryptographic UID generation with collision retry.
Replaces: backend/src/services/UIDService.ts

Algorithm: secrets.token_bytes(6) → big-endian int → decimal string → first 12 chars → zero-pad
"""

import secrets
import re

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Share

UID_LENGTH = 6
UID_MODULO = 10**UID_LENGTH


def _generate_uid_candidate() -> str:
    """Generate a single 6-digit UID candidate from random bytes."""
    raw = secrets.token_bytes(4)
    num = int.from_bytes(raw, byteorder="big") % UID_MODULO
    return str(num).zfill(UID_LENGTH)


async def generate_uid(db: AsyncSession, max_retries: int = 10) -> str:
    """Generate a unique 6-digit UID, retrying on collision up to max_retries times."""
    for _ in range(max_retries):
        candidate = _generate_uid_candidate()
        existing = await db.execute(select(Share.id).where(Share.uid == candidate).limit(1))
        if existing.scalar_one_or_none() is None:
            return candidate
    raise RuntimeError("Failed to generate a unique UID after max retries")


def normalize_uid(raw: str) -> str:
    """Strip all non-digit characters."""
    return re.sub(r"\D", "", raw)[:UID_LENGTH]


def is_valid_uid(uid: str) -> bool:
    """Check if a string is exactly 6 digits."""
    return bool(re.fullmatch(rf"\d{{{UID_LENGTH}}}", uid))


def format_uid(uid: str) -> str:
    """Format a 6-digit UID into groups: '123 456'."""
    clean = re.sub(r"\D", "", uid)[:UID_LENGTH]
    parts = [clean[i : i + 3] for i in range(0, len(clean), 3)]
    return " ".join(parts)
