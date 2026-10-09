"""Suspicious medicine reporting routes."""
from __future__ import annotations

import json
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, Request, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.exceptions import BadRequestError, FileTooLargeError, NotFoundError
from app.core.security import CurrentUser, get_current_user, get_optional_user
from app.database import get_db
from app.schemas.schemas import PaginatedResponse, ReportCreate, ReportResponse
from app.services import report_service

router = APIRouter(prefix="/api/reports", tags=["Reports"])

ALLOWED_REASONS = {
    "suspicious_packaging",
    "expired_medicine",
    "mismatched_information",
    "repeated_serial_scan",
    "regulatory_alert_concern",
    "other",
}


@router.post("", response_model=ReportResponse, status_code=201)
async def submit_report_json(
    body: ReportCreate,
    user: Optional[CurrentUser] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
):
    """Submit a suspicious medicine report using JSON payload."""
    report = await report_service.create_report(
        db=db,
        user_id=user.user_id if user else None,
        medicine_name=body.medicine_name,
        manufacturer=body.manufacturer,
        batch_number=body.batch_number,
        reason=body.reason,
        description=body.description,
        contact_info=body.contact_info,
        scan_id=str(body.scan_id) if body.scan_id else None,
        image_paths=[],
    )
    return ReportResponse.model_validate(report)


@router.post("/multipart", response_model=ReportResponse, status_code=201)
async def submit_report_multipart(
    medicine_name: Optional[str] = Form(None),
    manufacturer: Optional[str] = Form(None),
    batch_number: Optional[str] = Form(None),
    reason: str = Form(...),
    description: Optional[str] = Form(None),
    contact_info: Optional[str] = Form(None),
    scan_id: Optional[str] = Form(None),
    images: list[UploadFile] = File(default=[]),
    user: Optional[CurrentUser] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
):
    """Submit a suspicious medicine report with multipart image attachments."""
    settings = get_settings()

    if reason not in ALLOWED_REASONS:
        raise BadRequestError(f"Invalid reason. Must be one of: {ALLOWED_REASONS}")

    image_paths: list[str] = []
    for img in images[:5]:
        if img.content_type and img.content_type not in {"image/jpeg", "image/png", "image/webp"}:
            continue
        content = await img.read()
        if len(content) > settings.max_upload_bytes:
            raise FileTooLargeError(settings.MAX_UPLOAD_SIZE_MB)
        image_paths.append(f"reports/{img.filename}")

    report = await report_service.create_report(
        db=db,
        user_id=user.user_id if user else None,
        medicine_name=medicine_name,
        manufacturer=manufacturer,
        batch_number=batch_number,
        reason=reason,
        description=description,
        contact_info=contact_info,
        scan_id=scan_id,
        image_paths=image_paths,
    )

    return ReportResponse.model_validate(report)


@router.get("", response_model=PaginatedResponse)
async def get_my_reports(
    page: int = 1,
    page_size: int = 20,
    user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get reports submitted by the current authenticated user."""
    reports, total = await report_service.get_user_reports(
        db, user.user_id, page=page, page_size=page_size
    )
    return PaginatedResponse(
        items=[ReportResponse.model_validate(r) for r in reports],
        total=total,
        page=page,
        page_size=page_size,
        has_next=(page * page_size) < total,
    )


@router.get("/{report_id}", response_model=ReportResponse)
async def get_report(
    report_id: UUID,
    user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific report. Users can only view their own reports."""
    report = await report_service.get_report(db, report_id)
    if not report:
        raise NotFoundError("Report", str(report_id))
    if str(report.user_id) != user.user_id and not user.is_admin:
        raise NotFoundError("Report", str(report_id))
    return ReportResponse.model_validate(report)
