"""Suspicious medicine report service."""
from __future__ import annotations

import json
import uuid
from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import get_logger
from app.models.models import SuspiciousReport

logger = get_logger("report_service")


async def create_report(
    db: AsyncSession,
    user_id: Optional[str],
    medicine_name: Optional[str],
    manufacturer: Optional[str],
    batch_number: Optional[str],
    reason: str,
    description: Optional[str],
    contact_info: Optional[str],
    scan_id: Optional[str],
    image_paths: Optional[list[str]] = None,
) -> SuspiciousReport:
    """Create a suspicious medicine report."""
    report = SuspiciousReport(
        user_id=uuid.UUID(user_id) if user_id else None,
        scan_id=uuid.UUID(scan_id) if scan_id else None,
        medicine_name=medicine_name,
        manufacturer=manufacturer,
        batch_number=batch_number,
        reason=reason,
        description=description,
        contact_info=contact_info,
        image_paths=json.dumps(image_paths) if image_paths else None,
        status="submitted",
    )
    db.add(report)
    await db.flush()
    logger.info("report_created", report_id=str(report.id), reason=reason)
    return report


async def get_report(db: AsyncSession, report_id: uuid.UUID) -> Optional[SuspiciousReport]:
    """Get a report by ID."""
    result = await db.execute(
        select(SuspiciousReport).where(SuspiciousReport.id == report_id)
    )
    return result.scalar_one_or_none()


async def get_user_reports(
    db: AsyncSession,
    user_id: str,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[SuspiciousReport], int]:
    """Get reports submitted by a specific user."""
    query = select(SuspiciousReport).where(
        SuspiciousReport.user_id == uuid.UUID(user_id)
    ).order_by(SuspiciousReport.created_at.desc())

    count_query = select(func.count(SuspiciousReport.id)).where(
        SuspiciousReport.user_id == uuid.UUID(user_id)
    )
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    reports = list(result.scalars().all())

    return reports, total


async def list_all_reports(
    db: AsyncSession,
    status_filter: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[SuspiciousReport], int]:
    """List all reports (admin). Optional status filter."""
    query = select(SuspiciousReport)
    count_query = select(func.count(SuspiciousReport.id))

    if status_filter:
        query = query.where(SuspiciousReport.status == status_filter)
        count_query = count_query.where(SuspiciousReport.status == status_filter)

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    query = query.order_by(SuspiciousReport.created_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    reports = list(result.scalars().all())

    return reports, total


async def update_report_status(
    db: AsyncSession,
    report_id: uuid.UUID,
    status: str,
    admin_notes: Optional[str] = None,
) -> Optional[SuspiciousReport]:
    """Update report status (admin action)."""
    report = await get_report(db, report_id)
    if not report:
        return None

    report.status = status
    if admin_notes:
        report.admin_notes = admin_notes
    await db.flush()

    logger.info("report_status_updated", report_id=str(report_id), new_status=status)
    return report
