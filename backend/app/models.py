"""ORM models. Table layout is unchanged from the previous backend, so existing
SQLite databases keep working without a migration."""

from datetime import datetime

from sqlalchemy import BigInteger, Boolean, DateTime, ForeignKey, Index, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.utils import utcnow


class Share(Base):
    __tablename__ = "shares"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    urlid: Mapped[str] = mapped_column(String(6), unique=True, nullable=False, index=True)
    title: Mapped[str | None] = mapped_column(String, nullable=True)
    password: Mapped[str | None] = mapped_column(String, nullable=True)  # bcrypt hash
    is_private: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)  # naive UTC
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=utcnow, server_default=func.now(), nullable=False
    )

    files: Mapped[list["File"]] = relationship(
        back_populates="share", cascade="all, delete-orphan", passive_deletes=True
    )
    text_share: Mapped["TextShare | None"] = relationship(
        back_populates="share", uselist=False, cascade="all, delete-orphan", passive_deletes=True
    )

    __table_args__ = (Index("ix_shares_expires_at", "expires_at"),)

    @property
    def is_expired(self) -> bool:
        return self.expires_at is not None and self.expires_at <= utcnow()

    @property
    def share_type(self) -> str:
        return "TEXT" if self.text_share is not None else "FILE"


class File(Base):
    __tablename__ = "files"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    urlid: Mapped[str] = mapped_column(
        String, ForeignKey("shares.urlid", ondelete="CASCADE"), index=True, nullable=False
    )
    filename: Mapped[str] = mapped_column(String, nullable=False)  # original name shown to users
    filetype: Mapped[str] = mapped_column(String, nullable=False)  # MIME type
    filesize: Mapped[int] = mapped_column(BigInteger, nullable=False)
    fileurl: Mapped[str] = mapped_column(String, nullable=False)  # storage key relative to STORAGE_DIR

    share: Mapped[Share] = relationship(back_populates="files")


class TextShare(Base):
    __tablename__ = "text_shares"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    urlid: Mapped[str] = mapped_column(
        String, ForeignKey("shares.urlid", ondelete="CASCADE"), unique=True, index=True, nullable=False
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    language: Mapped[str] = mapped_column(String, default="plaintext", nullable=False)

    share: Mapped[Share] = relationship(back_populates="text_share")
