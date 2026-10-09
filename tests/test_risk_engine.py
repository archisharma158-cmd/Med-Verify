"""Unit tests for the Risk Scoring Engine."""
from __future__ import annotations

import pytest

from app.services.risk_service import RuleBasedRiskEngine, get_risk_engine


def test_rule_based_engine_singleton():
    """Verify risk engine initialization and interface."""
    engine = get_risk_engine()
    assert isinstance(engine, RuleBasedRiskEngine)
    assert engine.method == "rule_based"
    assert engine.model_version == "rules-v1"


def test_low_risk_medicine():
    """Medicine with verified manufacturer and valid expiry should be low risk."""
    engine = get_risk_engine()
    verification_data = {
        "medicine_name": "Dolo 650",
        "batch_number": "DL24089",
        "expiry_date": "2027-02-28",
        "checks": {
            "expiry": "not_expired",
            "manufacturer": "confirmed_match",
            "regulatory_alert": "no_match_in_imported_data",
            "duplicate_scan": "no_anomaly_detected",
            "packaging": "not_checked",
        },
        "alert_data": {"alerts": []},
        "duplicate_data": {"status": "no_anomaly_detected", "anomaly_score": 0},
    }

    features = engine.extract_features(verification_data)
    prediction = engine.predict(features)
    explanation = engine.explain(features, prediction)

    assert prediction["category"] == "low"
    assert prediction["score"] <= 25.0
    assert not prediction["validated_probability"]
    assert "explanation" in explanation
    assert "en" in explanation["explanation"]
    assert "hi" in explanation["explanation"]


def test_high_risk_expired_and_alert_medicine():
    """Medicine that is both expired and has a strong regulatory alert must be high risk."""
    engine = get_risk_engine()
    verification_data = {
        "medicine_name": "Pan 40",
        "batch_number": "PN23999",
        "expiry_date": "2023-01-01",
        "checks": {
            "expiry": "expired",
            "manufacturer": "mismatch",
            "regulatory_alert": "alert_match",
            "duplicate_scan": "no_anomaly_detected",
            "packaging": "not_checked",
        },
        "alert_data": {
            "alerts": [
                {
                    "alert_id": "test-alert",
                    "match_strength": "strong",
                    "reported_issue": "Substandard dissolution",
                }
            ]
        },
        "duplicate_data": {"status": "no_anomaly_detected", "anomaly_score": 0},
    }

    features = engine.extract_features(verification_data)
    prediction = engine.predict(features)
    explanation = engine.explain(features, prediction)

    assert prediction["category"] == "high"
    assert prediction["score"] >= 61.0
    assert "expired" in prediction["contributing_factors"]
    assert "regulatory_alert_strong" in prediction["contributing_factors"]
    assert len(explanation["warnings"]) > 0


def test_insufficient_data_screening_disclaimer():
    """Medicine with missing data should produce uncertainty penalty, never genuine claim."""
    engine = get_risk_engine()
    verification_data = {
        "medicine_name": None,
        "batch_number": None,
        "expiry_date": None,
        "checks": {
            "expiry": "unknown",
            "manufacturer": "insufficient_data",
            "regulatory_alert": "insufficient_data",
            "duplicate_scan": "insufficient_data",
            "packaging": "not_checked",
        },
        "alert_data": {"alerts": []},
        "duplicate_data": {"status": "insufficient_data"},
    }

    features = engine.extract_features(verification_data)
    prediction = engine.predict(features)
    explanation = engine.explain(features, prediction)

    # Uncertainty should add points and flag missing data
    assert "data_uncertainty" in prediction["contributing_factors"]
    # Explanations should contain Hindi and English text
    assert "explanation" in explanation
    assert len(explanation["explanation"]["en"]) > 0
    assert len(explanation["explanation"]["hi"]) > 0
