"""Barcode and QR code decoding service using pyzbar + OpenCV."""
from __future__ import annotations

import io
import re
from typing import Any

import cv2
import numpy as np
from PIL import Image
from pyzbar.pyzbar import decode as pyzbar_decode

from app.core.logging import get_logger
from app.schemas.schemas import BarcodeDecodeResponse

logger = get_logger("barcode_service")

# GS1 Application Identifiers
GS1_AI = {
    "01": ("gtin", 14),
    "02": ("content_gtin", 14),
    "10": ("batch_number", None),
    "11": ("production_date", 6),
    "13": ("packaging_date", 6),
    "15": ("best_before_date", 6),
    "17": ("expiry_date", 6),
    "21": ("serial_number", None),
    "30": ("quantity", None),
    "37": ("count", None),
    "240": ("product_identifier", None),
    "241": ("customer_part_number", None),
    "310": ("net_weight_kg", 6),
    "710": ("national_healthcare_number", None),
    "8004": ("giai", None),
}


def _parse_gs1(data: str) -> dict[str, str]:
    """Parse GS1 element string with Application Identifiers."""
    parsed: dict[str, str] = {}
    # Remove FNC1 / GS characters
    data = data.replace("\x1d", "|").replace("(", "").replace(")", "")
    # Try AI-based parsing
    i = 0
    while i < len(data):
        matched = False
        for ai_len in (4, 3, 2):
            ai = data[i : i + ai_len]
            if ai in GS1_AI:
                name, fixed_len = GS1_AI[ai]
                i += ai_len
                if fixed_len:
                    value = data[i : i + fixed_len]
                    i += fixed_len
                else:
                    # Variable length, read until separator or end
                    end = data.find("|", i)
                    if end == -1:
                        end = len(data)
                    value = data[i:end]
                    i = end + 1 if end < len(data) else end
                parsed[name] = value
                matched = True
                break
        if not matched:
            i += 1
    return parsed


def _parse_gs1_date(date_str: str) -> str | None:
    """Parse GS1 YYMMDD date format to ISO date."""
    if not date_str or len(date_str) != 6:
        return None
    try:
        yy, mm, dd = int(date_str[:2]), int(date_str[2:4]), int(date_str[4:6])
        year = 2000 + yy if yy < 50 else 1900 + yy
        if dd == 0:
            dd = 1  # GS1 uses 00 for last day of month, we use 1 for safety
        return f"{year:04d}-{mm:02d}-{dd:02d}"
    except (ValueError, IndexError):
        return None


async def decode_barcode_image(image_bytes: bytes) -> BarcodeDecodeResponse:
    """Decode barcode/QR from image bytes and extract structured data."""
    notes: list[str] = []
    try:
        # Load image
        pil_image = Image.open(io.BytesIO(image_bytes))
        img_array = np.array(pil_image)

        # Convert to grayscale if needed
        if len(img_array.shape) == 3:
            gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
        else:
            gray = img_array

        # Try multiple preprocessing approaches
        decoded_results = []

        # Pass 1: Direct decode
        decoded_results.extend(pyzbar_decode(gray))

        # Pass 2: With contrast enhancement
        if not decoded_results:
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
            enhanced = clahe.apply(gray)
            decoded_results.extend(pyzbar_decode(enhanced))

        # Pass 3: With thresholding
        if not decoded_results:
            _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            decoded_results.extend(pyzbar_decode(binary))

        if not decoded_results:
            return BarcodeDecodeResponse(
                success=False,
                notes=["No barcode or QR code detected in the image. Ensure the code is clearly visible and well-lit."],
            )

        # Use first successful decode
        result = decoded_results[0]
        raw_payload = result.data.decode("utf-8", errors="replace")
        barcode_type = result.type

        logger.info("barcode_decoded", barcode_type=barcode_type, payload_length=len(raw_payload))

        # Parse structured data
        gtin = None
        batch_number = None
        expiry_date = None
        serial_number = None
        product_identifier = None
        parsed_fields: dict[str, Any] = {}

        # Try GS1 parsing
        gs1_data = _parse_gs1(raw_payload)
        if gs1_data:
            parsed_fields = gs1_data
            gtin = gs1_data.get("gtin")
            batch_number = gs1_data.get("batch_number")
            serial_number = gs1_data.get("serial_number")
            product_identifier = gs1_data.get("product_identifier")
            raw_expiry = gs1_data.get("expiry_date")
            if raw_expiry:
                expiry_date = _parse_gs1_date(raw_expiry)
        elif barcode_type in ("EAN13", "EAN8", "UPCA", "UPCE"):
            # Standard retail barcodes – the number itself may be a GTIN
            gtin = raw_payload
            parsed_fields["gtin"] = gtin
            notes.append(
                "Standard retail barcode detected. Only product identifier available; "
                "batch/expiry information is not encoded in this format."
            )
        elif barcode_type == "QRCODE":
            # QR codes may contain various data formats
            if raw_payload.startswith("http"):
                parsed_fields["url"] = raw_payload
                notes.append("QR code contains a URL. Medicine-specific data may not be directly encoded.")
            else:
                parsed_fields["raw_data"] = raw_payload
                notes.append("QR code decoded. Data format is not standard GS1; fields may require manual interpretation.")
        else:
            parsed_fields["raw_data"] = raw_payload

        notes.append(
            "Successful barcode decoding does not constitute proof of medicine authenticity. "
            "Verification checks are performed separately."
        )

        return BarcodeDecodeResponse(
            raw_payload=raw_payload,
            barcode_type=barcode_type,
            gtin=gtin,
            batch_number=batch_number,
            expiry_date=expiry_date,
            serial_number=serial_number,
            product_identifier=product_identifier,
            parsed_fields=parsed_fields,
            notes=notes,
            success=True,
        )

    except Exception as e:
        logger.error("barcode_decode_error", error=str(e))
        return BarcodeDecodeResponse(
            success=False,
            notes=[f"Barcode decoding failed: {str(e)}"],
        )
