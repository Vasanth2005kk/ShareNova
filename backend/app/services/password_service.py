"""bcrypt password hashing and short-lived in-memory session tokens.

Session tokens live in process memory, so run the backend as a single process
(threads are fine). Tokens use a sliding expiry: each successful use extends them.
"""

import secrets
import threading
import time

import bcrypt
from flask import current_app

_BCRYPT_MAX_BYTES = 72

_sessions: dict[str, dict] = {}
_lock = threading.Lock()


def _encode(password: str) -> bytes:
    # bcrypt only uses the first 72 bytes; bcrypt>=5 raises instead of truncating.
    # Truncating explicitly keeps hashes compatible with those created by bcrypt 4.x.
    return password.encode("utf-8")[:_BCRYPT_MAX_BYTES]


def hash_password(password: str) -> str:
    rounds = current_app.config["BCRYPT_ROUNDS"]
    return bcrypt.hashpw(_encode(password), bcrypt.gensalt(rounds=rounds)).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(_encode(password), hashed.encode("utf-8"))
    except ValueError:
        return False


def _ttl() -> int:
    return current_app.config["SESSION_TOKEN_TTL_SECONDS"]


def create_session_token(uid: str) -> str:
    token = secrets.token_hex(32)
    with _lock:
        _sessions[token] = {"uid": uid, "expires_at": time.time() + _ttl()}
    return token


def validate_session_token(token: str | None, uid: str) -> bool:
    if not token:
        return False
    now = time.time()
    with _lock:
        session = _sessions.get(token)
        if session is None:
            return False
        if now > session["expires_at"]:
            del _sessions[token]
            return False
        if session["uid"] != uid:
            return False
        session["expires_at"] = now + _ttl()
        return True


def revoke_tokens_for(uid: str) -> None:
    with _lock:
        for token in [t for t, s in _sessions.items() if s["uid"] == uid]:
            del _sessions[token]


def cleanup_expired_sessions() -> int:
    now = time.time()
    with _lock:
        expired = [t for t, s in _sessions.items() if now > s["expires_at"]]
        for token in expired:
            del _sessions[token]
    return len(expired)
