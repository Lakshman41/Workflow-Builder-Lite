import ssl

from sqlalchemy.engine import make_url
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings


def _parse_url_and_build_connect_args(database_url: str, ssl_no_verify: bool):
    """
    Parse DATABASE_URL once and build engine URL + connect_args.
    Connection params (user, password, host, port, database) are passed via connect_args
    so asyncpg receives them without re-parsing the URL (avoids issues with special chars).
    """
    url = make_url(database_url)
    username = url.username
    password = url.password
    host = url.host
    port = int(url.port) if url.port else 5432
    database = url.database or ""

    # SSL from query params
    connect_args = {}
    q = getattr(url, "query", None)
    if q:
        v = q.get("sslmode") or q.get("ssl_mode")
        if v:
            ssl_val = (v[0] if isinstance(v, (list, tuple)) else v).lower()
            if ssl_val in ("require", "verify-full", "verify-ca"):
                if ssl_no_verify:
                    ctx = ssl.create_default_context()
                    ctx.check_hostname = False
                    ctx.verify_mode = ssl.CERT_NONE
                    connect_args["ssl"] = ctx
                else:
                    connect_args["ssl"] = True

    # Pass connection params from our parsed URL so asyncpg gets them directly
    connect_args["user"] = username
    connect_args["password"] = password
    connect_args["host"] = host
    connect_args["port"] = port
    connect_args["database"] = database

    # Build URL with placeholder password and no sslmode; real params go via connect_args
    strip_keys = ["sslmode", "ssl_mode", "sslrootcert", "sslcert", "sslkey"]
    url_clean = url.difference_update_query(strip_keys)
    url_for_engine = url_clean.set(password="***") if password else url_clean
    return str(url_for_engine), connect_args


_db_url, _connect_args = _parse_url_and_build_connect_args(
    settings.database_url,
    ssl_no_verify=settings.database_ssl_no_verify,
)

engine = create_async_engine(
    _db_url,
    echo=False,
    future=True,
    connect_args=_connect_args,
)

async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    """Base class for all ORM models."""

    pass


async def get_db() -> AsyncSession:
    """Dependency that yields an async DB session. Call session.commit() in the route."""
    async with async_session_factory() as session:
        try:
            yield session
        finally:
            await session.close()
