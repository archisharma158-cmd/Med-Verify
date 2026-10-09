"""Async SQLAlchemy database engine and session management."""
from __future__ import annotations

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from app.core.config import get_settings
from app.core.logging import get_logger

logger = get_logger("database")


class Base(DeclarativeBase):
    """SQLAlchemy declarative base for all models."""
    pass


# Engine and session factory (initialized lazily)
_engine = None
_async_session_factory = None


def get_engine():
    global _engine
    if _engine is None:
        settings = get_settings()
        db_url = settings.get_database_url()
        _engine = create_async_engine(
            db_url,
            echo=settings.DEBUG,
            pool_size=5,
            max_overflow=10,
            pool_pre_ping=True,
            pool_recycle=300,
        )
        logger.info("database_engine_created")
    return _engine


def get_session_factory():
    global _async_session_factory
    if _async_session_factory is None:
        _async_session_factory = async_sessionmaker(
            bind=get_engine(),
            class_=AsyncSession,
            expire_on_commit=False,
        )
    return _async_session_factory


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency that yields an async database session."""
    factory = get_session_factory()
    async with factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db() -> None:
    """Create all tables (for development/testing only; use Alembic in production)."""
    engine = get_engine()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("database_tables_created")


async def close_db() -> None:
    """Dispose the engine on shutdown."""
    global _engine, _async_session_factory
    if _engine:
        await _engine.dispose()
        _engine = None
        _async_session_factory = None
        logger.info("database_engine_disposed")
