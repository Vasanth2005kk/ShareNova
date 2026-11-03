"""Flask extension instances (initialised in create_app)."""

from flask import current_app
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

cors = CORS()
limiter = Limiter(key_func=get_remote_address)


# Rate limits are read from config at request time so they can be tuned via .env.
def retrieval_limit() -> str:
    return current_app.config["RATE_LIMIT_RETRIEVAL"]


def password_limit() -> str:
    return current_app.config["RATE_LIMIT_PASSWORD"]


def upload_limit() -> str:
    return current_app.config["RATE_LIMIT_UPLOAD"]


def update_limit() -> str:
    return current_app.config["RATE_LIMIT_UPDATE"]
