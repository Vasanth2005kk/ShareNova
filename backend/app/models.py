"""
models.py — SQLAlchemy 2 ORM models.
Replaces: backend/prisma/schema.prisma
"""

import enum
from datetime import datetime

from sqlalchemy import (
    BigInteger,
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ShareType(str, enum.Enum):
    FILE = "FILE"
    TEXT = "TEXT"


class Share(Base):
    __tablename__ = "shares"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    uid: Mapped[str] = mapped_column(String(6), unique=True, nullable=False, index=True)
    type: Mapped[ShareType] = mapped_column(Enum(ShareType, name="share_type"), nullable=False)
    is_private: Mapped[bool] = mapped_column(Boolean, default=False)
    password_hash: Mapped[str | None] = mapped_column(String, nullable=True)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    total_size: Mapped[int] = mapped_column(BigInteger, default=0)

    files: Mapped[list["File"]] = relationship(
        "File", back_populates="share", cascade="all, delete-orphan"
    )
    text_share: Mapped["TextShare | None"] = relationship(
        "TextShare", back_populates="share", uselist=False, cascade="all, delete-orphan"
    )

    __table_args__ = (Index("ix_shares_expires_at", "expires_at"),)


class File(Base):
    __tablename__ = "files"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    share_id: Mapped[str] = mapped_column(String, ForeignKey("shares.id", ondelete="CASCADE"))
    filename: Mapped[str] = mapped_column(String, nullable=False)
    storage_key: Mapped[str] = mapped_column(String, nullable=False)
    mime_type: Mapped[str] = mapped_column(String, nullable=False)
    size: Mapped[int] = mapped_column(BigInteger, nullable=False)

    share: Mapped["Share"] = relationship("Share", back_populates="files")


class TextShare(Base):
    __tablename__ = "text_shares"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    share_id: Mapped[str] = mapped_column(
        String, ForeignKey("shares.id", ondelete="CASCADE"), unique=True
    )
    title: Mapped[str | None] = mapped_column(String, nullable=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    language: Mapped[str] = mapped_column(String, default="plaintext")

    share: Mapped["Share"] = relationship("Share", back_populates="text_share")
