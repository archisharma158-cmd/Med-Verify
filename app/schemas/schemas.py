"""Pydantic v2 schemas for MedVerify API request/response contracts."""
from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


# ══════════════════════════════════════════════════
#  Common / Base
# ══════════════════════════════════════════════════

class HealthResponse(BaseModel):
    status: str = "healthy"
    version: str
    services: dict[str, str] = {}


class PaginatedResponse(BaseModel):
    items: list[Any]
    total: int
    page: int
    page_size: int
    has_next: bool


# ══════════════════════════════════════════════════
#  User
# ══════════════════════════════════════════════════

class UserCreate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    preferred_language: str = "en"


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    name: Optional[str]
    email: Optional[str]
    preferred_language: str
    role: str
    created_at: datetime


class UserUpdate(BaseModel):
    name: Optional[str] = None
    preferred_language: Optional[str] = None


# ══════════════════════════════════════════════════
#  Medicine
# ══════════════════════════════════════════════════

class MedicineCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=500)
    manufacturer: Optional[str] = Field(None, max_length=500)
    gtin: Optional[str] = Field(None, max_length=50)
    composition: Optional[str] = None
    strength: Optional[str] = Field(None, max_length=100)
    dosage_form: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    data_source: str = "manual"


class MedicineUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=500)
    manufacturer: Optional[str] = Field(None, max_length=500)
    gtin: Optional[str] = Field(None, max_length=50)
    composition: Optional[str] = None
    strength: Optional[str] = Field(None, max_length=100)
    dosage_form: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    data_source: Optional[str] = None


class MedicineResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    name: str
    manufacturer: Optional[str]
    gtin: Optional[str]
    composition: Optional[str]
    strength: Optional[str]
    dosage_form: Optional[str]
    description: Optional[str]
    data_source: Optional[str]
    is_verified: bool
    created_at: datetime


class MedicineBatchResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    medicine_id: uuid.UUID
    batch_number: str
    manufacturing_date: Optional[date]
    expiry_date: Optional[date]
    verification_source: Optional[str]
    manufacturer_confirmed: bool


# ══════════════════════════════════════════════════
#  Barcode / QR
# ══════════════════════════════════════════════════

class BarcodeDecodeResponse(BaseModel):
    raw_payload: Optional[str] = None
    barcode_type: Optional[str] = None
    gtin: Optional[str] = None
    batch_number: Optional[str] = None
    expiry_date: Optional[str] = None
    serial_number: Optional[str] = None
    product_identifier: Optional[str] = None
    parsed_fields: dict[str, Any] = {}
    notes: list[str] = []
    success: bool = True


# ══════════════════════════════════════════════════
#  OCR
# ══════════════════════════════════════════════════

class OCRField(BaseModel):
    value: Optional[str] = None
    confidence: Optional[str] = "unknown"  # high, medium, low, unknown
    requires_confirmation: bool = False


class OCRResponse(BaseModel):
    raw_text: str = ""
    medicine_name: OCRField = OCRField()
    manufacturer: OCRField = OCRField()
    batch_number: OCRField = OCRField()
    manufacturing_date: OCRField = OCRField()
    expiry_date: OCRField = OCRField()
    serial_number: OCRField = OCRField()
    strength: OCRField = OCRField()
    dosage_form: OCRField = OCRField()
    success: bool = True
    notes: list[str] = []


# ══════════════════════════════════════════════════
#  Verification
# ══════════════════════════════════════════════════

class VerifyRequest(BaseModel):
    """Input to the verification engine."""
    medicine_name: Optional[str] = None
    manufacturer: Optional[str] = None
    batch_number: Optional[str] = None
    gtin: Optional[str] = None
    serial_number: Optional[str] = None
    expiry_date: Optional[str] = None  # ISO date string or "MM/YYYY" etc.
    manufacturing_date: Optional[str] = None
    strength: Optional[str] = None
    dosage_form: Optional[str] = None
    composition: Optional[str] = None
    input_method: str = "manual"  # qr, barcode, ocr, manual
    device_fingerprint: Optional[str] = None
    location_lat: Optional[float] = None
    location_lng: Optional[float] = None
    location_consent: bool = False
    packaging_image_url: Optional[str] = None

    @field_validator("input_method")
    @classmethod
    def validate_input_method(cls, v: str) -> str:
        allowed = {"qr", "barcode", "ocr", "manual"}
        if v not in allowed:
            raise ValueError(f"input_method must be one of {allowed}")
        return v


class RiskResult(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    score: float
    category: str  # low, medium, high
    method: str  # rule_based, ml_model
    model_version: str
    validated_probability: bool = False


class CheckResults(BaseModel):
    expiry: str  # expired, near_expiry, not_expired, unknown
    manufacturer: str  # confirmed_match, name_only_match, mismatch, insufficient_data
    regulatory_alert: str  # alert_match, no_match_in_imported_data, insufficient_data
    duplicate_scan: str  # anomaly_detected, no_anomaly_detected, insufficient_data
    packaging: str  # match, mismatch, not_checked, insufficient_reference


class ExplanationText(BaseModel):
    en: str
    hi: str


class VerifyResponse(BaseModel):
    scan_id: uuid.UUID
    verification_status: str  # checks_completed, insufficient_data, manual_review_recommended, regulatory_alert_match
    risk: RiskResult
    medicine: dict[str, Any]
    checks: CheckResults
    warnings: list[str] = []
    explanation: ExplanationText
    next_steps: list[str] = []
    data_sources: list[str] = []
    alert_data_freshness: Optional[str] = None


# ══════════════════════════════════════════════════
#  Reports
# ══════════════════════════════════════════════════

class ReportCreate(BaseModel):
    medicine_name: Optional[str] = None
    manufacturer: Optional[str] = None
    batch_number: Optional[str] = None
    reason: str = Field(..., max_length=100)
    description: Optional[str] = None
    contact_info: Optional[str] = None
    scan_id: Optional[uuid.UUID] = None

    @field_validator("reason")
    @classmethod
    def validate_reason(cls, v: str) -> str:
        allowed = {
            "suspicious_packaging",
            "expired_medicine",
            "mismatched_information",
            "repeated_serial_scan",
            "regulatory_alert_concern",
            "other",
        }
        if v not in allowed:
            raise ValueError(f"reason must be one of {allowed}")
        return v


class ReportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    medicine_name: Optional[str]
    manufacturer: Optional[str]
    batch_number: Optional[str]
    reason: str
    description: Optional[str]
    status: str
    created_at: datetime


class ReportStatusUpdate(BaseModel):
    status: str = Field(..., pattern=r"^(submitted|under_review|resolved|referred)$")
    admin_notes: Optional[str] = None


# ══════════════════════════════════════════════════
#  Scan History
# ══════════════════════════════════════════════════

class ScanHistoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    medicine_name: Optional[str]
    manufacturer: Optional[str]
    batch_number: Optional[str]
    input_method: str
    scan_timestamp: datetime
    risk_score: Optional[float]
    risk_category: Optional[str]
    verification_status: Optional[str]
    explanation_en: Optional[str]
    explanation_hi: Optional[str]


class ScanHistoryDetailResponse(ScanHistoryResponse):
    gtin: Optional[str]
    serial_number: Optional[str]
    expiry_date: Optional[date]
    result_json: Optional[str]


# ══════════════════════════════════════════════════
#  Chatbot
# ══════════════════════════════════════════════════

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    language: str = "en"  # en or hi
    scan_id: Optional[uuid.UUID] = None  # context from a specific scan


class ChatResponse(BaseModel):
    reply: str
    language: str
    sources: list[str] = []


class VoiceTranscribeResponse(BaseModel):
    text: str
    language: str
    confidence: Optional[float] = None


class SpeakResponse(BaseModel):
    audio_base64: str
    format: str = "wav"
    language: str


# ══════════════════════════════════════════════════
#  Admin
# ══════════════════════════════════════════════════

class DashboardStats(BaseModel):
    total_scans: int
    total_reports: int
    pending_reports: int
    high_risk_scans: int
    total_medicines: int
    total_alerts: int
    recent_scans_7d: int


class AlertImportResult(BaseModel):
    imported: int
    skipped: int
    errors: list[str] = []
    import_batch_id: str


class RegulatoryAlertResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    product_name: str
    manufacturer: Optional[str]
    batch_number: Optional[str]
    alert_type: Optional[str]
    reported_issue: Optional[str]
    regulatory_source: str
    publication_date: Optional[date]
    source_url: Optional[str]


class ScanTrend(BaseModel):
    date: str
    count: int
    high_risk_count: int


# ══════════════════════════════════════════════════
#  openFDA
# ══════════════════════════════════════════════════

class OpenFDASearchResult(BaseModel):
    brand_name: Optional[str] = None
    generic_name: Optional[str] = None
    manufacturer_name: Optional[str] = None
    active_ingredients: list[str] = []
    dosage_form: Optional[str] = None
    route: Optional[str] = None
    product_type: Optional[str] = None
    source: str = "openFDA"
    note: str = "openFDA provides US-centered drug information. This is supplementary and does not verify Indian medicine authenticity."
