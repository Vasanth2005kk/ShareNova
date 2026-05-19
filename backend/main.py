"""
main.py — FastAPI application entry point.
Replaces: backend/src/app.ts

Assembles middleware, routers, CORS, and the cleanup scheduler.
"""

import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.config import settings
from app.database import engine, Base
from app.middleware.rate_limiter import limiter
from app.middleware.security import SecurityHeadersMiddleware
from app.routers import shares, files, download, health
from app.services.cleanup_service import cleanup_expired_shares
from app.services.password_service import cleanup_expired_sessions

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("sharenova")

scheduler = AsyncIOScheduler()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown lifecycle."""
    # ── Startup ──────────────────────────────────────────
    # Create tables if they don't exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Start cleanup scheduler — runs immediately, then every 5 minutes
    scheduler.add_job(
        cleanup_expired_shares,
        "interval",
        minutes=5,
        id="cleanup_shares",
        max_instances=1,  # overlap prevention
    )
    scheduler.add_job(
        cleanup_expired_sessions,
        "interval",
        minutes=5,
        id="cleanup_sessions",
        max_instances=1,
    )
    scheduler.start()

    # Run cleanup once immediately on startup
    asyncio.create_task(cleanup_expired_shares())

    logger.info(
        f"\n"
        f"  ╔══════════════════════════════════════════╗\n"
        f"  ║                                          ║\n"
        f"  ║   🚀 ShareNova API Server               ║\n"
        f"  ║   Running on port {str(settings.PORT):<24}║\n"
        f"  ║   Environment: {settings.NODE_ENV:<23}║\n"
        f"  ║                                          ║\n"
        f"  ╚══════════════════════════════════════════╝\n"
    )
    logger.info("🕐 Cleanup worker started — running every 5 minutes")

    yield

    # ── Shutdown ─────────────────────────────────────────
    scheduler.shutdown()
    await engine.dispose()


# ─── App creation ────────────────────────────────────────

app = FastAPI(
    title="ShareNova API",
    version="2.0.0",
    lifespan=lifespan,
    docs_url=None,
    redoc_url=None,
)

# ─── Rate limiter ────────────────────────────────────────
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)  # type: ignore[arg-type]

# ─── Middleware (order matters — outermost first) ────────
app.add_middleware(SecurityHeadersMiddleware)
frontend_origin = settings.FRONTEND_URL.rstrip("/")
frontend_origin_127 = frontend_origin.replace("localhost", "127.0.0.1")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_origin, frontend_origin_127],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "X-Session-Token"],
)

# ─── Override FastAPI's default 422 with 400 ─────────────
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    """Convert FastAPI validation failures to 400 with our envelope."""
    details = exc.errors()
    return JSONResponse(
        status_code=400,
        content={"success": False, "error": "Validation failed", "details": details},
    )

# ─── Global exception handler ───────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error: {exc}")
    return JSONResponse(
        status_code=500,
        content={"success": False, "error": "Internal server error"},
    )

# ─── Routes ──────────────────────────────────────────────
app.include_router(health.router)
app.include_router(shares.router)
app.include_router(files.router)
app.include_router(download.router)


# ─── 404 fallback ────────────────────────────────────────
@app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def catch_all(path: str):
    return JSONResponse(
        status_code=404,
        content={"success": False, "error": "Endpoint not found"},
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=settings.PORT, reload=True)
