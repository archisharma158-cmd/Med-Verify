"""Pytest test configuration, fixtures, and in-memory test database."""
from __future__ import annotations

import asyncio
import os
import uuid
from datetime import date
from typing import AsyncGenerator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.pool import StaticPool

# Set test environment
os.environ["ENVIRONMENT"] = "test"
os.environ["SUPABASE_URL"] = "https://test.supabase.co"
os.environ["SUPABASE_SECRET_KEY"] = "test_key"
os.environ["SECRET_KEY"] = "test-secret-key-12345"

from app.database.session import Base, get_db
from app.main import create_application
from app.models.models import (
    Medicine,
    MedicineBatch,
    RegulatoryAlert,
    User,
)

# In-memory SQLite async engine for tests
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = async_sessionmaker(
    bind=test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


@pytest_asyncio.fixture(scope="session", autouse=True)
async def prepare_database():
    """Create all tables before running tests."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await test_engine.dispose()


@pytest_asyncio.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Provide an isolated database session per test."""
    async with TestingSessionLocal() as session:
        yield session
        await session.rollback()


@pytest_asyncio.fixture
async def seed_data(db_session: AsyncSession):
    """Seed baseline test records."""
    # 1. Test Medicine - Dolo 650
    med = Medicine(
        id=uuid.uuid4(),
        name="Dolo 650",
        manufacturer="Micro Labs Ltd",
        gtin="8901148210356",
        composition="Paracetamol 650mg",
        strength="650mg",
        dosage_form="Tablet",
        data_source="verified_registry",
        is_verified=True,
    )
    db_session.add(med)
    await db_session.flush()

    # Valid Batch
    b1 = MedicineBatch(
        id=uuid.uuid4(),
        medicine_id=med.id,
        batch_number="DL24089",
        manufacturing_date=date(2024, 3, 1),
        expiry_date=date(2027, 2, 28),
        verification_source="manufacturer_confirmed",
        manufacturer_confirmed=True,
    )
    # Expired Batch
    b2 = MedicineBatch(
        id=uuid.uuid4(),
        medicine_id=med.id,
        batch_number="DL20001",
        manufacturing_date=date(2020, 1, 1),
        expiry_date=date(2022, 1, 1),
        verification_source="historical",
        manufacturer_confirmed=True,
    )
    db_session.add_all([b1, b2])

    # 2. CDSCO Regulatory Alert for Pan 40
    alert = RegulatoryAlert(
        id=uuid.uuid4(),
        product_name="Pan 40",
        manufacturer="Alkem Laboratories Ltd",
        batch_number="PN23999",
        alert_type="Not of Standard Quality (NSQ)",
        reported_issue="Dissolution test failure",
        regulatory_source="CDSCO",
        publication_date=date(2024, 8, 15),
    )
    db_session.add(alert)

    # 3. Test Admin User
    admin = User(
        id=uuid.uuid4(),
        email="admin@medverify.gov.in",
        name="Test Admin",
        role="admin",
        preferred_language="en",
        is_active=True,
    )
    db_session.add(admin)

    await db_session.commit()
    return {"medicine": med, "batch": b1, "alert": alert, "admin": admin}


@pytest_asyncio.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Test HTTP client with database dependency override."""
    app = create_application()

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
