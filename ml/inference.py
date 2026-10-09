"""
ml/inference.py
---------------
Standalone, production-grade inference engine for the Medicine Risk Assessment Model.

Usage:
    from ml.inference import get_predictor
    predictor = get_predictor()
    result = predictor.predict_risk(features)
"""
from __future__ import annotations

import os
import json
import logging
from typing import Any, Dict, List, Optional
import numpy as np
import joblib

logger = logging.getLogger("ml_inference")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ARTIFACTS_DIR = os.path.join(BASE_DIR, "artifacts")
MODEL_PATH = os.path.join(ARTIFACTS_DIR, "medicine_risk_model.pkl")
FEATURE_COLUMNS_PATH = os.path.join(ARTIFACTS_DIR, "feature_columns.json")
METADATA_PATH = os.path.join(ARTIFACTS_DIR, "model_metadata.json")


class MedicineRiskPredictor:
    """Loads and executes the trained medicine risk prediction model."""

    def __init__(self, model_path: Optional[str] = None):
        self.model_path = model_path or MODEL_PATH
        self._model = None
        self._feature_columns: List[str] = []
        self._metadata: Dict[str, Any] = {}
        self._load_artifacts()

    def _load_artifacts(self) -> None:
        if not os.path.exists(self.model_path):
            raise FileNotFoundError(f"Model artifact not found at {self.model_path}")

        self._model = joblib.load(self.model_path)
        logger.info(f"Loaded ML model from {self.model_path}")

        if os.path.exists(FEATURE_COLUMNS_PATH):
            with open(FEATURE_COLUMNS_PATH, "r", encoding="utf-8") as f:
                self._feature_columns = json.load(f)
        else:
            self._feature_columns = [
                "is_expired", "is_near_expiry", "expiry_unknown",
                "manufacturer_confirmed", "manufacturer_name_only",
                "manufacturer_mismatch", "manufacturer_no_data",
                "has_strong_alert", "has_partial_alert", "alert_count",
                "duplicate_anomaly", "duplicate_minor", "duplicate_score",
                "packaging_mismatch", "packaging_damage",
                "missing_medicine_name", "missing_batch", "missing_expiry",
            ]

        if os.path.exists(METADATA_PATH):
            with open(METADATA_PATH, "r", encoding="utf-8") as f:
                self._metadata = json.load(f)

    @property
    def model_version(self) -> str:
        return self._metadata.get("model_version", "ml-v1")

    @property
    def feature_columns(self) -> List[str]:
        return list(self._feature_columns)

    def prepare_feature_array(self, features: Dict[str, Any]) -> np.ndarray:
        """Convert input feature dict to strictly ordered, sanitized 2D numpy array."""
        values = []
        for col in self._feature_columns:
            val = features.get(col, 0.0)
            try:
                val = float(val) if val is not None else 0.0
                if np.isnan(val) or np.isinf(val):
                    val = 0.0
            except (ValueError, TypeError):
                val = 0.0
            values.append(val)
        return np.array([values], dtype=np.float64)

    def predict_risk(self, features: Dict[str, Any]) -> Dict[str, Any]:
        """Generate risk score and category from feature inputs.
        
        Deterministic medical safety rules act as an independent guardrail
        (e.g., actual expired medicine or official CDSCO recall cannot score as safe).
        """
        X = self.prepare_feature_array(features)
        import pandas as pd
        X_df = pd.DataFrame(X, columns=self._feature_columns)
        proba = self._model.predict_proba(X_df)[0] # [P(low), P(medium), P(high)]
        
        # Expected continuous risk score from class probabilities
        # low baseline ~10, medium ~42, high ~82
        p_low = float(proba[0])
        p_med = float(proba[1]) if len(proba) > 1 else 0.0
        p_high = float(proba[2]) if len(proba) > 2 else float(proba[1])
        
        calculated_score = (p_low * 10.0) + (p_med * 42.0) + (p_high * 82.0)
        
        contributing_factors: List[str] = []
        if features.get("is_expired"):
            contributing_factors.append("expired")
            calculated_score = max(calculated_score, 65.0)
        if features.get("is_near_expiry"):
            contributing_factors.append("near_expiry")
        if features.get("has_strong_alert"):
            contributing_factors.append("regulatory_alert_strong")
            calculated_score = max(calculated_score, 70.0)
        elif features.get("has_partial_alert"):
            contributing_factors.append("regulatory_alert_partial")
        if features.get("manufacturer_mismatch"):
            contributing_factors.append("manufacturer_mismatch")
            calculated_score = max(calculated_score, 62.0)
        elif features.get("manufacturer_no_data"):
            contributing_factors.append("manufacturer_no_data")
        if features.get("duplicate_anomaly"):
            contributing_factors.append("duplicate_anomaly")
            calculated_score = max(calculated_score, 65.0)
        elif features.get("duplicate_minor"):
            contributing_factors.append("duplicate_minor")
        if features.get("packaging_mismatch"):
            contributing_factors.append("packaging_mismatch")
        if features.get("packaging_damage"):
            contributing_factors.append("packaging_damage")
            
        uncertainty = sum(1 for k in ["missing_medicine_name", "missing_batch", "missing_expiry"] if features.get(k))
        if uncertainty > 0:
            contributing_factors.append("data_uncertainty")

        # Clamp score to [0.0, 100.0]
        final_score = max(0.0, min(100.0, calculated_score))

        # Assign category
        if final_score <= 25.0:
            category = "low"
        elif final_score <= 60.0:
            category = "medium"
        else:
            category = "high"

        return {
            "score": round(final_score, 1),
            "category": category,
            "contributing_factors": contributing_factors,
            "method": "ml_model",
            "model_version": self.model_version,
            "validated_probability": False,
            "probabilities": {
                "low": round(p_low, 4),
                "medium": round(p_med, 4),
                "high": round(p_high, 4),
            }
        }

# Global singleton
_predictor_instance: Optional[MedicineRiskPredictor] = None

def get_predictor() -> MedicineRiskPredictor:
    global _predictor_instance
    if _predictor_instance is None:
        _predictor_instance = MedicineRiskPredictor()
    return _predictor_instance

