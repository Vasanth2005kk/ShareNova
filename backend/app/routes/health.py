"""/api/health — liveness and database connectivity check."""

import logging

from flask import Blueprint
from sqlalchemy import text

from app.database import db
from app.errors import ApiError, success

logger = logging.getLogger(__name__)

bp = Blueprint("health", __name__, url_prefix="/api/health")


@bp.get("")
def health_check():
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        logger.exception("Health check: database unavailable")
        raise ApiError(503, "Database connection failed") from None
    return success({"status": "healthy", "database": "connected"})
