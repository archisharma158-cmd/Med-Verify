"""SQLAlchemy ORM models for MedVerify."""
from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import Optional

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database.session import Base


# ── Helper ──
def _uuid() -> uuid.UUID:
    return uuid.uuid4()


# ════════════════════════════════════════════
#  Users
# ════════════════════════════════════════════
class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    supabase_uid = Column(String(255), unique=True, nullable=True, index=True)
    name = Column(String(255), nullable=True)
    email = Column(String(255), nullable=True, index=True)
    phone = Column(String(20), nullable=True)
    preferred_language = Column(String(10), default="en")
    role = Column(String(20), default="user", nullable=False)  # user | admin
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    scans = relationship("ScanHistory", back_populates="user", lazy="selectin")
    reports = relationship("SuspiciousReport", back_populates="user", lazy="selectin")


# ════════════════════════════════════════════
#  Medicines
# ════════════════════════════════════════════
class Medicine(Base):
    __tablename__ = "medicines"

    id = Column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    name = Column(String(500), nullable=False, index=True)
    manufacturer = Column(String(500), nullable=True, index=True)
    gtin = Column(String(50), nullable=True, index=True)
    composition = Column(Text, nullable=True)
    strength = Column(String(100), nullable=True)
    dosage_form = Column(String(100), nullable=True)
    description = Column(Text, nullable=True)
    data_source = Column(String(100), nullable=True)  # e.g. "manual", "openfda", "cdsco"
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    batches = relationship("MedicineBatch", back_populates="medicine", lazy="selectin")

    __table_args__ = (
        Index("ix_medicines_name_manufacturer", "name", "manufacturer"),
    )


# ════════════════════════════════════════════
#  Medicine Batches
# ════════════════════════════════════════════
class MedicineBatch(Base):
    __tablename__ = "medicine_batches"

    id = Column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    medicine_id = Column(UUID(as_uuid=True), ForeignKey("medicines.id", ondelete="CASCADE"), nullable=False, index=True)
    batch_number = Column(String(100), nullable=False, index=True)
    manufacturing_date = Column(Date, nullable=True)
    expiry_date = Column(Date, nullable=True)
    verification_source = Column(String(100), nullable=True)
    manufacturer_confirmed = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    medicine = relationship("Medicine", back_populates="batches")

    __table_args__ = (
        UniqueConstraint("medicine_id", "batch_number", name="uq_medicine_batch"),
        Index("ix_batch_number", "batch_number"),
    )


# ════════════════════════════════════════════
#  Regulatory Alerts (CDSCO etc.)
# ════════════════════════════════════════════
class RegulatoryAlert(Base):
    __tablename__ = "regulatory_alerts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    product_name = Column(String(500), nullable=False, index=True)
    manufacturer = Column(String(500), nullable=True, index=True)
    batch_number = Column(String(100), nullable=True, index=True)
    alert_type = Column(String(100), nullable=True)  # not_of_standard_quality, spurious, misbranded
    reported_issue = Column(Text, nullable=True)
    regulatory_source = Column(String(100), default="CDSCO")
    publication_date = Column(Date, nullable=True)
    source_url = Column(Text, nullable=True)
    import_batch_id = Column(String(100), nullable=True)  # track which import added this
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index("ix_alert_product_batch", "product_name", "batch_number"),
    )


# ════════════════════════════════════════════
#  Scan History
# ════════════════════════════════════════════
class ScanHistory(Base):
    __tablename__ = "scan_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    medicine_name = Column(String(500), nullable=True)
    manufacturer = Column(String(500), nullable=True)
    batch_number = Column(String(100), nullable=True)
    gtin = Column(String(50), nullable=True)
    serial_number = Column(String(100), nullable=True)
    expiry_date = Column(Date, nullable=True)
    input_method = Column(String(50), nullable=False)  # qr, barcode, ocr, manual
    scan_timestamp = Column(DateTime(timezone=True), server_default=func.now())
    risk_score = Column(Float, nullable=True)
    risk_category = Column(String(20), nullable=True)
    verification_status = Column(String(50), nullable=True)
    explanation_en = Column(Text, nullable=True)
    explanation_hi = Column(Text, nullable=True)
    result_json = Column(Text, nullable=True)  # Full JSON result for re-display
    device_fingerprint = Column(String(64), nullable=True)  # SHA256 hash, privacy-safe
    location_lat = Column(Float, nullable=True)
    location_lng = Column(Float, nullable=True)
    location_consent = Column(Boolean, default=False)

    # Relationships
    user = relationship("User", back_populates="scans")

    __table_args__ = (
        Index("ix_scan_serial", "serial_number"),
        Index("ix_scan_gtin_batch", "gtin", "batch_number"),
        Index("ix_scan_timestamp", "scan_timestamp"),
    )


# ════════════════════════════════════════════
#  Suspicious Reports
# ════════════════════════════════════════════
class SuspiciousReport(Base):
    __tablename__ = "suspicious_reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    scan_id = Column(UUID(as_uuid=True), ForeignKey("scan_history.id", ondelete="SET NULL"), nullable=True)
    medicine_name = Column(String(500), nullable=True)
    manufacturer = Column(String(500), nullable=True)
    batch_number = Column(String(100), nullable=True)
    reason = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    image_paths = Column(Text, nullable=True)  # JSON list of storage paths
    contact_info = Column(String(255), nullable=True)
    status = Column(String(30), default="submitted")  # submitted, under_review, resolved, referred
    admin_notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="reports")

    __table_args__ = (
        Index("ix_report_status", "status"),
    )


# ════════════════════════════════════════════
#  Reference Packaging Images
# ════════════════════════════════════════════
class ReferencePackaging(Base):
    __tablename__ = "reference_packaging"

    id = Column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    medicine_id = Column(UUID(as_uuid=True), ForeignKey("medicines.id", ondelete="CASCADE"), nullable=False, index=True)
    image_source = Column(String(100), nullable=True)  # manufacturer, verified_pharmacy
    storage_path = Column(Text, nullable=False)
    description = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


# ════════════════════════════════════════════
#  Audit Events
# ════════════════════════════════════════════
class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    user_id = Column(UUID(as_uuid=True), nullable=True)
    action = Column(String(100), nullable=False)  # e.g. "alert_import", "report_status_change"
    resource_type = Column(String(50), nullable=True)
    resource_id = Column(String(100), nullable=True)
    details = Column(Text, nullable=True)
    ip_address = Column(String(45), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index("ix_audit_action", "action"),
        Index("ix_audit_timestamp", "created_at"),
    )


# ════════════════════════════════════════════
#  Notification Events
# ════════════════════════════════════════════
class NotificationEvent(Base):
    __tablename__ = "notification_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    event_type = Column(String(50), nullable=False)  # alert_match, report_update
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
