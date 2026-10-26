"""Database connection and session management for NoiseWatch.

Supports Supabase client and optional SQLAlchemy async engine.
Provides safe fallbacks in demo mode.
"""

from typing import Optional, Any
from app.core.config import settings

# Supabase Client integration
supabase_client: Optional[Any] = None

if settings.supabase_url and settings.supabase_key:
    try:
        from supabase import create_client
        supabase_client = create_client(settings.supabase_url, settings.supabase_key)
    except Exception as e:
        print(f"Warning: Supabase client initialization failed: {e}")

# Optional SQLAlchemy Async Engine
engine = None
async_session_factory = None
Base = None

try:
    from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
    from sqlalchemy.orm import DeclarativeBase

    class Base(DeclarativeBase):
        """Base class for all SQLAlchemy models."""
        pass

    if settings.database_url and "sqlite" not in settings.database_url:
        engine = create_async_engine(
            settings.database_url,
            echo=settings.app_debug,
            pool_pre_ping=True,
        )
        async_session_factory = async_sessionmaker(
            engine,
            class_=AsyncSession,
            expire_on_commit=False,
        )
except ImportError:
    # SQLAlchemy not installed in current environment; use Supabase or Demo mode
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
