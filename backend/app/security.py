"""Access control for private shares and HTTP security headers."""

from flask import Flask, Response, request

from app.errors import ApiError
from app.models import Share
from app.services import password_service


def session_token() -> str | None:
    """Session token from the X-Session-Token header, or ?token= (used by download links)."""
    return request.headers.get("X-Session-Token") or request.args.get("token") or None


def require_access(share: Share, message: str = "Authentication required") -> None:
    """Raise 401 unless the share is public or the request carries a valid session token."""
    if share.is_private and not password_service.validate_session_token(session_token(), share.urlid):
        raise ApiError(401, message)


_SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "SAMEORIGIN",
    "X-XSS-Protection": "0",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "Referrer-Policy": "no-referrer",
    "X-DNS-Prefetch-Control": "off",
    "X-Download-Options": "noopen",
    "X-Permitted-Cross-Domain-Policies": "none",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-site",
}


def register_security_headers(app: Flask) -> None:
    @app.after_request
    def _add_headers(response: Response) -> Response:
        for name, value in _SECURITY_HEADERS.items():
            response.headers.setdefault(name, value)
        return response
