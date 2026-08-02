"""
database.py — SQLAlchemy 2 async engine + session factory (SQLite).
"""

from pathlib import Path
from typing import AsyncGenerator

from sqlalchemy import event
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from app.config import settings

# ── SQLite setup ──────────────────────────────────────────
# Resolve relative path (e.g. "./storage/sharenova.db") relative to backend/
db_url = settings.DATABASE_URL
if db_url.startswith("sqlite"):
    # Strip the driver prefix to get the plain file path
    raw_path = db_url.removeprefix("sqlite+aiosqlite:///")
    # If path is relative, resolve it relative to the backend directory
    db_path = Path(raw_path)
    if not db_path.is_absolute():
        db_path = (Path(__file__).resolve().parents[1] / db_path).resolve()
    db_path.parent.mkdir(parents=True, exist_ok=True)
    # Rebuild the URL with the resolved absolute path
    db_url = f"sqlite+aiosqlite:///{db_path.as_posix()}"

engine = create_async_engine(
    db_url,
    echo=False,
    # SQLite-specific: enable WAL for better concurrent reads
    connect_args={"check_same_thread": False},
)


# Enable WAL mode and foreign keys on every new connection
@event.listens_for(engine.sync_engine, "connect")
def _set_sqlite_pragmas(dbapi_conn, _connection_record):
    cursor = dbapi_conn.cursor()
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session() as session:
        yield session
