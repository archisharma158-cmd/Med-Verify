"""OCR routes for medicine packaging text extraction."""
from __future__ import annotations

from fastapi import APIRouter, File, UploadFile

from app.core.config import get_settings
from app.core.exceptions import BadRequestError, FileTooLargeError
from app.schemas.schemas import OCRResponse
from app.services.ocr_service import extract_text_from_image

router = APIRouter(prefix="/api/ocr", tags=["OCR"])

ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp", "image/bmp"}


@router.post("", response_model=OCRResponse)
async def extract_medicine_text(
    file: UploadFile = File(..., description="Medicine packaging image"),
):
    """Extract medicine details from a packaging image using OCR.
    
    Returns structured fields (name, manufacturer, batch, dates) along with
    raw extracted text. All fields are marked with confidence levels and
    may require user confirmation before verification.
    """
    settings = get_settings()

    # Validate
    if file.content_type and file.content_type not in ALLOWED_MIME_TYPES:
        raise BadRequestError(f"Unsupported file type: {file.content_type}. Use JPEG, PNG, or WebP.")

    image_bytes = await file.read()
    if len(image_bytes) > settings.max_upload_bytes:
        raise FileTooLargeError(settings.MAX_UPLOAD_SIZE_MB)

    if len(image_bytes) == 0:
        raise BadRequestError("Empty file uploaded")

    result = await extract_text_from_image(
        image_bytes,
        filename=file.filename or "image.jpg",
    )
    return result
