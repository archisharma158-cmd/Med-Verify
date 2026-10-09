"""Scan history routes."""
from __future__ import annotations

import json
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.core.security import CurrentUser, get_current_user
from app.database import get_db
from app.models.models import ScanHistory
from app.schemas.schemas import PaginatedResponse, ScanHistoryDetailResponse, ScanHistoryResponse

router = APIRouter(prefix="/api/history", tags=["Scan History"])


@router.get("", response_model=PaginatedResponse)
async def get_scan_history(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    risk_category: Optional[str] = Query(None, description="Filter by risk category"),
    input_method: Optional[str] = Query(None, description="Filter by input method"),
    user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get scan history for the authenticated user.
    
    Supports pagination and filtering by risk category or input method.
    Users can only see their own scans.
    """
    query = select(ScanHistory).where(
        ScanHistory.user_id == UUID(user.user_id) if user.user_id else False
    )
    count_query = select(func.count(ScanHistory.id)).where(
        ScanHistory.user_id == UUID(user.user_id) if user.user_id else False
    )

    if risk_category:
        query = query.where(ScanHistory.risk_category == risk_category)
        count_query = count_query.where(ScanHistory.risk_category == risk_category)

    if input_method:
        query = query.where(ScanHistory.input_method == input_method)
        count_query = count_query.where(ScanHistory.input_method == input_method)

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    query = query.order_by(ScanHistory.scan_timestamp.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)

    result = await db.execute(query)
    scans = list(result.scalars().all())

    return PaginatedResponse(
        items=[ScanHistoryResponse.model_validate(s) for s in scans],
        total=total,
        page=page,
        page_size=page_size,
        has_next=(page * page_size) < total,
    )


@router.get("/{scan_id}", response_model=ScanHistoryDetailResponse)
async def get_scan_detail(
    scan_id: UUID,
    user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get detailed scan result including full verification data.
    
    Users can only view their own scan records.
    """
    result = await db.execute(
        select(ScanHistory).where(ScanHistory.id == scan_id)
    )
    scan = result.scalar_one_or_none()

    if not scan:
        raise NotFoundError("Scan record not found")

    # Ownership check
    if scan.user_id and str(scan.user_id) != user.user_id and not user.is_admin:
        raise NotFoundError("Scan record not found")

    return ScanHistoryDetailResponse.model_validate(scan)
