"""
password_service.py — bcrypt hashing + in-memory session tokens.
Replaces: backend/src/services/PasswordService.ts
"""

import asyncio
import secrets
import time
import threading

import bcrypt

from app.config import settings

# In-memory session store — same structure as the Node.js Map<string, {uid, expiresAt}>
_session_store: dict[str, dict] = {}
_lock = threading.Lock()


def _hash_sync(password: str) -> str:
    rounds = settings.BCRYPT_ROUNDS or 12
    salt = bcrypt.gensalt(rounds=rounds)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def _verify_sync(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


async def hash_password(password: str) -> str:
    """Hash a password using bcrypt with configured rounds."""
    return await asyncio.to_thread(_hash_sync, password)


async def verify_password(password: str, hashed: str) -> bool:
    """Verify a password against a bcrypt hash."""
    return await asyncio.to_thread(_verify_sync, password, hashed)


def create_session_token(uid: str) -> str:
    """Create a session token for authenticated access to a private share (15-min TTL)."""
    token = secrets.token_hex(32)
    expires_at = time.time() + 15 * 60  # 15 minutes
    with _lock:
        _session_store[token] = {"uid": uid, "expires_at": expires_at}
    return token


def validate_session_token(token: str, uid: str) -> bool:
    """Validate a session token. Returns True if valid for the given UID."""
    with _lock:
        session = _session_store.get(token)
        if session is None:
            return False
        if time.time() > session["expires_at"]:
            del _session_store[token]
            return False
        if session["uid"] != uid:
            return False
        return True


def cleanup_expired_sessions() -> None:
    """Remove expired sessions from the in-memory store."""
    now = time.time()
    with _lock:
        expired = [k for k, v in _session_store.items() if now > v["expires_at"]]
        for k in expired:
            del _session_store[k]
