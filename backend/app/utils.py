"""Small shared helpers."""

from datetime import datetime, timezone


def utcnow() -> datetime:
    """Current UTC time as a naive datetime (the format stored in the database)."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


def to_iso_utc(value: datetime | None) -> str | None:
    """Serialise a naive-UTC datetime as ISO-8601 with an explicit 'Z' suffix,
    so browsers don't misread it as local time."""
    if value is None:
        return None
    if value.tzinfo is not None:
        value = value.astimezone(timezone.utc).replace(tzinfo=None)
    return value.isoformat(timespec="milliseconds") + "Z"
