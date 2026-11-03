"""Application configuration loaded from environment variables (and backend/.env)."""

import os
from pathlib import Path

from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parents[1]

load_dotenv(BACKEND_DIR / ".env")


def _env_str(name: str, default: str) -> str:
    value = os.environ.get(name, "").strip()
    return value or default


def _env_int(name: str, default: int) -> int:
    raw = os.environ.get(name, "").strip()
    if not raw:
        return default
    try:
        return int(raw)
    except ValueError as exc:
        raise RuntimeError(f"Environment variable {name} must be an integer, got {raw!r}") from exc


def _env_bool(name: str, default: bool) -> bool:
    raw = os.environ.get(name, "").strip().lower()
    if not raw:
        return default
    return raw in {"1", "true", "yes", "on"}


def _resolve_path(raw: str) -> Path:
    """Resolve a filesystem path relative to the backend directory."""
    path = Path(raw).expanduser()
    if not path.is_absolute():
        path = BACKEND_DIR / path
    return path.resolve()


def _resolve_database_url(raw: str) -> str:
    """Make relative SQLite paths relative to the backend directory.

    Accepts the legacy ``sqlite+aiosqlite:///`` prefix from older .env files.
    """
    for prefix in ("sqlite+aiosqlite:///", "sqlite+pysqlite:///", "sqlite:///"):
        if raw.startswith(prefix):
            db_path = _resolve_path(raw.removeprefix(prefix))
            db_path.parent.mkdir(parents=True, exist_ok=True)
            return f"sqlite:///{db_path.as_posix()}"
    return raw


class Config:
    APPNAME = _env_str("APPNAME", "ShareNova")
    ENV = _env_str("APP_ENV", _env_str("NODE_ENV", "development"))
    HOST = _env_str("HOST", "0.0.0.0")
    PORT = _env_int("PORT", 8000)
    LOG_LEVEL = _env_str("LOG_LEVEL", "INFO").upper()

    DATABASE_URL = _resolve_database_url(
        _env_str("DATABASE_URL", "sqlite:///storage/sharenova.db")
    )
    STORAGE_DIR = _resolve_path(_env_str("STORAGE_DIR", "storage"))

    BCRYPT_ROUNDS = _env_int("BCRYPT_ROUNDS", 12)
    SESSION_TOKEN_TTL_SECONDS = _env_int("SESSION_TOKEN_TTL_SECONDS", 15 * 60)

    MAX_UPLOAD_BYTES = _env_int("MAX_UPLOAD_BYTES", 500 * 1024 * 1024)
    MAX_FILES_PER_SHARE = _env_int("MAX_FILES_PER_SHARE", 20)
    MAX_TEXT_LENGTH = 500_000

    CLEANUP_INTERVAL_SECONDS = _env_int("CLEANUP_INTERVAL_SECONDS", 5 * 60)

    RATELIMIT_ENABLED = _env_bool("RATELIMIT_ENABLED", True)
    RATELIMIT_STORAGE_URI = _env_str("RATELIMIT_STORAGE_URI", "memory://")
    RATE_LIMIT_RETRIEVAL = _env_str("RATE_LIMIT_RETRIEVAL", "200/minute")
    RATE_LIMIT_PASSWORD = _env_str("RATE_LIMIT_PASSWORD", "50/10minutes")
    RATE_LIMIT_UPLOAD = _env_str("RATE_LIMIT_UPLOAD", "10/hour")
    RATE_LIMIT_UPDATE = _env_str("RATE_LIMIT_UPDATE", "120/minute")

    # Comma-separated list of allowed browser origins.
    FRONTEND_URL = _env_str("FRONTEND_URL", "http://localhost:5173")
    # Number of reverse proxies in front of the app (0 = none). Needed for correct
    # client IPs in rate limiting when deployed behind nginx etc.
    TRUST_PROXY_HOPS = _env_int("TRUST_PROXY_HOPS", 0)


def cors_origins(frontend_url: str) -> list[str]:
    """Parse the comma-separated FRONTEND_URL into allowed CORS origins."""
    origins: list[str] = []
    for origin in frontend_url.split(","):
        origin = origin.strip().rstrip("/")
        if not origin:
            continue
        origins.append(origin)
        if "localhost" in origin:
            origins.append(origin.replace("localhost", "127.0.0.1"))
    return origins
