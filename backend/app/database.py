"""SQLAlchemy engine, request-scoped session and declarative base."""

from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import DeclarativeBase, scoped_session, sessionmaker


class Base(DeclarativeBase):
    pass


# Configured by init_db(). `db` is a thread-local session used inside requests;
# background jobs open their own sessions with `SessionFactory()`.
SessionFactory = sessionmaker(expire_on_commit=False)
db = scoped_session(SessionFactory)

_engine: Engine | None = None


def _set_sqlite_pragmas(dbapi_conn, _record) -> None:
    cursor = dbapi_conn.cursor()
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


def init_db(app) -> Engine:
    """Create the engine, bind sessions, create missing tables and register teardown."""
    global _engine
    url = app.config["DATABASE_URL"]
    is_sqlite = url.startswith("sqlite")

    _engine = create_engine(
        url,
        pool_pre_ping=True,
        connect_args={"check_same_thread": False, "timeout": 30} if is_sqlite else {},
    )
    if is_sqlite:
        event.listen(_engine, "connect", _set_sqlite_pragmas)

    SessionFactory.configure(bind=_engine)

    from app import models  # noqa: F401  (register models on Base.metadata)

    Base.metadata.create_all(_engine)

    @app.teardown_appcontext
    def _remove_session(exc):
        if exc is not None:
            db.rollback()
        db.remove()

    return _engine


def get_engine() -> Engine:
    if _engine is None:
        raise RuntimeError("Database has not been initialised")
    return _engine
