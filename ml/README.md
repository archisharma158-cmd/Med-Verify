# Medify ML -- Medicine Risk Assessment Model

This directory contains the machine learning risk assessment pipeline for **Medify (Smart Medicine Verification System)**.

---

## 1. Overview & Architecture

- **Algorithm:** Calibrated Random Forest Classifier (`RandomForestClassifier`) wrapped in an end-to-end Scikit-Learn `Pipeline` with `StandardScaler`.
- **Model Version:** `ml-v1`
- **Model Artifact:** `ml/artifacts/medicine_risk_model.pkl`
- **Input Dimensions:** 18 structured verification features extracted from barcode, OCR, expiry, CDSCO regulatory records, duplicate scan logs, and packaging indicators.
- **Output:** Continuous calibrated Risk Score `[0.0 - 100.0]`, Risk Category (`low`, `medium`, `high`), class probabilities, and human-readable explanation factors.

---

## 2. Directory Structure

```
ml/
├── artifacts/
│   ├── medicine_risk_model.pkl    # Serialized scikit-learn Pipeline (scaler + model)
│   ├── scaler.pkl                 # Fitted StandardScaler for modular inference
│   ├── encoder.pkl                # Category mapping & score weights dictionary
│   ├── feature_columns.json       # Exact 18 feature schema in required order
│   └── model_metadata.json        # Complete metadata, metrics, and hyperparameters
├── inference.py                   # Production inference engine with safety guardrails
├── train_model.py                 # Reproducible training & evaluation script
├── train_data.csv                 # Verified training dataset
└── README.md                      # Documentation
```

---

## 3. Feature Schema (18 Features)

| # | Feature Name | Type | Description |
|---|---|---|---|
| 1 | `is_expired` | `float64` (0/1) | Whether current date is past medicine expiry date |
| 2 | `is_near_expiry` | `float64` (0/1) | Whether medicine expires within 90 days |
| 3 | `expiry_unknown` | `float64` (0/1) | Expiry date was missing or could not be parsed |
| 4 | `manufacturer_confirmed` | `float64` (0/1) | Confirmed match in licensed manufacturer registry |
| 5 | `manufacturer_name_only` | `float64` (0/1) | Partial match on manufacturer name |
| 6 | `manufacturer_mismatch` | `float64` (0/1) | Discrepancy between packaging & official registry |
| 7 | `manufacturer_no_data` | `float64` (0/1) | Manufacturer information not available |
| 8 | `has_strong_alert` | `float64` (0/1) | Exact match with CDSCO NSQ recall alert |
| 9 | `has_partial_alert` | `float64` (0/1) | Partial match with CDSCO NSQ advisory |
| 10 | `alert_count` | `float64` | Total number of regulatory alerts matched |
| 11 | `duplicate_anomaly` | `float64` (0/1) | Clone anomaly (same serial scanned in distant locations) |
| 12 | `duplicate_minor` | `float64` (0/1) | Low-severity duplicate scan anomaly |
| 13 | `duplicate_score` | `float64` [0-1] | Anomaly confidence score from scan history |
| 14 | `packaging_mismatch` | `float64` (0/1) | Visual discrepancy against standard packaging |
| 15 | `packaging_damage` | `float64` (0/1) | Damaged or tampered packaging indicators |
| 16 | `missing_medicine_name`| `float64` (0/1) | Medicine name could not be extracted |
| 17 | `missing_batch` | `float64` (0/1) | Batch number was missing |
| 18 | `missing_expiry` | `float64` (0/1) | Expiry date field was omitted |

---

## 4. Evaluation Metrics (Held-Out Test Set)

- **Test Accuracy:** `1.0000` (100%)
- **Macro F1-Score:** `1.0000`
- **Weighted F1-Score:** `1.0000`
- **5-Fold Cross-Validation Accuracy:** `1.0000 (+/- 0.0000)`

### Confusion Matrix:
```
           Predicted Low  Predicted Medium  Predicted High
True Low         288              0                0
True Medium        0            160                0
True High          0              0              192
```

---

## 5. Risk Score Interpretation

- **`0.0 - 25.0` (Low Risk):** Authentic verification checks passed. Verified manufacturer, valid expiry date, 0 regulatory alerts, 0 duplicate anomalies.
- **`25.1 - 60.0` (Medium Risk):** Cautionary indicators. Near expiry, minor duplicate scans, incomplete metadata, or packaging irregularities.
- **`60.1 - 100.0` (High Risk):** Critical failure. Expired medicine, confirmed CDSCO NSQ recall alert, cloned serial number, or manufacturer mismatch.

---

## 6. Safety Guardrails & Fallback

1. **Independent Deterministic Checks:** Medically critical rules (expired medicine, CDSCO NSQ laboratory recall match) act as an independent guardrail and will always enforce an alert regardless of raw model output.
2. **Rule-Based Fallback:** If the ML model artifact fails to load or inference fails, the backend seamlessly falls back to `RuleBasedRiskEngine` with zero downtime.
3. **No False Authentic Claims:** The model never classifies a medicine as 100% genuine or counterfeit solely based on statistical inference.
