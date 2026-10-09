"""OCR service using OCR.space API with image preprocessing."""
from __future__ import annotations

import io
import re
from typing import Optional

import cv2
import httpx
import numpy as np
from PIL import Image

from app.core.config import get_settings
from app.core.exceptions import ExternalServiceError
from app.core.logging import get_logger
from app.schemas.schemas import OCRField, OCRResponse

logger = get_logger("ocr_service")

OCR_SPACE_URL = "https://api.ocr.space/parse/image"

# Common medicine date patterns
DATE_PATTERNS = [
    # DD/MM/YYYY or DD-MM-YYYY
    (r"(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})", "dmy"),
    # MM/YYYY or MM-YYYY
    (r"(\d{1,2})[/\-.](\d{4})", "my"),
    # YYYY-MM-DD
    (r"(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})", "ymd"),
    # Month YYYY (e.g. "Jan 2025", "January 2025")
    (r"(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s*[\-/.]?\s*(\d{4})", "month_year"),
    # MMYYYY (common on Indian medicines)
    (r"(\d{2})(\d{4})", "mmyyyy"),
]

MONTH_MAP = {
    "jan": "01", "january": "01", "feb": "02", "february": "02",
    "mar": "03", "march": "03", "apr": "04", "april": "04",
    "may": "05", "jun": "06", "june": "06", "jul": "07", "july": "07",
    "aug": "08", "august": "08", "sep": "09", "september": "09",
    "oct": "10", "october": "10", "nov": "11", "november": "11",
    "dec": "12", "december": "12",
}

# Patterns for extracting medicine info from OCR text
BATCH_PATTERNS = [
    r"(?:batch\s*(?:no\.?|number|#)?|b\.?\s*no\.?|lot\s*(?:no\.?|#)?)\s*[:\-]?\s*([A-Z0-9\-/]+)",
    r"(?:B\.?\s*N\.?\s*[:\-]?\s*)([A-Z0-9\-/]+)",
]

MFG_DATE_LABELS = [
    r"(?:mfg\.?\s*(?:date|dt\.?)?|mfd\.?|manufacturing\s*date|date\s*of\s*(?:mfg|manufacturing))\s*[:\-]?\s*",
    r"(?:mfg\.?\s*[:\-]?\s*)",
]

EXP_DATE_LABELS = [
    r"(?:exp\.?\s*(?:date|dt\.?)?|expiry\s*(?:date)?|use\s*before|best\s*before|not\s*to\s*be\s*sold\s*after)\s*[:\-]?\s*",
    r"(?:exp\.?\s*[:\-]?\s*)",
]

MFR_PATTERNS = [
    r"(?:mfr\.?\s*(?:by)?|manufactured\s*by|marketed\s*by|mfg\.?\s*by)\s*[:\-]?\s*(.+?)(?:\n|$)",
]


def _preprocess_image(image_bytes: bytes) -> bytes:
    """Preprocess medicine packaging image for better OCR accuracy."""
    pil_image = Image.open(io.BytesIO(image_bytes))
    img_array = np.array(pil_image)

    # Convert to grayscale
    if len(img_array.shape) == 3:
        gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
    else:
        gray = img_array

    # Denoise
    denoised = cv2.fastNlMeansDenoising(gray, None, 10, 7, 21)

    # Enhance contrast
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(denoised)

    # Sharpen
    kernel = np.array([[-1, -1, -1], [-1, 9, -1], [-1, -1, -1]])
    sharpened = cv2.filter2D(enhanced, -1, kernel)

    # Adaptive thresholding
    binary = cv2.adaptiveThreshold(
        sharpened, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2
    )

    # Encode back to bytes
    pil_result = Image.fromarray(binary)
    buf = io.BytesIO()
    pil_result.save(buf, format="PNG")
    return buf.getvalue()


def _extract_date(text: str, label_patterns: list[str]) -> tuple[Optional[str], str]:
    """Extract a date following a label pattern. Returns (date_string, confidence)."""
    for label in label_patterns:
        match = re.search(label, text, re.IGNORECASE)
        if match:
            after_label = text[match.end(): match.end() + 30]
            for pattern, fmt in DATE_PATTERNS:
                date_match = re.search(pattern, after_label, re.IGNORECASE)
                if date_match:
                    return _format_date(date_match, fmt), "medium"
    return None, "unknown"


def _format_date(match: re.Match, fmt: str) -> str:
    """Format a regex date match to ISO-ish date string."""
    groups = match.groups()
    try:
        if fmt == "dmy":
            return f"{groups[2]}-{groups[1].zfill(2)}-{groups[0].zfill(2)}"
        elif fmt == "my":
            return f"{groups[1]}-{groups[0].zfill(2)}"
        elif fmt == "ymd":
            return f"{groups[0]}-{groups[1].zfill(2)}-{groups[2].zfill(2)}"
        elif fmt == "month_year":
            month_num = MONTH_MAP.get(groups[0].lower()[:3], "01")
            return f"{groups[1]}-{month_num}"
        elif fmt == "mmyyyy":
            mm, yyyy = groups[0], groups[1]
            if 1 <= int(mm) <= 12 and 2000 <= int(yyyy) <= 2040:
                return f"{yyyy}-{mm}"
    except (ValueError, IndexError):
        pass
    return match.group(0)


def _extract_batch(text: str) -> tuple[Optional[str], str]:
    """Extract batch number from OCR text."""
    for pattern in BATCH_PATTERNS:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(1).strip(), "medium"
    return None, "unknown"


def _extract_manufacturer(text: str) -> tuple[Optional[str], str]:
    """Extract manufacturer from OCR text."""
    for pattern in MFR_PATTERNS:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            mfr = match.group(1).strip()
            # Clean up common OCR artifacts
            mfr = re.sub(r"[|].*$", "", mfr).strip()
            if len(mfr) > 3:
                return mfr, "medium"
    return None, "unknown"


def _extract_medicine_name(text: str) -> tuple[Optional[str], str]:
    """Attempt to extract the medicine name (usually the most prominent text)."""
    lines = [l.strip() for l in text.split("\n") if l.strip()]
    # Heuristic: medicine name is often in the first few lines, in title case or uppercase
    for line in lines[:5]:
        # Skip lines that look like dates, batch numbers, or manufacturer labels
        if re.match(r"(?:mfg|exp|batch|b\.no|mfr|manufactured|marketed|date)", line, re.IGNORECASE):
            continue
        if re.match(r"^\d+[/\-.]", line):
            continue
        # Medicine names are typically short and uppercase
        cleaned = re.sub(r"[^\w\s\-]", "", line).strip()
        if 3 < len(cleaned) < 100:
            return cleaned, "low"
    return None, "unknown"


def _extract_strength(text: str) -> tuple[Optional[str], str]:
    """Extract strength/dosage (e.g. '500mg', '10ml')."""
    match = re.search(r"(\d+(?:\.\d+)?)\s*(mg|ml|g|mcg|iu|%)\b", text, re.IGNORECASE)
    if match:
        return f"{match.group(1)}{match.group(2).lower()}", "medium"
    return None, "unknown"


async def extract_text_from_image(image_bytes: bytes, filename: str = "image.jpg") -> OCRResponse:
    """Send image to OCR.space and parse structured medicine info."""
    settings = get_settings()
    if not settings.check_service_available("ocr"):
        return OCRResponse(
            success=False,
            notes=["OCR service not configured. Please enter medicine details manually."],
        )

    notes: list[str] = []

    try:
        # Preprocess image
        processed = _preprocess_image(image_bytes)

        # Call OCR.space
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                OCR_SPACE_URL,
                data={
                    "apikey": settings.OCR_SPACE_API_KEY,
                    "language": "eng",
                    "isOverlayRequired": "false",
                    "detectOrientation": "true",
                    "scale": "true",
                    "OCREngine": "2",
                },
                files={"file": (filename, processed, "image/png")},
            )
            response.raise_for_status()
            result = response.json()

        # Check for API errors
        if result.get("IsErroredOnProcessing", False):
            error_msg = result.get("ErrorMessage", ["OCR processing failed"])[0]
            logger.warning("ocr_api_error", error=error_msg)
            return OCRResponse(
                success=False,
                notes=[f"OCR processing error: {error_msg}. Please enter details manually."],
            )

        # Extract text
        parsed_results = result.get("ParsedResults", [])
        if not parsed_results:
            return OCRResponse(
                success=False,
                notes=["No text could be extracted from the image. Please enter details manually."],
            )

        raw_text = parsed_results[0].get("ParsedText", "")
        if not raw_text.strip():
            return OCRResponse(
                success=False,
                raw_text="",
                notes=["No readable text found in the image. Try a clearer photo or enter details manually."],
            )

        logger.info("ocr_text_extracted", text_length=len(raw_text))

        # Parse structured fields
        medicine_name_val, medicine_name_conf = _extract_medicine_name(raw_text)
        manufacturer_val, manufacturer_conf = _extract_manufacturer(raw_text)
        batch_val, batch_conf = _extract_batch(raw_text)
        mfg_date_val, mfg_date_conf = _extract_date(raw_text, MFG_DATE_LABELS)
        exp_date_val, exp_date_conf = _extract_date(raw_text, EXP_DATE_LABELS)
        strength_val, strength_conf = _extract_strength(raw_text)

        # Note fields requiring confirmation
        notes.append("OCR extraction is approximate. Please review and correct all fields before verification.")

        return OCRResponse(
            raw_text=raw_text,
            medicine_name=OCRField(
                value=medicine_name_val,
                confidence=medicine_name_conf,
                requires_confirmation=True,
            ),
            manufacturer=OCRField(
                value=manufacturer_val,
                confidence=manufacturer_conf,
                requires_confirmation=manufacturer_conf != "high",
            ),
            batch_number=OCRField(
                value=batch_val,
                confidence=batch_conf,
                requires_confirmation=True,
            ),
            manufacturing_date=OCRField(
                value=mfg_date_val,
                confidence=mfg_date_conf,
                requires_confirmation=True,
            ),
            expiry_date=OCRField(
                value=exp_date_val,
                confidence=exp_date_conf,
                requires_confirmation=True,
            ),
            strength=OCRField(
                value=strength_val,
                confidence=strength_conf,
                requires_confirmation=True,
            ),
            success=True,
            notes=notes,
        )

    except httpx.TimeoutException:
        logger.error("ocr_timeout")
        return OCRResponse(
            success=False,
            notes=["OCR service timed out. Please try again or enter details manually."],
        )
    except Exception as e:
        logger.error("ocr_service_error", error=str(e))
        return OCRResponse(
            success=False,
            notes=[f"OCR service error. Please enter details manually."],
        )
