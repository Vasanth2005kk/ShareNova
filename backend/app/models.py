"""
models.py — SQLAlchemy 2 ORM models.
Replaces: backend/prisma/schema.prisma
"""

from datetime import datetime

from sqlalchemy import (
    BigInteger,
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Share(Base):
    __tablename__ = "shares"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    urlid: Mapped[str] = mapped_column(String(6), unique=True, nullable=False, index=True)
    title: Mapped[str | None] = mapped_column(String, nullable=True)
    password: Mapped[str | None] = mapped_column(String, nullable=True)
    is_private: Mapped[bool] = mapped_column(Boolean, default=False)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now()
    )

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
    urlid: Mapped[str] = mapped_column(String, ForeignKey("shares.urlid", ondelete="CASCADE"), index=True)
    filename: Mapped[str] = mapped_column(String, nullable=False)
    filetype: Mapped[str] = mapped_column(String, nullable=False)
    filesize: Mapped[int] = mapped_column(BigInteger, nullable=False)
    fileurl: Mapped[str] = mapped_column(String, nullable=False)

    share: Mapped["Share"] = relationship("Share", back_populates="files")


class TextShare(Base):
    __tablename__ = "text_shares"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    urlid: Mapped[str] = mapped_column(
        String, ForeignKey("shares.urlid", ondelete="CASCADE"), unique=True, index=True
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    language: Mapped[str] = mapped_column(String, default="plaintext")

    share: Mapped["Share"] = relationship("Share", back_populates="text_share")
