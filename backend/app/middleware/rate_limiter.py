"""
rate_limiter.py — slowapi rate limiting.
Replaces: backend/src/middleware/rateLimiter.ts (express-rate-limit)
"""

from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

# Rate limit strings for use as decorators on routes:
# - general:    100/15min  (handled globally in main.py)
# - retrieval:  20/min
# - password:   5/10min
# - upload:     10/hour
RETRIEVAL_LIMIT = "20/minute"
PASSWORD_LIMIT = "50/10minutes"
UPLOAD_LIMIT = "10/hour"
