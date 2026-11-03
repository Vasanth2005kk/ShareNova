"""Background worker that removes expired shares (DB rows + files on disk)
and expired session tokens."""

import logging
import threading

from flask import Flask
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import SessionFactory
from app.models import Share
from app.services import password_service, storage_service
from app.utils import utcnow

logger = logging.getLogger(__name__)

_run_lock = threading.Lock()
_worker: threading.Thread | None = None
_stop_event = threading.Event()


def cleanup_expired_shares(app: Flask) -> int:
    """Delete all expired shares. Returns the number of shares removed."""
    if not _run_lock.acquire(blocking=False):
        logger.debug("Cleanup already running, skipping")
        return 0
    try:
        with app.app_context(), SessionFactory() as session:
            expired = session.execute(
                select(Share)
                .where(Share.expires_at.is_not(None), Share.expires_at <= utcnow())
                .options(selectinload(Share.files))
            ).scalars().all()
            if not expired:
                return 0

            storage_keys = [f.fileurl for share in expired for f in share.files]
            uids = [share.urlid for share in expired]
            for share in expired:
                session.delete(share)
            session.commit()

            storage_service.delete_files(storage_keys)
            for uid in uids:
                password_service.revoke_tokens_for(uid)

            logger.info("Cleaned up %d expired shares, %d files", len(expired), len(storage_keys))
            return len(expired)
    except Exception:
        logger.exception("Cleanup of expired shares failed")
        return 0
    finally:
        _run_lock.release()


def run_cleanup_cycle(app: Flask) -> None:
    cleanup_expired_shares(app)
    removed = password_service.cleanup_expired_sessions()
    if removed:
        logger.debug("Removed %d expired session tokens", removed)


def start_cleanup_worker(app: Flask) -> None:
    """Run a cleanup cycle immediately and then every CLEANUP_INTERVAL_SECONDS."""
    global _worker
    if _worker is not None and _worker.is_alive():
        return

    interval = app.config["CLEANUP_INTERVAL_SECONDS"]

    def _loop():
        while not _stop_event.is_set():
            run_cleanup_cycle(app)
            _stop_event.wait(interval)

    _stop_event.clear()
    _worker = threading.Thread(target=_loop, name="sharenova-cleanup", daemon=True)
    _worker.start()
    logger.info("Cleanup worker started — running every %d seconds", interval)


def stop_cleanup_worker() -> None:
    _stop_event.set()
