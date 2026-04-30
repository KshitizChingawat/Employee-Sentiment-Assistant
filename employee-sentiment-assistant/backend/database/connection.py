"""
Database connection and session management.
Uses SQLAlchemy async engine for PostgreSQL.
"""

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.pool import NullPool
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://postgres:password@localhost:5432/sentiment_db"
)

# Create async engine
engine = create_async_engine(
    DATABASE_URL,
    echo=False,           # Set True for SQL debug logging
    poolclass=NullPool,   # Use NullPool for serverless environments like Render
)

# Session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""
    pass


async def get_db():
    """Dependency: yields an async database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db():
    """Initialize database — creates all tables."""
    from backend.models.models import User, Feedback, SentimentResult, Alert, Report  # noqa
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
