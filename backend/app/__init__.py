"""ShareNova Flask application factory."""

import logging

from flask import Flask
from werkzeug.middleware.proxy_fix import ProxyFix

from app.config import Config, cors_origins
from app.database import init_db
from app.errors import register_error_handlers
from app.extensions import cors, limiter
from app.routes import register_blueprints
from app.security import register_security_headers
from app.services.cleanup_service import start_cleanup_worker


def create_app(config_overrides: dict | None = None, start_background_jobs: bool = True) -> Flask:
    app = Flask(__name__)
    app.config.from_object(Config)
    if config_overrides:
        app.config.update(config_overrides)
    # Hard request-size cap enforced by Werkzeug (uploads + multipart overhead).
    if not app.config.get("MAX_CONTENT_LENGTH"):
        app.config["MAX_CONTENT_LENGTH"] = app.config["MAX_UPLOAD_BYTES"] + 1024 * 1024

    logging.basicConfig(
        level=app.config["LOG_LEVEL"],
        format="%(asctime)s %(levelname)-7s %(name)s: %(message)s",
    )

    app.json.sort_keys = False
    app.url_map.strict_slashes = False

    hops = app.config["TRUST_PROXY_HOPS"]
    if hops > 0:
        app.wsgi_app = ProxyFix(app.wsgi_app, x_for=hops, x_proto=hops, x_host=hops)

    app.config["STORAGE_DIR"].mkdir(parents=True, exist_ok=True)
    init_db(app)

    cors.init_app(
        app,
        resources={r"/api/*": {"origins": cors_origins(app.config["FRONTEND_URL"])}},
        allow_headers=["Content-Type", "X-Session-Token"],
        expose_headers=["Content-Disposition"],
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    )
    app.config.setdefault("RATELIMIT_HEADERS_ENABLED", True)
    limiter.init_app(app)

    register_security_headers(app)
    register_error_handlers(app)
    register_blueprints(app)

    if start_background_jobs:
        start_cleanup_worker(app)

    return app
