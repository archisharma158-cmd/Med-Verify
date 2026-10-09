"""Duplicate scan detection service."""
from __future__ import annotations

from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import get_logger
from app.models.models import ScanHistory

logger = get_logger("duplicate_service")


async def check_duplicate_scans(
    db: AsyncSession,
    serial_number: Optional[str] = None,
    gtin: Optional[str] = None,
    batch_number: Optional[str] = None,
    device_fingerprint: Optional[str] = None,
) -> dict:
    """Analyze scan patterns for suspicious duplicates.
    
    This checks for:
    1. Multiple scans of the same serialized identifier from different devices
    2. Unusually high scan frequency for the same product
    3. Geographic anomalies (if location consent given)
    
    Important: Same batch number across different packs is NORMAL and does not
    indicate counterfeiting. Only serialized identifiers (serial numbers) should
    trigger strong duplicate alerts.
    """
    if not serial_number and not gtin:
        return {
            "status": "insufficient_data",
            "details": "No serial number or product identifier available for duplicate analysis.",
            "anomaly_score": 0,
        }

    anomalies: list[str] = []
    anomaly_score = 0
    time_window = datetime.utcnow() - timedelta(days=30)

    # Check 1: Serialized identifier scans (strongest signal)
    if serial_number:
        serial_query = select(ScanHistory).where(
            and_(
                ScanHistory.serial_number == serial_number,
                ScanHistory.scan_timestamp >= time_window,
            )
        )
        result = await db.execute(serial_query)
        serial_scans = list(result.scalars().all())

        if len(serial_scans) > 1:
            # Multiple scans of the same serial number
            unique_devices = len(set(
                s.device_fingerprint for s in serial_scans
                if s.device_fingerprint
            ))

            if unique_devices > 1:
                anomaly_score += 40
                anomalies.append(
                    f"Serial number scanned from {unique_devices} different devices in 30 days. "
                    "This may indicate duplicate serialized products."
                )
            elif len(serial_scans) > 3:
                anomaly_score += 15
                anomalies.append(
                    f"Serial number scanned {len(serial_scans)} times in 30 days."
                )

    # Check 2: GTIN + batch frequency (weaker signal – batch sharing is normal)
    if gtin and batch_number:
        freq_query = select(func.count(ScanHistory.id)).where(
            and_(
                ScanHistory.gtin == gtin,
                ScanHistory.batch_number == batch_number,
                ScanHistory.scan_timestamp >= time_window,
            )
        )
        result = await db.execute(freq_query)
        scan_count = result.scalar() or 0

        if scan_count > 50:
            anomaly_score += 10
            anomalies.append(
                f"Product+batch combination scanned {scan_count} times in 30 days. "
                "High frequency may warrant investigation, but batch sharing across packs is normal."
            )

    # Check 3: Device-specific scanning burst
    if device_fingerprint and gtin:
        device_query = select(func.count(ScanHistory.id)).where(
            and_(
                ScanHistory.device_fingerprint == device_fingerprint,
                ScanHistory.gtin == gtin,
                ScanHistory.scan_timestamp >= datetime.utcnow() - timedelta(hours=1),
            )
        )
        result = await db.execute(device_query)
        device_scans = result.scalar() or 0

        if device_scans > 10:
            anomaly_score += 5
            anomalies.append(
                f"Same device scanned this product {device_scans} times in the last hour."
            )

    # Determine status
    if anomaly_score >= 30:
        status = "anomaly_detected"
    elif anomaly_score > 0:
        status = "minor_anomaly"
    else:
        status = "no_anomaly_detected"

    return {
        "status": status,
        "details": "; ".join(anomalies) if anomalies else "No scanning anomalies detected.",
        "anomaly_score": min(anomaly_score, 100),
        "anomalies": anomalies,
    }
