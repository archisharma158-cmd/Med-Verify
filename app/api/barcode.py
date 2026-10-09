"""Barcode and QR code decoding routes."""
from __future__ import annotations

from fastapi import APIRouter, File, UploadFile

from app.core.config import get_settings
from app.core.exceptions import BadRequestError, FileTooLargeError
from app.schemas.schemas import BarcodeDecodeResponse
from app.services.barcode_service import decode_barcode_image

router = APIRouter(prefix="/api/barcode", tags=["Barcode"])

ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp", "image/bmp", "image/gif"}


@router.post("/decode", response_model=BarcodeDecodeResponse)
async def decode_barcode(
    file: UploadFile = File(..., description="Barcode or QR code image"),
):
    """Decode a barcode or QR code from an uploaded image.
    
    Supports: EAN-13, EAN-8, UPC-A, UPC-E, Code128, DataMatrix, QR Code.
    Parses GS1 Application Identifiers when present.
    
    Note: Successful decoding does not constitute proof of medicine authenticity.
    """
    settings = get_settings()

    # Validate MIME type
    if file.content_type and file.content_type not in ALLOWED_MIME_TYPES:
        raise BadRequestError(f"Unsupported file type: {file.content_type}. Use JPEG, PNG, or WebP.")

    # Read and check size
    image_bytes = await file.read()
    if len(image_bytes) > settings.max_upload_bytes:
        raise FileTooLargeError(settings.MAX_UPLOAD_SIZE_MB)

    if len(image_bytes) == 0:
        raise BadRequestError("Empty file uploaded")

    result = await decode_barcode_image(image_bytes)
    return result
