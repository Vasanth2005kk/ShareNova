"""
database.py — SQLAlchemy 2 async engine + session factory.
Replaces: backend/src/db/prisma.ts
"""

from pathlib import Path
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from app.config import settings

# Ensure the storage directory exists before SQLite initializes a file DB there.
db_url = settings.DATABASE_URL
if db_url.startswith("sqlite"):
    db_path = db_url.removeprefix("sqlite+aiosqlite:///")
    Path(db_path).parent.mkdir(parents=True, exist_ok=True)
    engine = create_async_engine(db_url, echo=False)
else:
    if db_url.startswith("postgresql://"):
        db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    engine = create_async_engine(db_url, echo=False, pool_size=10, max_overflow=20)

async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session() as session:
        yield session
