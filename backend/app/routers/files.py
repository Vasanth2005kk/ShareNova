"""
files.py — File download route from local storage.
Replaces: backend/src/routes/files.ts
"""

from fastapi import APIRouter, Depends, Request, Header
from fastapi.responses import JSONResponse, FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.services import share_service, storage_service, password_service
from app.middleware.rate_limiter import limiter, RETRIEVAL_LIMIT

router = APIRouter(prefix="/api/files")


@router.get("/{file_id}/download")
@limiter.limit(RETRIEVAL_LIMIT)
async def download_file(
    request: Request,
    file_id: str,
    db: AsyncSession = Depends(get_db),
    x_session_token: str | None = Header(default=None, alias="X-Session-Token"),
):
    file = await share_service.get_file_for_download(db, file_id)
    if not file:
        return JSONResponse(
            status_code=404,
            content={"success": False, "error": "File not found or share has expired"},
        )

    # If the share is private, check session token
    if file["is_private"]:
        token = x_session_token or request.query_params.get("token")
        if not token or not password_service.validate_session_token(token, file["share_uid"]):
            return JSONResponse(
                status_code=401,
                content={"success": False, "error": "Authentication required"},
            )

    file_path = storage_service.get_file_path(file["storage_key"])
    if not file_path:
        return JSONResponse(
            status_code=404,
            content={"success": False, "error": "File not found"},
        )

    return FileResponse(
        path=file_path,
        media_type=file.get("mime_type") or "application/octet-stream",
        filename=file["filename"],
    )
