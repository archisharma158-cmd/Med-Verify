"""Medicine database lookup service."""
from __future__ import annotations

import re
from typing import Optional
from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import get_logger
from app.models.models import Medicine, MedicineBatch

logger = get_logger("medicine_service")


def _normalize_name(name: str) -> str:
    """Normalize medicine/manufacturer name for fuzzy matching."""
    name = name.lower().strip()
    name = re.sub(r"[^\w\s]", "", name)
    name = re.sub(r"\s+", " ", name)
    return name


async def search_medicine(
    db: AsyncSession,
    name: Optional[str] = None,
    manufacturer: Optional[str] = None,
    gtin: Optional[str] = None,
) -> list[Medicine]:
    """Search medicines by name, manufacturer, or GTIN."""
    query = select(Medicine)
    conditions = []

    if gtin:
        conditions.append(Medicine.gtin == gtin)

    if name:
        norm = _normalize_name(name)
        conditions.append(
            or_(
                func.lower(Medicine.name).contains(norm),
                func.lower(Medicine.name).contains(norm.replace(" ", "")),
            )
        )

    if manufacturer:
        norm_mfr = _normalize_name(manufacturer)
        conditions.append(func.lower(Medicine.manufacturer).contains(norm_mfr))

    if not conditions:
        return []

    # Use OR for broader search, AND for precise matching
    if gtin:
        query = query.where(*conditions)  # All conditions when GTIN is known
    else:
        query = query.where(or_(*conditions) if len(conditions) > 1 else conditions[0])

    query = query.limit(20)
    result = await db.execute(query)
    return list(result.scalars().all())


async def get_medicine_by_id(db: AsyncSession, medicine_id: UUID) -> Optional[Medicine]:
    """Get a medicine by its ID."""
    result = await db.execute(select(Medicine).where(Medicine.id == medicine_id))
    return result.scalar_one_or_none()


async def find_batch(
    db: AsyncSession,
    batch_number: str,
    medicine_id: Optional[UUID] = None,
) -> list[MedicineBatch]:
    """Find batch records by batch number."""
    query = select(MedicineBatch).where(
        func.upper(MedicineBatch.batch_number) == batch_number.upper()
    )
    if medicine_id:
        query = query.where(MedicineBatch.medicine_id == medicine_id)
    result = await db.execute(query)
    return list(result.scalars().all())


async def match_manufacturer(
    db: AsyncSession,
    medicine_name: Optional[str],
    manufacturer: Optional[str],
) -> dict:
    """Match manufacturer against known records. Returns match result dict."""
    if not medicine_name and not manufacturer:
        return {"status": "insufficient_data", "details": "No medicine name or manufacturer provided"}

    medicines = await search_medicine(db, name=medicine_name, manufacturer=manufacturer)

    if not medicines:
        return {
            "status": "insufficient_data",
            "details": "No matching medicine found in database. This does not confirm or deny authenticity.",
        }

    # Check for exact manufacturer match
    if manufacturer:
        norm_mfr = _normalize_name(manufacturer)
        for med in medicines:
            if med.manufacturer and _normalize_name(med.manufacturer) == norm_mfr:
                return {
                    "status": "confirmed_match",
                    "medicine_id": str(med.id),
                    "details": f"Manufacturer match found: {med.manufacturer}",
                    "data_source": med.data_source,
                }
            elif med.manufacturer and norm_mfr in _normalize_name(med.manufacturer):
                return {
                    "status": "name_only_match",
                    "medicine_id": str(med.id),
                    "details": f"Partial manufacturer match: {med.manufacturer}",
                    "data_source": med.data_source,
                }

    # Medicine name matches but no manufacturer info to compare
    if medicines:
        return {
            "status": "name_only_match",
            "medicine_id": str(medicines[0].id),
            "details": f"Medicine name found but manufacturer could not be confirmed.",
            "data_source": medicines[0].data_source,
        }

    return {"status": "insufficient_data", "details": "Could not verify manufacturer identity."}


async def create_medicine(db: AsyncSession, **kwargs) -> Medicine:
    """Create a new medicine record."""
    medicine = Medicine(**kwargs)
    db.add(medicine)
    await db.flush()
    return medicine


async def update_medicine(db: AsyncSession, medicine_id: UUID, **kwargs) -> Optional[Medicine]:
    """Update an existing medicine record."""
    medicine = await get_medicine_by_id(db, medicine_id)
    if not medicine:
        return None
    for key, value in kwargs.items():
        if hasattr(medicine, key) and value is not None:
            setattr(medicine, key, value)
    await db.flush()
    return medicine


async def list_medicines(
    db: AsyncSession,
    page: int = 1,
    page_size: int = 20,
    search: Optional[str] = None,
) -> tuple[list[Medicine], int]:
    """List medicines with pagination and optional search."""
    query = select(Medicine)
    count_query = select(func.count(Medicine.id))

    if search:
        norm = _normalize_name(search)
        search_filter = or_(
            func.lower(Medicine.name).contains(norm),
            func.lower(Medicine.manufacturer).contains(norm),
        )
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    query = query.order_by(Medicine.name).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    medicines = list(result.scalars().all())

    return medicines, total
