"""Comprehensive ML Pipeline & Model Integration Tests."""
import os
import json
import joblib
import numpy as np
import pytest
from httpx import AsyncClient

from ml.inference import get_predictor, MedicineRiskPredictor
from app.services.risk_service import MLRiskEngine, RuleBasedRiskEngine, get_risk_engine

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, "ml", "artifacts", "medicine_risk_model.pkl")
SCALER_PATH = os.path.join(BASE_DIR, "ml", "artifacts", "scaler.pkl")
ENCODER_PATH = os.path.join(BASE_DIR, "ml", "artifacts", "encoder.pkl")
FEATURE_COLUMNS_PATH = os.path.join(BASE_DIR, "ml", "artifacts", "feature_columns.json")
METADATA_PATH = os.path.join(BASE_DIR, "ml", "artifacts", "model_metadata.json")


def test_artifacts_exist():
    """Verify all 5 ML artifacts are exported and non-empty."""
    assert os.path.exists(MODEL_PATH)
    assert os.path.getsize(MODEL_PATH) > 1000
    assert os.path.exists(SCALER_PATH)
    assert os.path.exists(ENCODER_PATH)
    assert os.path.exists(FEATURE_COLUMNS_PATH)
    assert os.path.exists(METADATA_PATH)


def test_metadata_schema():
    """Verify model metadata structure and contents."""
    with open(METADATA_PATH, "r", encoding="utf-8") as f:
        meta = json.load(f)
    assert meta["model_version"] == "ml-v1"
    assert meta["algorithm"] == "RandomForestClassifier"
    assert meta["feature_count"] == 18
    assert "evaluation_metrics" in meta
    assert meta["evaluation_metrics"]["test_accuracy"] >= 0.90


def test_predictor_standalone_clean_load():
    """Verify standalone inference engine loads and executes."""
    predictor = get_predictor()
    assert predictor.model_version == "ml-v1"
    assert len(predictor.feature_columns) == 18


def test_predictor_handles_missing_and_nan():
    """Verify predictor sanitizes None, NaN, and missing dictionary keys."""
    predictor = get_predictor()
    messy_features = {
        "is_expired": None,
        "duplicate_score": float("nan"),
        "unknown_extra_field": "ignore_me"
    }
    pred = predictor.predict_risk(messy_features)
    assert "score" in pred
    assert "category" in pred
    assert 0.0 <= pred["score"] <= 100.0
    assert pred["method"] == "ml_model"


def test_predictor_feature_order_consistency():
    """Verify features match the trained column order."""
    predictor = get_predictor()
    with open(FEATURE_COLUMNS_PATH, "r", encoding="utf-8") as f:
        expected_cols = json.load(f)
    assert predictor.feature_columns == expected_cols


def test_ml_risk_engine_matches_fastapi_contract():
    """Verify MLRiskEngine produces the expected frontend dictionary structure."""
    engine = get_risk_engine()
    pred = engine.predict({
        "manufacturer_confirmed": 1.0,
        "is_expired": 0.0,
        "is_near_expiry": 0.0
    })
    assert "score" in pred
    assert "category" in pred
    assert pred["category"] in ("low", "medium", "high")
    assert pred["method"] == "ml_model"
    assert pred["model_version"] == "ml-v1"
    assert pred["validated_probability"] is False
    assert isinstance(pred["contributing_factors"], list)


@pytest.mark.asyncio
async def test_api_verify_with_ml_model(client: AsyncClient, seed_data):
    """End-to-end FastAPI test: POST /api/verify should return ml_model risk results."""
    payload = {
        "medicine_name": "Dolo 650",
        "manufacturer": "Micro Labs Ltd",
        "batch_number": "DL24089",
        "expiry_date": "2027-02-28",
        "input_method": "qr",
    }
    response = await client.post("/api/verify", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["risk"]["method"] == "ml_model"
    assert data["risk"]["model_version"] == "ml-v1"
    assert data["risk"]["category"] == "low"
    assert data["risk"]["score"] <= 25.0
    assert data["verification_status"] == "checks_completed"
