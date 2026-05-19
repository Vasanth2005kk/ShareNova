"""
cleanup_service.py — APScheduler-based cleanup worker.
Replaces: backend/src/services/CleanupService.ts (node-cron)
"""

import asyncio
import logging
from datetime import datetime, timezone

from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload

from app.database import async_session
from app.models import Share
from app.services import storage_service

logger = logging.getLogger("sharenova.cleanup")

_running = False


async def cleanup_expired_shares() -> None:
    """Delete expired shares from DB and storage. Overlap-prevention via _running flag."""
    global _running
    if _running:
        logger.debug("Cleanup already running — skipping")
        return

    _running = True
    try:
        async with async_session() as db:
            # Find expired shares
            result = await db.execute(
                select(Share)
                .where(Share.expires_at <= datetime.now(timezone.utc))
                .where(Share.expires_at.isnot(None))
                .options(selectinload(Share.files))
            )
            expired = result.scalars().all()

            if not expired:
                return

            # Collect storage keys and delete from storage
            storage_keys = []
            for share in expired:
                for f in share.files:
                    storage_keys.append(f.storage_key)

            if storage_keys:
                try:
                    await storage_service.delete_files(storage_keys)
                except Exception as e:
                    logger.error(f"Failed to delete files from storage: {e}")

            # Delete from DB (cascade handles files + text_shares)
            share_ids = [s.id for s in expired]
            await db.execute(delete(Share).where(Share.id.in_(share_ids)))
            await db.commit()

            logger.info(f"Cleaned up {len(expired)} expired shares, {len(storage_keys)} files")
    except Exception as e:
        logger.error(f"Cleanup error: {e}")
    finally:
        _running = False
