"""JSON response envelope and centralised error handling.

Every API response has the shape ``{"success": bool, "data"?: ..., "error"?: str}``.
"""

import logging

from flask import Flask, jsonify
from werkzeug.exceptions import HTTPException

logger = logging.getLogger(__name__)


class ApiError(Exception):
    """Raise from routes/services to return a JSON error with a status code."""

    def __init__(self, status: int, message: str, details: list | None = None):
        super().__init__(message)
        self.status = status
        self.message = message
        self.details = details


def success(data=None, status: int = 200):
    return jsonify({"success": True, "data": data}), status


def _error_body(message: str, details: list | None = None) -> dict:
    body = {"success": False, "error": message}
    if details:
        body["details"] = details
    return body


_HTTP_MESSAGES = {
    400: "Bad request",
    404: "Endpoint not found",
    405: "Method not allowed",
    413: "Upload is too large",
    429: "Too many requests — please try again later",
}


def register_error_handlers(app: Flask) -> None:
    @app.errorhandler(ApiError)
    def _handle_api_error(exc: ApiError):
        return jsonify(_error_body(exc.message, exc.details)), exc.status

    @app.errorhandler(HTTPException)
    def _handle_http_exception(exc: HTTPException):
        status = exc.code or 500
        message = _HTTP_MESSAGES.get(status, exc.name)
        if status == 413:
            limit_mb = app.config["MAX_UPLOAD_BYTES"] // (1024 * 1024)
            message = f"Total upload size exceeds {limit_mb}MB limit"
        response = jsonify(_error_body(message))
        response.status_code = status
        # Preserve headers such as Allow (405) and Retry-After (429).
        for key, value in exc.get_headers():
            if key.lower() != "content-type":
                response.headers[key] = value
        return response

    @app.errorhandler(Exception)
    def _handle_unexpected(exc: Exception):
        logger.exception("Unhandled error")
        return jsonify(_error_body("Internal server error")), 500
