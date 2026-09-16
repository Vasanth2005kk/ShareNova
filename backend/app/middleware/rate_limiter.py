"""
rate_limiter.py — slowapi rate limiting.
Replaces: backend/src/middleware/rateLimiter.ts (express-rate-limit)
"""

from slowapi import Limiter
from slowapi.util import get_remote_address

from app.config import settings

# Use configured limits from settings so they can be tuned per environment
limiter = Limiter(key_func=get_remote_address)

# Rate limit strings for use as decorators on routes. Defaults can be overridden
# via environment variables in `app.config.Settings`.
RETRIEVAL_LIMIT = settings.RATE_LIMIT_RETRIEVAL
PASSWORD_LIMIT = settings.RATE_LIMIT_PASSWORD
UPLOAD_LIMIT = settings.RATE_LIMIT_UPLOAD
