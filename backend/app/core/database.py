"""Database connection and session management for NoiseWatch.

Supports Neon Lakebase Postgres (via SQLAlchemy asyncpg), Supabase fallback,
and safe fallbacks in demo mode.
"""

import urllib.parse
from typing import Optional, Any
from app.core.config import settings

# Supabase Client integration (Optional / Legacy)
supabase_client: Optional[Any] = None

if settings.supabase_url and settings.supabase_anon_key:
    try:
        from supabase import create_client
        supabase_client = create_client(settings.supabase_url, settings.supabase_anon_key)
    except Exception as e:
        print(f"Warning: Supabase client initialization failed: {e}")

# SQLAlchemy Async Engine for Neon / PostgreSQL
engine = None
async_session_factory = None
Base = None


def format_neon_asyncpg_url(raw_url: str) -> str:
    """Format connection string for SQLAlchemy asyncpg engine on Neon."""
    if not raw_url:
        return raw_url

    clean_url = raw_url
    if clean_url.startswith("postgres://"):
        clean_url = "postgresql://" + clean_url[len("postgres://"):]

    if clean_url.startswith("postgresql://"):
        clean_url = "postgresql+asyncpg://" + clean_url[len("postgresql://"):]

    # Parse and strip libpq parameters like channel_binding or sslmode that asyncpg doesn't parse in URI
    parsed = urllib.parse.urlsplit(clean_url)
    clean_url = urllib.parse.urlunsplit((
        parsed.scheme,
        parsed.netloc,
        parsed.path,
        "",
        ""
    ))
    return clean_url


try:
    from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
    from sqlalchemy.orm import DeclarativeBase
    from sqlalchemy.pool import NullPool

    class Base(DeclarativeBase):
        """Base class for all SQLAlchemy models."""
        pass

    if settings.database_url and "sqlite" not in settings.database_url:
        async_db_url = format_neon_asyncpg_url(settings.database_url)
        
        # Best practices for Neon with asyncpg and connection pooling:
        # statement_cache_size=0, prepared_statement_cache_size=0 for transaction poolers
        connect_args = {
            "ssl": True,
            "statement_cache_size": 0,
            "prepared_statement_cache_size": 0,
        }
        
        engine = create_async_engine(
            async_db_url,
            echo=settings.app_debug,
            poolclass=NullPool,
            connect_args=connect_args,
        )
        async_session_factory = async_sessionmaker(
            engine,
            class_=AsyncSession,
            expire_on_commit=False,
        )
except ImportError as e:
    print(f"Warning: SQLAlchemy or asyncpg not available: {e}")
    pass


async def get_db():
    """Dependency that yields a database session or Supabase client."""
    if async_session_factory:
        async with async_session_factory() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise
            finally:
                await session.close()
    else:
        # Fallback for demo or Supabase-only operations
        yield supabase_client


async def check_neon_health() -> dict:
    """Test Neon database connectivity and return version & branch info."""
    if not engine:
        return {"connected": False, "reason": "No database engine configured"}
    
    try:
        from sqlalchemy import text
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT version();"))
            db_version = result.scalar()
            return {
                "connected": True,
                "provider": "Neon Lakebase Postgres",
                "branch": settings.neon_branch or "production",
                "version": db_version,
            }
    except Exception as exc:
        return {
            "connected": False,
            "provider": "Neon",
            "error": str(exc),
        }
