"""
Risk Scoring Engine – Modular, replaceable scoring system.

IMPORTANT: The current implementation uses a configurable rule-based heuristic.
These scores are prototype indicators, NOT scientifically validated medical 
safety probabilities. The interface is designed for future ML model integration.
"""
from __future__ import annotations

import os
from abc import ABC, abstractmethod
from typing import Any, Optional

from app.core.config import get_settings
from app.core.logging import get_logger

logger = get_logger("risk_service")


# ══════════════════════════════════════════════════
#  Abstract Interface (for ML model swapability)
# ══════════════════════════════════════════════════

class RiskScoringEngine(ABC):
    """Abstract base class for risk scoring engines.
    
    Implement this interface with trained ML models:
    - .joblib
    - .pkl
    - .onnx
    - PyTorch/TensorFlow models
    
    Feature schema version must be tracked for compatibility.
    """

    FEATURE_SCHEMA_VERSION = "1.0"

    @abstractmethod
    def extract_features(self, verification_data: dict) -> dict:
        """Extract a feature vector from verification data."""
        ...

    @abstractmethod
    def predict(self, features: dict) -> dict:
        """Generate risk prediction from features."""
        ...

    @abstractmethod
    def explain(self, features: dict, prediction: dict) -> dict:
        """Generate human-readable explanation of the prediction."""
        ...

    @property
    @abstractmethod
    def model_version(self) -> str:
        ...

    @property
    @abstractmethod
    def method(self) -> str:
        """Return 'rule_based' or 'ml_model'."""
        ...


# ══════════════════════════════════════════════════
#  Rule-Based Scoring (Default / Fallback)
# ══════════════════════════════════════════════════

class RuleBasedRiskEngine(RiskScoringEngine):
    """Configurable rule-based demonstration scoring system.
    
    Risk categories:
    - 0-25: Low concern
    - 26-60: Medium concern  
    - 61-100: High concern
    
    These categories are prototype heuristics for screening purposes.
    """

    # Configurable weights (can be tuned)
    WEIGHTS = {
        "expired": 35,
        "near_expiry": 10,
        "regulatory_alert_strong": 40,
        "regulatory_alert_partial": 20,
        "manufacturer_mismatch": 15,
        "manufacturer_no_data": 5,
        "batch_anomaly": 10,
        "duplicate_anomaly": 15,
        "duplicate_minor": 5,
        "packaging_mismatch": 10,
        "packaging_damage": 5,
        "data_uncertainty": 3,
    }

    @property
    def model_version(self) -> str:
        return "rules-v1"

    @property
    def method(self) -> str:
        return "rule_based"

    def extract_features(self, verification_data: dict) -> dict:
        """Extract boolean/numeric features from verification results."""
        checks = verification_data.get("checks", {})
        alert_data = verification_data.get("alert_data", {})
        duplicate_data = verification_data.get("duplicate_data", {})

        features = {
            "schema_version": self.FEATURE_SCHEMA_VERSION,
            # Expiry features
            "is_expired": checks.get("expiry") == "expired",
            "is_near_expiry": checks.get("expiry") == "near_expiry",
            "expiry_unknown": checks.get("expiry") == "unknown",
            # Manufacturer features
            "manufacturer_confirmed": checks.get("manufacturer") == "confirmed_match",
            "manufacturer_name_only": checks.get("manufacturer") == "name_only_match",
            "manufacturer_mismatch": checks.get("manufacturer") == "mismatch",
            "manufacturer_no_data": checks.get("manufacturer") == "insufficient_data",
            # Regulatory alert features
            "has_strong_alert": any(
                a.get("match_strength") == "strong"
                for a in alert_data.get("alerts", [])
            ),
            "has_partial_alert": any(
                a.get("match_strength") == "partial"
                for a in alert_data.get("alerts", [])
            ),
            "alert_count": len(alert_data.get("alerts", [])),
            # Duplicate features
            "duplicate_anomaly": duplicate_data.get("status") == "anomaly_detected",
            "duplicate_minor": duplicate_data.get("status") == "minor_anomaly",
            "duplicate_score": duplicate_data.get("anomaly_score", 0),
            # Packaging features
            "packaging_mismatch": checks.get("packaging") == "mismatch",
            "packaging_damage": len(verification_data.get("packaging_data", {}).get("damage_indicators", [])) > 0,
            # Data quality
            "missing_medicine_name": not verification_data.get("medicine_name"),
            "missing_batch": not verification_data.get("batch_number"),
            "missing_expiry": not verification_data.get("expiry_date"),
        }

        return features

    def predict(self, features: dict) -> dict:
        """Calculate rule-based risk score."""
        score = 0.0
        contributing_factors: list[str] = []

        if features.get("is_expired"):
            score += self.WEIGHTS["expired"]
            contributing_factors.append("expired")

        if features.get("is_near_expiry"):
            score += self.WEIGHTS["near_expiry"]
            contributing_factors.append("near_expiry")

        if features.get("has_strong_alert"):
            score += self.WEIGHTS["regulatory_alert_strong"]
            contributing_factors.append("regulatory_alert_strong")
        elif features.get("has_partial_alert"):
            score += self.WEIGHTS["regulatory_alert_partial"]
            contributing_factors.append("regulatory_alert_partial")

        if features.get("manufacturer_mismatch"):
            score += self.WEIGHTS["manufacturer_mismatch"]
            contributing_factors.append("manufacturer_mismatch")
        elif features.get("manufacturer_no_data"):
            score += self.WEIGHTS["manufacturer_no_data"]
            contributing_factors.append("manufacturer_no_data")

        if features.get("duplicate_anomaly"):
            score += self.WEIGHTS["duplicate_anomaly"]
            contributing_factors.append("duplicate_anomaly")
        elif features.get("duplicate_minor"):
            score += self.WEIGHTS["duplicate_minor"]
            contributing_factors.append("duplicate_minor")

        if features.get("packaging_mismatch"):
            score += self.WEIGHTS["packaging_mismatch"]
            contributing_factors.append("packaging_mismatch")
        elif features.get("packaging_damage"):
            score += self.WEIGHTS["packaging_damage"]
            contributing_factors.append("packaging_damage")

        # Data uncertainty penalty (small)
        uncertainty_count = sum(1 for k in ["missing_medicine_name", "missing_batch", "missing_expiry"]
                                if features.get(k))
        if uncertainty_count > 0:
            score += self.WEIGHTS["data_uncertainty"] * uncertainty_count
            contributing_factors.append("data_uncertainty")

        # Clamp to 0-100
        score = max(0.0, min(100.0, score))

        # Determine category
        if score <= 25:
            category = "low"
        elif score <= 60:
            category = "medium"
        else:
            category = "high"

        return {
            "score": round(score, 1),
            "category": category,
            "contributing_factors": contributing_factors,
            "method": self.method,
            "model_version": self.model_version,
            "validated_probability": False,
        }

    def explain(self, features: dict, prediction: dict) -> dict:
        """Generate human-readable explanations in English and Hindi."""
        factors = prediction.get("contributing_factors", [])
        score = prediction.get("score", 0)
        category = prediction.get("category", "low")

        explanations_en = []
        explanations_hi = []
        warnings = []
        next_steps = []

        if "expired" in factors:
            explanations_en.append("This medicine appears to be past its expiry date.")
            explanations_hi.append("यह दवाई एक्सपायर हो चुकी प्रतीत होती है।")
            warnings.append("EXPIRED: Do not use expired medicines. Consult a pharmacist.")
            next_steps.append("Dispose of expired medicine safely and get a fresh prescription.")

        if "near_expiry" in factors:
            explanations_en.append("This medicine is near its expiry date.")
            explanations_hi.append("इस दवाई की एक्सपायरी डेट नजदीक है।")
            next_steps.append("Use before expiry date; check with pharmacist if concerned.")

        if "regulatory_alert_strong" in factors:
            explanations_en.append("A regulatory alert closely matches this medicine.")
            explanations_hi.append("इस दवाई से मेल खाती एक नियामक चेतावनी मिली है।")
            warnings.append("REGULATORY ALERT: This product matches a published regulatory alert. Do not use without pharmacist confirmation.")
            next_steps.append("Show this alert to your pharmacist immediately.")

        if "regulatory_alert_partial" in factors:
            explanations_en.append("A regulatory alert partially matches this medicine's details.")
            explanations_hi.append("इस दवाई के विवरण से आंशिक रूप से मेल खाती चेतावनी है।")
            next_steps.append("Verify with pharmacist if this alert applies to your specific product.")

        if "manufacturer_mismatch" in factors:
            explanations_en.append("The manufacturer information does not match our records.")
            explanations_hi.append("निर्माता की जानकारी हमारे रिकॉर्ड से मेल नहीं खाती।")
            warnings.append("Manufacturer details differ from database records.")

        if "manufacturer_no_data" in factors:
            explanations_en.append("Manufacturer authenticity could not be confirmed.")
            explanations_hi.append("निर्माता की प्रामाणिकता की पुष्टि नहीं हो सकी।")

        if "duplicate_anomaly" in factors:
            explanations_en.append("Unusual scanning patterns detected for this product's serial number.")
            explanations_hi.append("इस उत्पाद के सीरियल नंबर के लिए असामान्य स्कैनिंग पैटर्न पाए गए।")
            warnings.append("This serial number has been scanned from multiple devices.")

        if "packaging_damage" in factors:
            explanations_en.append("Potential packaging irregularities were detected.")
            explanations_hi.append("पैकेजिंग में संभावित अनियमितताएं पाई गईं।")

        if "data_uncertainty" in factors:
            explanations_en.append("Some information could not be verified due to missing data.")
            explanations_hi.append("कुछ जानकारी की पुष्टि नहीं हो सकी।")

        if not explanations_en:
            explanations_en.append("No significant concerns identified in the available checks.")
            explanations_hi.append("उपलब्ध जांच में कोई महत्वपूर्ण चिंता नहीं मिली।")

        if not next_steps:
            next_steps.append("Consult a pharmacist if you have any concerns about this medicine.")

        return {
            "explanation": {
                "en": " ".join(explanations_en),
                "hi": " ".join(explanations_hi),
            },
            "warnings": warnings,
            "next_steps": next_steps,
        }


# ══════════════════════════════════════════════════
#  ML Model Loader (Future Integration)
# ══════════════════════════════════════════════════

class MLRiskEngine(RiskScoringEngine):
    """ML-based risk engine that loads trained models.
    
    Supports:
    - .joblib / .pkl files (scikit-learn Pipelines, Random Forest, Gradient Boosting)
    - .onnx files (ONNX Runtime)
    """

    def __init__(self, model_path: str, model_version: str = "ml-v1"):
        self._model_path = model_path
        self._model_version = model_version
        self._model = None
        self._feature_keys = [
            "is_expired", "is_near_expiry", "expiry_unknown",
            "manufacturer_confirmed", "manufacturer_name_only",
            "manufacturer_mismatch", "manufacturer_no_data",
            "has_strong_alert", "has_partial_alert", "alert_count",
            "duplicate_anomaly", "duplicate_minor", "duplicate_score",
            "packaging_mismatch", "packaging_damage",
            "missing_medicine_name", "missing_batch", "missing_expiry",
        ]
        self._load_model()

    def _load_model(self):
        """Load model from trusted artifact path."""
        if not os.path.exists(self._model_path):
            raise FileNotFoundError(f"Model file not found: {self._model_path}")

        ext = os.path.splitext(self._model_path)[1].lower()

        if ext in (".joblib", ".pkl"):
            import joblib
            try:
                self._model = joblib.load(self._model_path)
            except Exception:
                import pickle
                with open(self._model_path, "rb") as f:
                    self._model = pickle.load(f)
        elif ext == ".onnx":
            import onnxruntime as ort
            self._model = ort.InferenceSession(self._model_path)
        else:
            raise ValueError(f"Unsupported model format: {ext}")

        logger.info("ml_model_loaded", path=self._model_path, version=self._model_version)

    @property
    def model_version(self) -> str:
        return self._model_version

    @property
    def method(self) -> str:
        return "ml_model"

    def extract_features(self, verification_data: dict) -> dict:
        """Extract features in the same schema as rule-based engine."""
        rule_engine = RuleBasedRiskEngine()
        return rule_engine.extract_features(verification_data)

    def predict(self, features: dict) -> dict:
        """Run ML model prediction with safety guardrails and fallback."""
        import numpy as np
        import pandas as pd

        feature_df = pd.DataFrame([{
            k: float(features.get(k, 0.0) or 0.0) for k in self._feature_keys
        }])[self._feature_keys]

        ext = os.path.splitext(self._model_path)[1].lower()

        if ext == ".onnx":
            input_name = self._model.get_inputs()[0].name
            result = self._model.run(None, {input_name: feature_df.values.astype(np.float32)})
            calculated_score = float(result[0][0]) * 100
        else:
            if hasattr(self._model, "predict_proba"):
                proba = self._model.predict_proba(feature_df)[0]
                if len(proba) == 3:
                    calculated_score = float(proba[0] * 10.0 + proba[1] * 42.0 + proba[2] * 82.0)
                else:
                    calculated_score = float(proba[1]) * 100
            else:
                pred = self._model.predict(feature_df)
                calculated_score = float(pred[0]) * 100

        # Independent deterministic safety guardrails (expiry, official CDSCO alerts)
        contributing_factors: list[str] = []
        if features.get("is_expired"):
            calculated_score = max(calculated_score, 65.0)
            contributing_factors.append("expired")
        if features.get("is_near_expiry"):
            contributing_factors.append("near_expiry")
        if features.get("has_strong_alert"):
            calculated_score = max(calculated_score, 70.0)
            contributing_factors.append("regulatory_alert_strong")
        elif features.get("has_partial_alert"):
            contributing_factors.append("regulatory_alert_partial")
        if features.get("manufacturer_mismatch"):
            calculated_score = max(calculated_score, 62.0)
            contributing_factors.append("manufacturer_mismatch")
        elif features.get("manufacturer_no_data"):
            contributing_factors.append("manufacturer_no_data")
        if features.get("duplicate_anomaly"):
            calculated_score = max(calculated_score, 65.0)
            contributing_factors.append("duplicate_anomaly")
        elif features.get("duplicate_minor"):
            contributing_factors.append("duplicate_minor")
        if features.get("packaging_mismatch"):
            contributing_factors.append("packaging_mismatch")
        if features.get("packaging_damage"):
            contributing_factors.append("packaging_damage")

        uncertainty_count = sum(1 for k in ["missing_medicine_name", "missing_batch", "missing_expiry"] if features.get(k))
        if uncertainty_count > 0:
            contributing_factors.append("data_uncertainty")

        # Clamp to 0-100
        score = max(0.0, min(100.0, calculated_score))

        if score <= 25.0:
            category = "low"
        elif score <= 60.0:
            category = "medium"
        else:
            category = "high"

        return {
            "score": round(score, 1),
            "category": category,
            "contributing_factors": contributing_factors,
            "method": self.method,
            "model_version": self.model_version,
            "validated_probability": False,
        }

    def explain(self, features: dict, prediction: dict) -> dict:
        """Provide human-readable explanations in English and Hindi."""
        rule_engine = RuleBasedRiskEngine()
        return rule_engine.explain(features, prediction)


# ── Engine Factory ──────────────────────────────────────────────────────────

_cached_engine: Optional[RiskScoringEngine] = None


def get_risk_engine(force_refresh: bool = False, force_rule_based: bool = False) -> RiskScoringEngine:
    """Get the appropriate risk scoring engine.
    
    Caches the ML model in memory at startup. Falls back to rule-based engine on error.
    """
    global _cached_engine
    if not force_refresh and not force_rule_based and _cached_engine is not None:
        return _cached_engine

    if force_rule_based:
        return RuleBasedRiskEngine()

    settings = get_settings()
    model_path = settings.RISK_MODEL_PATH

    if model_path:
        # Resolve relative path to project root
        if not os.path.isabs(model_path):
            project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            candidate = os.path.join(project_root, model_path)
            if os.path.exists(candidate):
                model_path = candidate

        if os.path.exists(model_path):
            try:
                engine = MLRiskEngine(
                    model_path=model_path,
                    model_version=settings.RISK_MODEL_VERSION or "ml-v1",
                )
                _cached_engine = engine
                return engine
            except Exception as e:
                logger.error("ml_model_load_failed", error=str(e))
                logger.info("falling_back_to_rule_based")

    return RuleBasedRiskEngine()
