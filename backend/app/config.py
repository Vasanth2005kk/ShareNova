"""
config.py — Pydantic-settings based environment validation.
Replaces: backend/src/config/env.ts (Zod + dotenv)
"""

from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings

BACKEND_DIR = Path(__file__).resolve().parents[1]
DEFAULT_DB_PATH = BACKEND_DIR / "storage" / "sharenova.db"


class Settings(BaseSettings):
    # Server
    PORT: int = Field(default=8000)
    NODE_ENV: str = Field(default="development")

    # Database
    DATABASE_URL: str = Field(
        default=f"sqlite+aiosqlite:///{DEFAULT_DB_PATH.as_posix()}",
        min_length=1,
    )

    # Storage
    STORAGE_DIR: str = Field(default="storage")

    # Security
    BCRYPT_ROUNDS: int = Field(default=12)
    SESSION_SECRET: str = Field(default="change_me_to_a_random_32_char_string")

    # Limits
    MAX_UPLOAD_BYTES: int = Field(default=524288000)  # 500MB

    # CORS
    FRONTEND_URL: str = Field(default="http://localhost:5173")

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
