"""
schemas.py — Pydantic v2 request/response models.
Replaces: Zod validation schemas in routes/shares.ts
"""

from pydantic import BaseModel, Field, field_validator


# ─── Request schemas ─────────────────────────────────────

class TextShareCreate(BaseModel):
    title: str | None = Field(default=None, max_length=200)
    content: str = Field(default="", max_length=500000)
    language: str | None = Field(default=None, max_length=50)
    expiresIn: str | None = Field(default=None, pattern=r"^(30m|1h|6h|24h|7d|30d)$")
    password: str | None = Field(default=None, max_length=128)

    @field_validator("password", mode="before")
    @classmethod
    def validate_password(cls, v):
        if v == "" or v is None:
            return None
        if isinstance(v, str) and len(v) < 4:
            raise ValueError("Password must be at least 4 characters")
        return v

    @field_validator("expiresIn", "title", mode="before")
    @classmethod
    def empty_string_to_none(cls, v):
        if v == "":
            return None
        return v


class TextShareUpdate(BaseModel):
    title: str | None = Field(default=None, max_length=200)
    content: str = Field(min_length=0, max_length=500000)
    language: str | None = Field(default=None, max_length=50)

    @field_validator("title", "language", mode="before")
    @classmethod
    def empty_string_to_none(cls, v):
        if v == "":
            return None
        return v


class PasswordVerify(BaseModel):
    password: str = Field(min_length=1)


# ─── Response schemas ────────────────────────────────────

class FileInfo(BaseModel):
    id: str
    filename: str
    mimeType: str
    size: str


class TextShareInfo(BaseModel):
    title: str | None
    language: str


class ShareMetadataResponse(BaseModel):
    uid: str
    type: str
    isPrivate: bool
    expiresAt: str | None
    createdAt: str
    totalSize: str
    fileCount: int | None = None
    files: list[FileInfo] | None = None
    textShare: TextShareInfo | None = None


class CreateShareResponse(BaseModel):
    uid: str
    formattedUID: str


class VerifyResponse(BaseModel):
    sessionToken: str


class TextContentResponse(BaseModel):
    title: str | None
    content: str
    language: str


# ─── API envelope ────────────────────────────────────────

class ApiResponse(BaseModel):
    success: bool
    data: dict | list | None = None
    error: str | None = None
    details: list[dict] | None = None
