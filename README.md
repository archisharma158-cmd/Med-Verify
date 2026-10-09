# MedVerify – Smart Medicine Verification System 🏥🇮🇳

[![Python 3.12](https://img.shields.io/badge/python-3.12-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-green.svg)](https://fastapi.tiangolo.com)
[![SQLAlchemy 2.0](https://img.shields.io/badge/SQLAlchemy-2.0-red.svg)](https://www.sqlalchemy.org)
[![Tests Passing](https://img.shields.io/badge/tests-16%20passed%20(100%25)-brightgreen.svg)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**MedVerify** is an AI-powered medicine screening and verification system engineered specifically for rural and urban India. It empowers citizens, rural health workers (ASHAs), and pharmacists to detect expired, tampered, substandard, or regulator-flagged medicines through barcode/QR scanning, OCR packaging analysis, CDSCO regulatory alert ingestion, and explainable bilingual AI assistance (Hindi & English).

> **Public Health Disclaimer**: MedVerify is an assistive screening and public awareness tool, **not** a definitive forensic counterfeit detector. It never claims that an unmatched medicine is verified genuine or safe to consume. Medical decisions must always involve qualified doctors and pharmacists.

---

## 🌟 Key Capabilities

1. **Multi-Modal Medicine Ingestion**:
   - **Barcode / QR Decoding**: Reads GS1 DataMatrix, EAN-13, EAN-8, UPC-A, Code128, and extracts Application Identifiers (`(01)` GTIN, `(10)` Batch, `(17)` Expiry Date, `(21)` Serial Number).
   - **Packaging OCR**: Extracts medicine brand, manufacturer, batch number, and expiry dates using OCR.space and advanced regex normalization.
   - **Manual Search & Lookup**: Curated database of verified Indian medicines + supplementary openFDA drug lookup.

2. **Automated Verification Engine**:
   - **Deterministic Expiry Checking**: Flags expired and near-expiry medications with day-level precision.
   - **CDSCO Alert Ingestion**: Periodically parses Central Drugs Standard Control Organisation Not-of-Standard-Quality (NSQ) and spurious drug alerts with fuzzy product and exact batch matching.
   - **Duplicate Scan Anomaly Detection**: Identifies suspicious repeated serial scans across disparate geographical locations or short time intervals.
   - **Packaging Integrity Check**: OpenCV analysis for label blurriness, tampering indicators, and structural image similarity against reference packaging.

3. **Explainable Risk Scoring Engine**:
   - Configurable rule-based heuristic with transparent scoring (Low: 0-25, Medium: 26-60, High: 61-100).
   - Swappable interface (`RiskScoringEngine`) ready to accept trained ML models (`.joblib`, `.onnx`) without altering API contracts.
   - Plain-language explanations generated simultaneously in **Hindi (सरल हिंदी)** and **English**.

4. **Rural Accessibility & AI Assistant**:
   - **Google Gemini Chatbot**: Grounded assistant that answers verification queries without medical hallucination.
   - **Sarvam AI Voice Integration**: Speech-to-Text (`saarika:v2`) for voice queries in Hindi and Text-to-Speech (`bulbul:v1`) for spoken answer playback.

5. **Citizen Reporting & Admin Dashboard**:
   - Suspicious medicine reporting with image uploads and tamper reasons.
   - Operational admin metrics, scan volume trends, and CSV batch alert ingestion.

---

## 🏗️ Architecture

```
                                  [Flutter Mobile App]
                                           │
                           REST API / JSON │ (Supabase JWT / Guest)
                                           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                             FastAPI Application                             │
│  ┌───────────────────────┐  ┌───────────────────────┐  ┌──────────────────┐ │
│  │ /api/verify           │  │ /api/barcode          │  │ /api/ocr         │ │
│  │ /api/chat             │  │ /api/voice            │  │ /api/medicines   │ │
│  │ /api/reports          │  │ /api/alerts           │  │ /api/admin       │ │
│  └───────────────────────┘  └───────────────────────┘  └──────────────────┘ │
└───────────────────────┬───────────────────────────────┬─────────────────────┘
                        │                               │
         ┌──────────────▼──────────────┐   ┌────────────▼────────────┐
         │       Service Layer         │   │   External Integrations │
         │ • Verification Engine       │   │ • Google Gemini (AI)    │
         │ • Rule-Based Risk Engine    │   │ • Sarvam AI (Voice)     │
         │ • CDSCO Alert Matching      │   │ • OCR.space (OCR)       │
         │ • Duplicate Anomaly Detector│   │ • openFDA (Drug DB)     │
         │ • OpenCV Packaging Analyzer │   │ • Supabase Auth/Storage │
         └──────────────┬──────────────┘   └─────────────────────────┘
                        ▼
         ┌─────────────────────────────┐
         │ Database (SQLAlchemy 2.0)   │
         │ PostgreSQL / SQLite Async   │
         │ (Users, Medicines, Batches, │
         │  Scans, Alerts, Reports)    │
         └─────────────────────────────┘
```

---

## 🚀 Quickstart & Setup

### 1. Prerequisites
- Python 3.12+
- Git

### 2. Installation
```bash
git clone https://github.com/archisharma158-cmd/Med-Verify.git
cd Med-Verify

# Create and activate virtual environment (optional)
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Environment Variables
Copy `.env.example` to `.env` and configure your credentials:
```env
# Application
ENVIRONMENT=development
PORT=8000
SECRET_KEY=medverify-dev-secret

# Database
DATABASE_URL=sqlite+aiosqlite:///medverify.db
# Or PostgreSQL: postgresql+asyncpg://user:pass@localhost:5432/medverify

# External AI & OCR Keys
SARVAM_API_KEY=your_sarvam_key
OCR_SPACE_API_KEY=your_ocr_space_key
OPENFDA_API_KEY=your_openfda_key
GEMINI_API_KEY=your_gemini_key

# Supabase Auth & Storage
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SECRET_KEY=your_supabase_secret
```

### 4. Seed Database with Indian Medicines & CDSCO Alerts
```bash
python scripts/seed_database.py
```

### 5. Start the Server
```bash
uvicorn app.main:app --reload --port 8000
```
Open **[http://localhost:8000/docs](http://localhost:8000/docs)** to view the interactive Swagger OpenAPI specification.

---

## 🧪 Testing & Validation

Run the comprehensive test suite with `pytest`:
```bash
pytest -v
```
All 16 unit and integration tests validate:
- ✅ Barcode decoding & GS1 Application Identifier parsing
- ✅ CDSCO alert CSV ingestion and fuzzy matching
- ✅ Rule-based risk scoring and explanation generation
- ✅ Verification engine workflows (low risk, expired, flagged)
- ✅ API endpoints (`/health`, `/api/verify`, `/api/medicines/search`, `/api/chat`, `/api/reports`, `/api/admin/dashboard`)

Run the complete live simulation demo:
```bash
python scripts/demo_verification.py
```

---

## 🐳 Docker Deployment

Run with Docker Compose:
```bash
docker-compose up --build
```
This launches both the FastAPI backend and a PostgreSQL database container.

---

## 📱 Flutter Integration

For detailed request/response JSON contracts, state handling, and sample code for the Flutter frontend, refer to:
👉 **[FLUTTER_INTEGRATION_GUIDE.md](FLUTTER_INTEGRATION_GUIDE.md)**