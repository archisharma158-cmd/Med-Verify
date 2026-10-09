"""Admin management routes for reports, CDSCO alert imports, and dashboard metrics."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, File, Query, UploadFile
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.exceptions import BadRequestError, ForbiddenError, NotFoundError
from app.core.logging import get_logger
from app.core.security import CurrentUser, get_current_user, get_optional_user
from app.database import get_db
from app.models.models import (
    AuditEvent,
    Medicine,
    RegulatoryAlert,
    ScanHistory,
    SuspiciousReport,
)
from app.schemas.schemas import (
    AlertImportResult,
    DashboardStats,
    PaginatedResponse,
    ReportResponse,
    ReportStatusUpdate,
    ScanTrend,
)
from app.services.cdsco_service import import_alerts_from_csv

logger = get_logger("admin_routes")
router = APIRouter(prefix="/api/admin", tags=["Admin Operations"])


async def check_admin_access(
    user: Optional[CurrentUser] = Depends(get_optional_user),
) -> Optional[CurrentUser]:
    """Verify admin access. In development mode with no token, allows read access with warning."""
    settings = get_settings()
    if user and user.is_admin:
        return user
    if not settings.is_production:
        # Allow dev/demo access when not in strict production mode
        return user
    raise ForbiddenError("Admin privileges required for this endpoint")


@router.get("/dashboard", response_model=DashboardStats)
async def get_dashboard_stats(
    admin: Optional[CurrentUser] = Depends(check_admin_access),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve operational dashboard metrics for scans, reports, alerts, and risk distribution."""
    # 1. Total Scans
    scans_res = await db.execute(select(func.count(ScanHistory.id)))
    total_scans = scans_res.scalar_one()

    # 2. Total Reports
    reports_res = await db.execute(select(func.count(SuspiciousReport.id)))
    total_reports = reports_res.scalar_one()

    # 3. Pending Reports
    pending_res = await db.execute(
        select(func.count(SuspiciousReport.id)).where(SuspiciousReport.status == "submitted")
    )
    pending_reports = pending_res.scalar_one()

    # 4. High Risk Scans
    high_risk_res = await db.execute(
        select(func.count(ScanHistory.id)).where(ScanHistory.risk_category == "high")
    )
    high_risk_scans = high_risk_res.scalar_one()

    # 5. Total Medicines
    med_res = await db.execute(select(func.count(Medicine.id)))
    total_medicines = med_res.scalar_one()

    # 6. Total Regulatory Alerts
    alerts_res = await db.execute(select(func.count(RegulatoryAlert.id)))
    total_alerts = alerts_res.scalar_one()

    # 7. Recent Scans in last 7 days
    seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
    recent_res = await db.execute(
        select(func.count(ScanHistory.id)).where(ScanHistory.scan_timestamp >= seven_days_ago)
    )
    recent_scans_7d = recent_res.scalar_one()

    return DashboardStats(
        total_scans=total_scans,
        total_reports=total_reports,
        pending_reports=pending_reports,
        high_risk_scans=high_risk_scans,
        total_medicines=total_medicines,
        total_alerts=total_alerts,
        recent_scans_7d=recent_scans_7d,
    )


@router.get("/trends", response_model=list[ScanTrend])
async def get_scan_trends(
    days: int = Query(7, ge=1, le=30),
    admin: Optional[CurrentUser] = Depends(check_admin_access),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve daily scan volumes and high-risk scan trends for analytics charts."""
    since = datetime.now(timezone.utc) - timedelta(days=days)

    query = (
        select(
            func.date(ScanHistory.scan_timestamp).label("scan_date"),
            func.count(ScanHistory.id).label("total"),
            func.sum(
                func.case((ScanHistory.risk_category == "high", 1), else_=0)
            ).label("high_risk"),
        )
        .where(ScanHistory.scan_timestamp >= since)
        .group_by(func.date(ScanHistory.scan_timestamp))
        .order_by(func.date(ScanHistory.scan_timestamp).asc())
    )

    result = await db.execute(query)
    rows = result.all()

    return [
        ScanTrend(
            date=str(row.scan_date),
            count=int(row.total or 0),
            high_risk_count=int(row.high_risk or 0),
        )
        for row in rows
    ]


@router.post("/alerts/import", response_model=AlertImportResult)
async def import_regulatory_alerts(
    file: UploadFile = File(..., description="CSV file of CDSCO / State regulatory alerts"),
    source: str = Query("CDSCO", description="Source regulator (e.g. CDSCO, FDA-Maharashtra)"),
    admin: Optional[CurrentUser] = Depends(check_admin_access),
    db: AsyncSession = Depends(get_db),
):
    """Import regulatory alert lists from CSV format into the central verification database.
    
    Accepts CSV files with headers: product_name, manufacturer, batch_number, alert_type, reported_issue, publication_date, source_url.
    """
    if not file.filename.endswith(".csv"):
        raise BadRequestError("File must be a CSV (.csv)")

    content_bytes = await file.read()
    try:
        csv_text = content_bytes.decode("utf-8")
    except UnicodeDecodeError:
        csv_text = content_bytes.decode("latin-1")

    result = await import_alerts_from_csv(db, csv_text, source=source)

    # Log audit event
    audit = AuditEvent(
        user_id=UUID(admin.user_id) if admin and admin.user_id else None,
        action="regulatory_alert_import",
        resource_type="regulatory_alerts",
        resource_id=result.import_batch_id,
        details=f"Imported: {result.imported}, Skipped: {result.skipped}, Errors: {len(result.errors)}",
    )
    db.add(audit)
    await db.commit()

    return result


@router.get("/reports", response_model=PaginatedResponse)
async def list_all_reports(
    status: Optional[str] = Query(None, description="Filter by report status: submitted, under_review, resolved, referred"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    admin: Optional[CurrentUser] = Depends(check_admin_access),
    db: AsyncSession = Depends(get_db),
):
    """List all user-submitted suspicious medicine reports with filtering and pagination."""
    query = select(SuspiciousReport)
    count_query = select(func.count(SuspiciousReport.id))

    if status:
        query = query.where(SuspiciousReport.status == status)
        count_query = count_query.where(SuspiciousReport.status == status)

    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    offset = (page - 1) * page_size
    query = query.order_by(SuspiciousReport.created_at.desc()).offset(offset).limit(page_size)

    result = await db.execute(query)
    items = list(result.scalars().all())

    serialized_items = [
        ReportResponse.model_validate(r).model_dump()
        for r in items
    ]

    return PaginatedResponse(
        items=serialized_items,
        total=total,
        page=page,
        page_size=page_size,
        has_next=(offset + len(items)) < total,
    )


@router.patch("/reports/{report_id}/status", response_model=ReportResponse)
async def update_report_status(
    report_id: UUID,
    body: ReportStatusUpdate,
    admin: Optional[CurrentUser] = Depends(check_admin_access),
    db: AsyncSession = Depends(get_db),
):
    """Update suspicious report investigation status and append administrative review notes."""
    query = select(SuspiciousReport).where(SuspiciousReport.id == report_id)
    result = await db.execute(query)
    report = result.scalar_one_or_none()

    if not report:
        raise NotFoundError("Report", str(report_id))

    report.status = body.status
    if body.admin_notes:
        existing_notes = report.admin_notes or ""
        timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
        report.admin_notes = f"{existing_notes}\n[{timestamp}] {body.admin_notes}".strip()

    # Audit event
    audit = AuditEvent(
        user_id=UUID(admin.user_id) if admin and admin.user_id else None,
        action="report_status_update",
        resource_type="suspicious_report",
        resource_id=str(report_id),
        details=f"Status changed to {body.status}",
    )
    db.add(audit)
    await db.commit()
    await db.refresh(report)

    return ReportResponse.model_validate(report)
