from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db

router = APIRouter(prefix="/api/health")


@router.get("")
async def health_check(db: AsyncSession = Depends(get_db)):
    try:
        await db.execute(text("SELECT 1"))
        return {
            "success": True,
            "data": {
                "status": "healthy",
                "database": "connected",
            },
        }
    except Exception as e:
        return JSONResponse(
            status_code=503,
            content={
                "success": False,
                "error": "Database connection failed",
            },
        )
