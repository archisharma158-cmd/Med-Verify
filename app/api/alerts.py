"""Regulatory alerts routes for CDSCO and state drug controller alerts."""
from __future__ import annotations

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.models import RegulatoryAlert
from app.schemas.schemas import PaginatedResponse, RegulatoryAlertResponse
from app.services.cdsco_service import check_regulatory_alerts, get_alert_data_freshness

router = APIRouter(prefix="/api/alerts", tags=["Regulatory Alerts"])


class AlertCheckRequest(BaseModel):
    product_name: Optional[str] = None
    manufacturer: Optional[str] = None
    batch_number: Optional[str] = None


@router.get("", response_model=PaginatedResponse)
async def list_alerts(
    q: Optional[str] = Query(None, description="Search query for product name or manufacturer"),
    batch_number: Optional[str] = Query(None, description="Specific batch number"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """List regulatory alerts from CDSCO and State Drug Controllers with pagination and filtering."""
    query = select(RegulatoryAlert)
    count_query = select(func.count(RegulatoryAlert.id))

    conditions = []
    if q:
        search_term = f"%{q.strip().lower()}%"
        conditions.append(
            or_(
                func.lower(RegulatoryAlert.product_name).like(search_term),
                func.lower(RegulatoryAlert.manufacturer).like(search_term),
                func.lower(RegulatoryAlert.reported_issue).like(search_term),
            )
        )
    if batch_number:
        conditions.append(
            func.upper(RegulatoryAlert.batch_number) == batch_number.strip().upper()
        )

    if conditions:
        query = query.where(*conditions)
        count_query = count_query.where(*conditions)

    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    offset = (page - 1) * page_size
    query = query.order_by(RegulatoryAlert.created_at.desc()).offset(offset).limit(page_size)

    result = await db.execute(query)
    items = list(result.scalars().all())

    serialized_items = [
        RegulatoryAlertResponse.model_validate(alert).model_dump()
        for alert in items
    ]

    return PaginatedResponse(
        items=serialized_items,
        total=total,
        page=page,
        page_size=page_size,
        has_next=(offset + len(items)) < total,
    )


@router.post("/check")
async def check_alerts(
    body: AlertCheckRequest,
    db: AsyncSession = Depends(get_db),
):
    """Check a medicine and batch number against all imported regulatory alerts."""
    return await check_regulatory_alerts(
        db,
        product_name=body.product_name,
        manufacturer=body.manufacturer,
        batch_number=body.batch_number,
    )


@router.get("/freshness")
async def alert_freshness(
    db: AsyncSession = Depends(get_db),
):
    """Retrieve the latest publication / import timestamp for CDSCO alert records."""
    freshness = await get_alert_data_freshness(db)
    return {
        "latest_import_timestamp": freshness,
        "note": "CDSCO NSQ lists are published periodically by central and state regulators.",
    }
