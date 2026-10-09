"""CDSCO regulatory alert service – CSV-based ingestion and matching."""
from __future__ import annotations

import csv
import io
import re
import uuid
from datetime import date, datetime
from typing import Optional

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import get_logger
from app.models.models import RegulatoryAlert
from app.schemas.schemas import AlertImportResult

logger = get_logger("cdsco_service")


def _normalize_for_matching(text: str) -> str:
    """Normalize text for alert matching."""
    if not text:
        return ""
    text = text.lower().strip()
    text = re.sub(r"[^\w\s]", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text


async def check_regulatory_alerts(
    db: AsyncSession,
    product_name: Optional[str] = None,
    manufacturer: Optional[str] = None,
    batch_number: Optional[str] = None,
) -> dict:
    """Check if a medicine matches any imported regulatory alerts.
    
    Returns a result dict with status and matched alerts.
    """
    if not product_name and not batch_number:
        return {
            "status": "insufficient_data",
            "alerts": [],
            "details": "No product name or batch number provided for alert check.",
        }

    conditions = []

    if batch_number:
        norm_batch = batch_number.upper().strip()
        conditions.append(
            func.upper(func.trim(RegulatoryAlert.batch_number)) == norm_batch
        )

    if product_name:
        norm_name = _normalize_for_matching(product_name)
        conditions.append(
            func.lower(RegulatoryAlert.product_name).contains(norm_name)
        )

    if not conditions:
        return {
            "status": "no_match_in_imported_data",
            "alerts": [],
            "details": "No matching criteria provided.",
        }

    # Search with OR to catch either name or batch matches
    query = select(RegulatoryAlert).where(or_(*conditions)).limit(10)
    result = await db.execute(query)
    alerts = list(result.scalars().all())

    if alerts:
        # Check for strong matches (batch + name both match)
        strong_matches = []
        weak_matches = []
        for alert in alerts:
            name_match = product_name and alert.product_name and (
                _normalize_for_matching(product_name) in _normalize_for_matching(alert.product_name)
                or _normalize_for_matching(alert.product_name) in _normalize_for_matching(product_name)
            )
            batch_match = batch_number and alert.batch_number and (
                batch_number.upper().strip() == (alert.batch_number or "").upper().strip()
            )

            if name_match and batch_match:
                strong_matches.append(alert)
            elif name_match or batch_match:
                weak_matches.append(alert)

        matched_alerts = [
            {
                "alert_id": str(a.id),
                "product_name": a.product_name,
                "manufacturer": a.manufacturer,
                "batch_number": a.batch_number,
                "alert_type": a.alert_type,
                "reported_issue": a.reported_issue,
                "source": a.regulatory_source,
                "publication_date": str(a.publication_date) if a.publication_date else None,
                "source_url": a.source_url,
                "match_strength": "strong" if a in strong_matches else "partial",
            }
            for a in (strong_matches + weak_matches)
        ]

        return {
            "status": "alert_match",
            "alerts": matched_alerts,
            "details": f"Found {len(matched_alerts)} regulatory alert(s) matching this medicine.",
        }

    return {
        "status": "no_match_in_imported_data",
        "alerts": [],
        "details": (
            "No matching regulatory alerts in imported data. "
            "Note: Alert data is periodically imported and may not reflect the latest publications."
        ),
    }


async def get_alert_data_freshness(db: AsyncSession) -> Optional[str]:
    """Get the most recent alert import timestamp."""
    query = select(func.max(RegulatoryAlert.created_at))
    result = await db.execute(query)
    latest = result.scalar()
    if latest:
        return latest.isoformat()
    return None


async def import_alerts_from_csv(
    db: AsyncSession,
    csv_content: str,
    source: str = "CDSCO",
) -> AlertImportResult:
    """Import regulatory alerts from CSV content.
    
    Expected CSV columns (flexible matching):
    - product_name / drug_name / medicine_name
    - manufacturer / mfr / marketed_by
    - batch_number / batch_no / lot_no
    - alert_type / type / category
    - reported_issue / issue / reason
    - publication_date / date / published
    - source_url / url / link
    """
    import_batch_id = f"import_{uuid.uuid4().hex[:8]}_{datetime.utcnow().strftime('%Y%m%d')}"
    imported = 0
    skipped = 0
    errors: list[str] = []

    try:
        reader = csv.DictReader(io.StringIO(csv_content))
        if not reader.fieldnames:
            return AlertImportResult(
                imported=0, skipped=0,
                errors=["CSV file has no headers"],
                import_batch_id=import_batch_id,
            )

        # Flexible column mapping
        column_map = _map_columns(reader.fieldnames)

        for row_num, row in enumerate(reader, start=2):
            try:
                product_name = _get_field(row, column_map, "product_name")
                if not product_name:
                    skipped += 1
                    continue

                manufacturer = _get_field(row, column_map, "manufacturer")
                batch_number = _get_field(row, column_map, "batch_number")
                alert_type = _get_field(row, column_map, "alert_type")
                reported_issue = _get_field(row, column_map, "reported_issue")
                pub_date_str = _get_field(row, column_map, "publication_date")
                source_url = _get_field(row, column_map, "source_url")

                pub_date = _parse_date(pub_date_str) if pub_date_str else None

                # Check for duplicates
                existing = await db.execute(
                    select(RegulatoryAlert).where(
                        RegulatoryAlert.product_name == product_name,
                        RegulatoryAlert.batch_number == batch_number,
                        RegulatoryAlert.regulatory_source == source,
                    ).limit(1)
                )
                if existing.scalar_one_or_none():
                    skipped += 1
                    continue

                alert = RegulatoryAlert(
                    product_name=product_name,
                    manufacturer=manufacturer,
                    batch_number=batch_number,
                    alert_type=alert_type,
                    reported_issue=reported_issue,
                    regulatory_source=source,
                    publication_date=pub_date,
                    source_url=source_url,
                    import_batch_id=import_batch_id,
                )
                db.add(alert)
                imported += 1

            except Exception as e:
                errors.append(f"Row {row_num}: {str(e)}")

        await db.flush()
        logger.info(
            "alerts_imported",
            imported=imported,
            skipped=skipped,
            errors=len(errors),
            batch_id=import_batch_id,
        )

    except csv.Error as e:
        errors.append(f"CSV parsing error: {str(e)}")

    return AlertImportResult(
        imported=imported,
        skipped=skipped,
        errors=errors[:20],  # Limit error list
        import_batch_id=import_batch_id,
    )


def _map_columns(fieldnames: list[str]) -> dict[str, str]:
    """Map CSV column names to standard field names."""
    mapping: dict[str, str] = {}
    lower_fields = {f.lower().strip(): f for f in fieldnames}

    name_candidates = ["product_name", "drug_name", "medicine_name", "name", "product"]
    mfr_candidates = ["manufacturer", "mfr", "marketed_by", "company"]
    batch_candidates = ["batch_number", "batch_no", "lot_no", "batch", "lot"]
    type_candidates = ["alert_type", "type", "category"]
    issue_candidates = ["reported_issue", "issue", "reason", "description"]
    date_candidates = ["publication_date", "date", "published", "pub_date"]
    url_candidates = ["source_url", "url", "link"]

    for target, candidates in [
        ("product_name", name_candidates),
        ("manufacturer", mfr_candidates),
        ("batch_number", batch_candidates),
        ("alert_type", type_candidates),
        ("reported_issue", issue_candidates),
        ("publication_date", date_candidates),
        ("source_url", url_candidates),
    ]:
        for c in candidates:
            if c in lower_fields:
                mapping[target] = lower_fields[c]
                break

    return mapping


def _get_field(row: dict, column_map: dict[str, str], field: str) -> Optional[str]:
    """Get a field value using the column mapping."""
    col = column_map.get(field)
    if col and col in row:
        val = row[col].strip() if row[col] else None
        return val if val else None
    return None


def _parse_date(date_str: str) -> Optional[date]:
    """Parse date from various formats."""
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y", "%m/%d/%Y", "%Y/%m/%d", "%d.%m.%Y"):
        try:
            return datetime.strptime(date_str.strip(), fmt).date()
        except ValueError:
            continue
    return None
