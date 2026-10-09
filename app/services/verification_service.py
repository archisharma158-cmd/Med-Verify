"""Complete medicine verification engine – orchestrates all checks."""
from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import Any, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import get_logger
from app.models.models import ScanHistory
from app.schemas.schemas import (
    CheckResults,
    ExplanationText,
    RiskResult,
    VerifyRequest,
    VerifyResponse,
)
from app.services import cdsco_service, duplicate_service, medicine_service, packaging_service
from app.services.risk_service import get_risk_engine

logger = get_logger("verification_service")


def _parse_expiry_date(date_str: Optional[str]) -> tuple[Optional[date], str]:
    """Parse expiry date from various string formats.
    
    Returns (parsed_date, interpretation_note).
    Month/year dates are interpreted as end of that month.
    """
    if not date_str:
        return None, "No expiry date provided"

    from dateutil import parser as date_parser
    from dateutil.relativedelta import relativedelta
    import re

    date_str = date_str.strip()

    # Handle MM/YYYY or MM-YYYY (common on Indian medicines)
    mm_yyyy = re.match(r"^(\d{1,2})[/\-.](\d{4})$", date_str)
    if mm_yyyy:
        month, year = int(mm_yyyy.group(1)), int(mm_yyyy.group(2))
        if 1 <= month <= 12:
            # End of the month
            d = date(year, month, 1) + relativedelta(months=1) - relativedelta(days=1)
            return d, f"Interpreted as end of {year}-{month:02d} ({d.isoformat()})"

    # Handle YYYY-MM
    yyyy_mm = re.match(r"^(\d{4})[/\-.](\d{1,2})$", date_str)
    if yyyy_mm:
        year, month = int(yyyy_mm.group(1)), int(yyyy_mm.group(2))
        if 1 <= month <= 12:
            d = date(year, month, 1) + relativedelta(months=1) - relativedelta(days=1)
            return d, f"Interpreted as end of {year}-{month:02d} ({d.isoformat()})"

    # Standard date parsing
    try:
        parsed = date_parser.parse(date_str, dayfirst=True).date()
        return parsed, f"Parsed as {parsed.isoformat()}"
    except (ValueError, TypeError):
        pass

    try:
        parsed = date_parser.parse(date_str).date()
        return parsed, f"Parsed as {parsed.isoformat()}"
    except (ValueError, TypeError):
        return None, f"Could not parse date: {date_str}"


def _check_expiry(expiry_date: Optional[date]) -> str:
    """Determine expiry status."""
    if not expiry_date:
        return "unknown"

    today = date.today()
    if expiry_date < today:
        return "expired"
    elif (expiry_date - today).days <= 90:
        return "near_expiry"
    else:
        return "not_expired"


async def verify_medicine(
    db: AsyncSession,
    request: VerifyRequest,
    user_id: Optional[str] = None,
) -> VerifyResponse:
    """Run the complete verification pipeline.
    
    Steps:
    1. Parse and normalize input
    2. Check expiry date
    3. Match manufacturer/product against database
    4. Check regulatory alerts
    5. Analyze duplicate scanning patterns
    6. Packaging analysis (if image provided)
    7. Risk scoring
    8. Generate explanations
    9. Store scan history
    """
    scan_id = uuid.uuid4()
    warnings: list[str] = []
    data_sources: list[str] = []

    logger.info("verification_started", scan_id=str(scan_id), input_method=request.input_method)

    # ── 1. Parse expiry date ──
    expiry_date, expiry_note = _parse_expiry_date(request.expiry_date)
    expiry_status = _check_expiry(expiry_date)

    # ── 2. Manufacturer matching ──
    mfr_result = await medicine_service.match_manufacturer(
        db,
        medicine_name=request.medicine_name,
        manufacturer=request.manufacturer,
    )
    mfr_status = mfr_result.get("status", "insufficient_data")
    if mfr_result.get("data_source"):
        data_sources.append(f"medicine_db:{mfr_result['data_source']}")

    # ── 3. Regulatory alert check ──
    alert_result = await cdsco_service.check_regulatory_alerts(
        db,
        product_name=request.medicine_name,
        manufacturer=request.manufacturer,
        batch_number=request.batch_number,
    )
    alert_status = alert_result.get("status", "no_match_in_imported_data")
    if alert_result.get("alerts"):
        data_sources.append("cdsco_alerts")

    # ── 4. Duplicate scan detection ──
    dup_result = await duplicate_service.check_duplicate_scans(
        db,
        serial_number=request.serial_number,
        gtin=request.gtin,
        batch_number=request.batch_number,
        device_fingerprint=request.device_fingerprint,
    )
    dup_status = dup_result.get("status", "insufficient_data")

    # ── 5. Packaging analysis ──
    packaging_status = "not_checked"
    packaging_data: dict = {}
    # Packaging analysis would be performed if image is uploaded separately

    # ── 6. Alert data freshness ──
    alert_freshness = await cdsco_service.get_alert_data_freshness(db)

    # ── 7. Build checks result ──
    checks = CheckResults(
        expiry=expiry_status,
        manufacturer=mfr_status,
        regulatory_alert=alert_status,
        duplicate_scan=dup_status,
        packaging=packaging_status,
    )

    # ── 8. Risk scoring ──
    verification_data = {
        "medicine_name": request.medicine_name,
        "manufacturer": request.manufacturer,
        "batch_number": request.batch_number,
        "expiry_date": str(expiry_date) if expiry_date else None,
        "checks": checks.model_dump(),
        "alert_data": alert_result,
        "duplicate_data": dup_result,
        "packaging_data": packaging_data,
    }

    risk_engine = get_risk_engine()
    features = risk_engine.extract_features(verification_data)
    prediction = risk_engine.predict(features)
    explanation_data = risk_engine.explain(features, prediction)

    risk = RiskResult(
        score=prediction["score"],
        category=prediction["category"],
        method=prediction["method"],
        model_version=prediction["model_version"],
        validated_probability=prediction.get("validated_probability", False),
    )

    # ── 9. Compile warnings ──
    warnings.extend(explanation_data.get("warnings", []))

    # Ensure serious issues remain visible regardless of score
    if expiry_status == "expired" and "EXPIRED" not in " ".join(warnings):
        warnings.insert(0, "EXPIRED: This medicine appears to be past its expiry date.")
    if alert_status == "alert_match":
        alert_warning = "REGULATORY ALERT: This product matches a published regulatory alert."
        if alert_warning not in warnings:
            warnings.insert(0, alert_warning)

    # ── 10. Determine overall verification status ──
    if alert_status == "alert_match":
        verification_status = "regulatory_alert_match"
    elif expiry_status == "expired":
        verification_status = "checks_completed"
    elif mfr_status == "insufficient_data" and not request.batch_number:
        verification_status = "insufficient_data"
    elif prediction["score"] > 60:
        verification_status = "manual_review_recommended"
    else:
        verification_status = "checks_completed"

    # ── 11. Store scan history ──
    scan_record = ScanHistory(
        id=scan_id,
        user_id=uuid.UUID(user_id) if user_id else None,
        medicine_name=request.medicine_name,
        manufacturer=request.manufacturer,
        batch_number=request.batch_number,
        gtin=request.gtin,
        serial_number=request.serial_number,
        expiry_date=expiry_date,
        input_method=request.input_method,
        risk_score=prediction["score"],
        risk_category=prediction["category"],
        verification_status=verification_status,
        explanation_en=explanation_data["explanation"]["en"],
        explanation_hi=explanation_data["explanation"]["hi"],
        device_fingerprint=request.device_fingerprint,
        location_lat=request.location_lat if request.location_consent else None,
        location_lng=request.location_lng if request.location_consent else None,
        location_consent=request.location_consent,
    )
    db.add(scan_record)
    await db.flush()

    # ── 12. Build response ──
    medicine_info: dict[str, Any] = {
        "name": request.medicine_name,
        "manufacturer": request.manufacturer,
        "batch_number": request.batch_number,
        "expiry_date": str(expiry_date) if expiry_date else None,
        "gtin": request.gtin,
        "strength": request.strength,
        "dosage_form": request.dosage_form,
    }

    response = VerifyResponse(
        scan_id=scan_id,
        verification_status=verification_status,
        risk=risk,
        medicine=medicine_info,
        checks=checks,
        warnings=warnings,
        explanation=ExplanationText(
            en=explanation_data["explanation"]["en"],
            hi=explanation_data["explanation"]["hi"],
        ),
        next_steps=explanation_data.get("next_steps", []),
        data_sources=data_sources,
        alert_data_freshness=alert_freshness,
    )

    logger.info(
        "verification_completed",
        scan_id=str(scan_id),
        risk_score=prediction["score"],
        risk_category=prediction["category"],
        status=verification_status,
    )

    return response
