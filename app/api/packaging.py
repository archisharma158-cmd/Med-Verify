"""Packaging inspection and anomaly detection routes."""
from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.exceptions import BadRequestError, FileTooLargeError
from app.core.logging import get_logger
from app.database import get_db
from app.services.packaging_service import analyze_packaging

logger = get_logger("packaging_routes")
router = APIRouter(prefix="/api/packaging", tags=["Packaging Analysis"])

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/bmp"}


@router.post("/inspect")
async def inspect_packaging(
    file: UploadFile = File(..., description="Medicine packaging or blister pack photo"),
    medicine_name: Optional[str] = Form(None, description="Medicine name if known"),
    medicine_id: Optional[str] = Form(None, description="Medicine UUID if known"),
    db: AsyncSession = Depends(get_db),
):
    """Analyze medicine packaging for visual anomalies, blur, tampering, or damage indicators.
    
    Uses OpenCV image processing to inspect edge distribution, blurriness, and compares
    against reference packaging images when available.
    
    Note: Packaging inspection indicates surface anomalies and does not constitute
    definitive forensic confirmation of medicine authenticity.
    """
    settings = get_settings()

    if file.content_type and file.content_type not in ALLOWED_IMAGE_TYPES:
        raise BadRequestError(
            f"Invalid file type '{file.content_type}'. Allowed: {', '.join(ALLOWED_IMAGE_TYPES)}"
        )

    image_bytes = await file.read()
    if not image_bytes:
        raise BadRequestError("Uploaded packaging image is empty")

    if len(image_bytes) > settings.max_upload_bytes:
        raise FileTooLargeError(settings.MAX_UPLOAD_SIZE_MB)

    result = await analyze_packaging(
        db=db,
        image_bytes=image_bytes,
        medicine_name=medicine_name,
        medicine_id=medicine_id,
    )

    return result
