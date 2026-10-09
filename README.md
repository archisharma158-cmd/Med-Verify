<div align="center">

  <img
    src="https://capsule-render.vercel.app/api?type=waving&amp;color=0:8FFFD1,40:22DDA0,75:008F68,100:063F36&amp;height=230&amp;section=header&amp;text=MEDIFY&amp;fontSize=62&amp;fontColor=FFFFFF&amp;fontAlignY=38&amp;animation=fadeIn"
    width="100%"
    alt="Medify Header Banner"
  />

  <br />

  <img
    src="docs/readme-assets/medify-logo.png"
    alt="Medify Logo"
    width="340"
  />

  <br />

  <img
    src="https://readme-typing-svg.demolab.com?font=JetBrains+Mono&amp;weight=600&amp;size=19&amp;duration=2500&amp;pause=800&amp;color=00C878&amp;center=true&amp;vCenter=true&amp;width=700&amp;lines=Scanning+medicine+information...;Checking+expiry+dates...;Matching+regulatory+alerts...;Evaluating+medicine+risk...;Making+Healthcare+Accessible..."
    alt="Medify Animated Typing Text"
  />

</div>
[![Live Showcase Site](https://img.shields.io/badge/🌐_Live_Showcase-Medify_Site-00D9AA?style=for-the-badge&logo=googlechrome&logoColor=black)](https://archisharma158-cmd.github.io/Med-Verify/)
[![Interactive Architecture](https://img.shields.io/badge/📐_Interactive-Architecture_Hub-00A86B?style=for-the-badge&logo=diagramsdotnet&logoColor=white)](#-system-architecture)
[![Documentation](https://img.shields.io/badge/📖_View-Documentation-006B45?style=for-the-badge&logo=github&logoColor=white)](#-about-medify)

<br />

[![Python](https://img.shields.io/badge/Python-3.12+-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Flutter](https://img.shields.io/badge/Flutter-Planned-02569B?style=flat-square&logo=flutter&logoColor=white)](#-technology-stack)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://supabase.com)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-AI_Chat-4285F4?style=flat-square&logo=google&logoColor=white)](https://ai.google.dev)
[![Sarvam AI](https://img.shields.io/badge/Sarvam_AI-Hindi_Voice-00A86B?style=flat-square&logo=openai&logoColor=white)](#-ai-and-voice-assistant)
[![License](https://img.shields.io/badge/License-MIT-00D9AA?style=flat-square)](LICENSE)

<br />

[🌐 Live Showcase Site](https://archisharma158-cmd.github.io/Med-Verify/) · [📖 System Architecture](#-system-architecture) · [⚙️ Backend Architecture](#-backend-architecture) · [🔄 Verification Workflow](#-medicine-verification-workflow) · [✨ Features](#-key-features) · [🚀 Quick Start](#-getting-started) · [🔌 API Docs](#-api-documentation) · [🤝 Meet the Team](#-team-and-contributors)

</div>

## 📑 Table of Contents

- [About Medify](#-about-medify)
- [The Problem](#-the-problem)
- [Our Solution](#-our-solution)
- [Why Medify Matters](#-why-medify-matters)
- [Key Features](#-key-features)
- [Technology Stack](#-technology-stack)
- [System Architecture](#-system-architecture)
- [Backend Architecture](#-backend-architecture)
- [Medicine Verification Workflow](#-medicine-verification-workflow)
- [Project Directory Structure](#-project-directory-structure)
- [Getting Started](#-getting-started)
- [Environment Configuration](#-environment-configuration)
- [API Documentation](#-api-documentation)
- [Risk Scoring System](#-risk-scoring-system)
- [AI and Voice Assistant](#-ai-and-voice-assistant)
- [Testing and Development Status](#-testing-and-development-status)
- [Screenshots and Demo](#-screenshots-and-demo)
- [Future Roadmap](#-future-roadmap)
- [Team and Contributors](#-team-and-contributors)
- [Security and Medical Disclaimer](#-security-and-medical-disclaimer)
- [License](#-license)

---

## 📖 About Medify

**Medify** is an AI-assisted medicine screening and health safety awareness system designed to help individuals—especially in rural and semi-urban communities—screen medicine packaging for **expiry dates, regulatory alerts, suspicious batch numbers, and potential tampering**.

By combining multi-modal input methods (**QR/Barcode scanning**, **Camera OCR text extraction**, **Hindi/English voice interaction**, and **manual details entry**), Medify cross-references medicine details against curated pharmaceutical databases, openFDA drug labels, and imported **CDSCO (Central Drugs Standard Control Organisation)** safety notices.

> [!IMPORTANT]
> **Informational Screening Tool Notice:** Medify is designed purely for public screening and educational awareness. It is **not** a chemical authentication laboratory or a replacement for official regulatory bodies. A low concern score does not guarantee absolute authenticity. Always consult a licensed pharmacist or qualified physician when in doubt.

---

## 💡 The Problem

Millions of individuals in underserved communities face significant barriers when purchasing and taking prescribed or over-the-counter medicines:

1. **Hard-to-Read Packaging:** Fine-print expiry dates and technical batch numbers are difficult to read, especially for elderly users or those with visual impairment.
2. **Substandard & Flagged Medicines:** Known drug recall alerts issued by regulators like CDSCO are often published in PDF gazettes that consumers never see.
3. **Language & Literacy Barriers:** Technical medical jargon is predominantly in English, creating a disconnect for non-English speakers.
4. **Counterfeit & Tampering Concerns:** Serialized scans and batch inconsistencies often go unnoticed without digital record-keeping.

---

## 🛡️ Our Solution

Medify bridges the healthcare information gap with an accessible, multi-modal screening pipeline:

```mermaid
flowchart LR
    subgraph Inputs[1. Multi-Modal Inputs]
        A[📷 Camera OCR]
        B[📱 QR / Barcode Scan]
        C[🗣️ Hindi Voice Input]
        D[⌨️ Manual Entry]
    end

    subgraph Core[2. Medify Intelligence Engine]
        E[FastAPI Backend]
        F[CDSCO Safety Alerts]
        G[Rule-Based Risk Engine]
        H[Google Gemini & Sarvam AI]
    end

    subgraph Outputs[3. Accessible Guidance]
        I[🟢 Low / 🟡 Med / 🔴 High Concern Score]
        J[🔊 Hindi & English Voice Explanation]
        K[🚩 Flag & Report Suspicious Batch]
    end

    Inputs --> Core --> Outputs
```

> <div align="center">
> 
> ### 💙 *"Making medicine safety awareness accessible to everyone."*
> 
> </div>

---

## ⭐ Why Medify Matters

| Challenge | How Medify Addresses It |
|---|---|
| **Expired Medicine** | Automated date parsing and real-time expiry alerts |
| **Regulatory Recalls** | Automatic match against imported CDSCO Not-of-Standard-Quality (NSQ) records |
| **Literacy / Language Barrier** | Voice interaction powered by Sarvam AI (Hindi STT/TTS) and bilingual Gemini AI summaries |
| **Packaging Anomalies** | Structured packaging verification checklists and suspicious medicine reporting |
| **Community Traceability** | Secure scan audit history with device fingerprinting and optional geo-tagging |

---

## ✨ Key Features

| Capability | Status | Description |
|---|---|---|
| 📱 **QR & Barcode Scanning** | 🟢 Implemented | Decodes retail barcodes, GS1 identifiers, and 2D QR codes on medicine cartons. |
| 📷 **Packaging OCR Recognition** | 🟢 Implemented | Extracts product name, batch number, manufacturing date, and expiry date via OCR.space API. |
| ⌨️ **Manual Detail Entry** | 🟢 Implemented | Form-based lookup for verification without a camera or readable barcode. |
| 🗓️ **Expiry & Date Verification** | 🟢 Implemented | Identifies expired, near-expiry, and invalid date formats automatically. |
| 🏛️ **CDSCO Regulatory Alerts** | 🟢 Implemented | Matches scanned batches and names against imported CDSCO NSQ/spurious drug notices. |
| 📊 **Rule-Based Risk Engine** | 🟢 Implemented | Heuristic 0–100 risk score categorized into Low, Medium, or High concern. |
| 🗣️ **Sarvam AI Voice Assistant** | 🟢 Implemented | Speech-to-text (STT) and text-to-speech (TTS) in Hindi for rural accessibility. |
| 🤖 **Gemini AI Explanations** | 🟢 Implemented | Grounded, easy-to-understand explanations of scan findings in English and Hindi. |
| 🌐 **openFDA Drug Data Integration** | 🟢 Implemented | Queries supplementary international drug information for active ingredient checks. |
| 🚩 **Suspicious Medicine Reporting** | 🟢 Implemented | Allows users to submit reports with photos for administrative review. |
| 🕘 **Scan Audit History** | 🟢 Implemented | Persists historical scans with risk category, timestamp, and device fingerprint. |
| 🛡️ **Admin Governance Subsystem** | 🟢 Implemented | Import CDSCO CSV/JSON alerts, review reported medicines, and monitor platform audit logs. |
| 🔮 **ML-Based Anomaly Model** | 🔵 Planned | Machine learning model for computer-vision packaging anomaly detection. |

---

## 🧰 Technology Stack

### Core Technologies

| Layer | Technologies & Frameworks | Implementation Status |
|---|---|---|
| **Web Frontend** | ![React](https://img.shields.io/badge/React_18-61DAFB?logo=react&logoColor=black) ![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white) ![CSS3](https://img.shields.io/badge/Vanilla_CSS-1572B6?logo=css3&logoColor=white) | 🟢 **Implemented** (Active Web Suite) |
| **Mobile Frontend** | ![Flutter](https://img.shields.io/badge/Flutter-02569B?logo=flutter&logoColor=white) ![Dart](https://img.shields.io/badge/Dart-0175C2?logo=dart&logoColor=white) | 🔵 **Planned** (Cross-platform client) |
| **Backend API** | ![Python](https://img.shields.io/badge/Python_3.12-3776AB?logo=python&logoColor=white) ![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white) ![Pydantic](https://img.shields.io/badge/Pydantic_v2-E92063?logo=pydantic&logoColor=white) | 🟢 **Implemented** (`app/main.py`) |
| **Database & Auth** | ![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?logo=supabase&logoColor=white) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL_15-4169E1?logo=postgresql&logoColor=white) ![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy_2.0-D76B00?logo=sqlalchemy&logoColor=white) | 🟢 **Implemented** (`app/models/models.py`) |
| **AI & LLM** | ![Google Gemini](https://img.shields.io/badge/Google_Gemini-4285F4?logo=google&logoColor=white) ![Sarvam AI](https://img.shields.io/badge/Sarvam_AI_Hindi-00A86B?logo=openai&logoColor=white) | 🟢 **Implemented** (`gemini_service.py`, `sarvam_service.py`) |
| **OCR & Vision** | ![OCR.space](https://img.shields.io/badge/OCR.space-00D9AA?logo=powershell&logoColor=white) ![OpenCV](https://img.shields.io/badge/OpenCV-5C3EE8?logo=opencv&logoColor=white) ![Pillow](https://img.shields.io/badge/Pillow-111111?logo=python&logoColor=white) | 🟢 **Implemented** (`ocr_service.py`) |
| **Drug Data** | ![CDSCO](https://img.shields.io/badge/CDSCO_Alerts-006B45?logo=government&logoColor=white) ![openFDA](https://img.shields.io/badge/openFDA_API-112E51?logo=usps&logoColor=white) | 🟢 **Implemented** (`cdsco_service.py`, `openfda_service.py`) |
| **Testing & Infra** | ![Pytest](https://img.shields.io/badge/Pytest-0A9EDC?logo=pytest&logoColor=white) ![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white) ![Render](https://img.shields.io/badge/Render-46E3B7?logo=render&logoColor=black) | 🟢 **Implemented** (`Dockerfile`, `tests/`) |

---

## 🏗️ System Architecture

Medify utilizes a decoupled, high-performance architecture connecting multi-modal clients to a centralized FastAPI service boundary, PostgreSQL database, and specialized external AI APIs.

<a href="https://archisharma158-cmd.github.io/Med-Verify/architecture/system-architecture.html" target="_blank">
  <img src="docs/readme-assets/system-architecture-preview.png" alt="Medify System Architecture" width="100%" />
</a>

> 🔗 **Interactive View:** Click the preview above or open the [Interactive System Architecture Diagram](https://archisharma158-cmd.github.io/Med-Verify/architecture/system-architecture.html) to launch the full interactive Archify canvas with zoom, pan, category filtering, and trace animation.

### Architectural Breakdown
- **Client Tier:** Web interface built with React + Vite (`src/` on `frontend` branch) and planned Flutter mobile application.
- **Service Tier:** FastAPI server (`app/main.py`) providing asynchronous HTTP routing, request validation via Pydantic v2, and JWT security via Supabase Auth.
- **Persistence Tier:** Supabase PostgreSQL database managed through SQLAlchemy 2.0 ORM and Alembic migrations.
- **Integration Tier:** Asynchronous service calls to **OCR.space** (vision extraction), **Sarvam AI** (Hindi speech processing), **Google Gemini** (explanation generation), and **openFDA** (drug catalog data).

---

## ⚙️ Backend Architecture

The backend is organized into specialized domain services, enforcing single-responsibility principles and strict input data schemas.

<a href="https://archisharma158-cmd.github.io/Med-Verify/architecture/backend-architecture.html" target="_blank">
  <img src="docs/readme-assets/backend-architecture-preview.png" alt="Medify Backend Architecture" width="100%" />
</a>

> 🔗 **Interactive View:** Click the preview above or open the [Interactive Backend Architecture Diagram](https://archisharma158-cmd.github.io/Med-Verify/architecture/backend-architecture.html) to inspect domain boundaries, database models, and service interfaces.

### Core Subsystems
1. **APIRouter Gateway (`app/api/`):** Exposes 13 REST endpoint modules for authentication, verification, barcodes, OCR, medicines, alerts, voice, chat, reports, history, and administration.
2. **Auth & Security (`app/core/security.py`):** Handles password hashing, JWT token verification, and role-based route access controls.
3. **Verification Engine (`app/services/verification_service.py`):** Central orchestrator that consumes raw scan data, queries local medicine catalogs, checks CDSCO alert tables, and invokes the risk engine.
4. **Risk Scoring Engine (`app/services/risk_service.py`):** Executes deterministic, rule-based screening calculations to produce a 0–100 concern score and human-readable explanations.
5. **Database ORM (`app/models/models.py`):** Defines clean relational tables (`User`, `Medicine`, `MedicineBatch`, `RegulatoryAlert`, `ScanHistory`, `SuspiciousReport`, `ReferencePackaging`, `AuditEvent`).

---

## 🔄 Medicine Verification Workflow

The end-to-end verification pipeline transforms multi-modal inputs into structured safety recommendations in under two seconds.

<a href="https://archisharma158-cmd.github.io/Med-Verify/architecture/verification-workflow.html" target="_blank">
  <img src="docs/readme-assets/verification-workflow-preview.png" alt="Medify Verification Workflow" width="100%" />
</a>

> 🔗 **Interactive View:** Click the preview above or open the [Interactive Verification Workflow Diagram](https://archisharma158-cmd.github.io/Med-Verify/architecture/verification-workflow.html) to trace the step-by-step signal flow.

### Workflow Execution Stages

```text
[User Input] ──► [Extraction] ──► [Database & Alert Lookup] ──► [Risk Engine] ──► [Bilingual & Voice Output]
   (QR/OCR)        (OCR.space)       (CDSCO + openFDA)         (0-100 Score)      (Gemini + Sarvam AI)
```

1. **Intake Phase:** Accepts input via GS1 2D DataMatrix/barcode scanning, camera packaging photography, or manual form entry.
2. **Extraction Phase:** OCR.space and regex engines parse raw text to extract product brand name, active ingredients, batch number, manufacturing date, and expiry date.
3. **Verification Phase:** Queries the local PostgreSQL catalog and performs fuzzy string matching against imported CDSCO Not-of-Standard-Quality (NSQ) records.
4. **Risk Evaluation Phase:** The rule-based engine evaluates date validity, alert matches, duplicate scan frequency, and packaging integrity checklists.
5. **Result Generation Phase:** Gemini AI generates grounded bilingual explanations (Hindi & English), while Sarvam AI synthesizes spoken audio for low-literacy users.
6. **Reporting Phase:** High-concern results trigger an optional one-click reporting flow to notify administrators.

---

## 📁 Project Directory Structure

```text
Med-Verify/
├── app/                        # Main FastAPI Application
│   ├── api/                    # APIRouter REST Endpoints
│   │   ├── admin.py            # CDSCO imports, moderation, audit logs
│   │   ├── alerts.py           # Regulatory alert lookups
│   │   ├── auth.py             # User registration & authentication
│   │   ├── barcode.py          # QR & Barcode processing
│   │   ├── chat.py             # Gemini AI chatbot endpoint
│   │   ├── health.py           # System health diagnostics
│   │   ├── history.py          # User scan history API
│   │   ├── medicines.py        # Medicine catalog endpoints
│   │   ├── ocr.py              # Packaging text extraction endpoint
│   │   ├── packaging.py        # Packaging checklist analysis
│   │   ├── reports.py          # Suspicious medicine reporting
│   │   ├── verify.py           # Core verification engine endpoint
│   │   └── voice.py            # Sarvam AI Hindi voice processing
│   ├── core/                   # System Configuration & Security
│   │   ├── config.py           # Pydantic BaseSettings & env loading
│   │   ├── exceptions.py       # Custom HTTP exception handlers
│   │   ├── logging.py          # Structured logging setup
│   │   └── security.py         # Passwords, JWT, and authorization
│   ├── database/               # Database Connection & Seeding
│   │   ├── seed.py             # Demo medicine & CDSCO alert seeder
│   │   └── session.py          # SQLAlchemy async/sync session factory
│   ├── models/                 # SQLAlchemy 2.0 Database Models
│   │   └── models.py           # User, Medicine, Alert, History tables
│   ├── schemas/                # Pydantic Schemas & Validation
│   │   └── schemas.py          # Request & Response payload schemas
│   ├── services/               # Core Business Domain Services
│   │   ├── barcode_service.py  # Barcode & GS1 DataMatrix decoder
│   │   ├── cdsco_service.py    # CDSCO alert matching & CSV importer
│   │   ├── duplicate_service.py# Serial scan frequency & anomaly checks
│   │   ├── gemini_service.py   # Google Gemini AI prompt orchestration
│   │   ├── medicine_service.py # Catalog CRUD & lookup service
│   │   ├── ocr_service.py      # OCR.space API integration & parsing
│   │   ├── openfda_service.py  # openFDA drug API integration
│   │   ├── packaging_service.py# Packaging anomaly evaluation
│   │   ├── report_service.py   # Suspicious report handler
│   │   ├── risk_service.py     # Rule-based 0-100 risk scoring engine
│   │   ├── sarvam_service.py   # Sarvam AI STT & TTS integration
│   │   └── verification_service.py # Master verification pipeline
│   └── main.py                 # FastAPI application initialization & CORS
├── alembic/                    # Alembic Database Migrations
├── docs/                       # Project Documentation & Assets
│   ├── architecture/           # Interactive Archify HTML & Spec files
│   │   ├── system-architecture.html
│   │   ├── backend-architecture.html
│   │   └── verification-workflow.html
│   └── readme-assets/          # README Graphics & Diagram Previews
│       ├── medify-logo.png
│       ├── header-typing.svg
│       ├── system-architecture-preview.png
│       ├── backend-architecture-preview.png
│       └── verification-workflow-preview.png
├── scripts/                    # Maintenance & Demo Scripts
│   ├── demo_verification.py   # Terminal verification workflow demo
│   └── seed_database.py        # Database seed runner script
├── tests/                      # Automated Pytest Suite
│   ├── test_api_endpoints.py   # REST API endpoint tests
│   ├── test_barcode_service.py # Barcode decoder unit tests
│   ├── test_cdsco_service.py   # CDSCO matching unit tests
│   └── test_risk_engine.py     # Risk scoring engine unit tests
├── Dockerfile                  # Container build instructions
├── docker-compose.yml          # Local container orchestration
├── render.yaml                 # Deployment configuration blueprint
├── requirements.txt            # Python dependencies
├── FLUTTER_INTEGRATION_GUIDE.md# Flutter mobile app integration guide
├── LICENSE                     # MIT License
└── README.md                   # Project Documentation
```

---

## 🚀 Getting Started

### Prerequisites
- **Python:** 3.12 or higher
- **Git:** Installed on system
- **Database:** PostgreSQL database instance (or Supabase project)
- **API Keys:** API keys for external services (OCR.space, Sarvam AI, Google Gemini)

### Step-by-Step Installation

#### 1. Clone the Repository
```bash
git clone https://github.com/archisharma158-cmd/Med-Verify.git
cd Med-Verify
```

#### 2. Create & Activate Virtual Environment

**Windows PowerShell:**
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

**macOS / Linux:**
```bash
python3 -m venv .venv
source .venv/bin/activate
```

#### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

#### 4. Configure Environment Variables
Copy the example environment file and update your credentials:

**Windows PowerShell:**
```powershell
Copy-Item .env.example .env
```

**macOS / Linux:**
```bash
cp .env.example .env
```

#### 5. Database Setup & Migrations
Run database migrations to initialize tables, then seed demo medicine data:
```bash
alembic upgrade head
python scripts/seed_database.py
```

#### 6. Start FastAPI Development Server
```bash
uvicorn app.main:app --reload
```

Server will start at **`http://127.0.0.1:8000`**.
Open **`http://127.0.0.1:8000/docs`** to access the interactive Swagger API documentation.

---

## 🔐 Environment Configuration

Create a local `.env` file in the project root. Never commit this file to version control.

```dotenv
# Application Settings
ENVIRONMENT=development
SECRET_KEY=your_super_secret_jwt_signing_key_here
LOG_LEVEL=INFO

# Supabase Database & Auth
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SECRET_KEY=your_supabase_service_role_key
DATABASE_URL=postgresql+psycopg2://postgres:your_password@db.your-project.supabase.co:5432/postgres

# External AI & Vision API Keys
SARVAM_API_KEY=your_sarvam_ai_api_key
OCR_SPACE_API_KEY=your_ocr_space_api_key
GEMINI_API_KEY=your_google_gemini_api_key
OPENFDA_API_KEY=your_optional_openfda_key
```

> [!NOTE]
> Keep server-side secret keys (`SUPABASE_SECRET_KEY` and `DATABASE_URL` credentials) strictly confidential on your backend deployment environment.

---

## 🔌 API Documentation

Medify provides a RESTful API organized into modular route groups. Access the live interactive documentation at `/docs` when running the backend.

| HTTP Method | Route Endpoint | Description | Auth Required |
|---|---|---|:---:|
| `GET` | `/health` | Health diagnostic check and system uptime | ❌ No |
| `POST` | `/api/auth/register` | Register a new user account | ❌ No |
| `POST` | `/api/auth/login` | Authenticate user and return JWT access token | ❌ No |
| `GET` | `/api/auth/me` | Fetch authenticated user profile details | 🔑 Yes |
| `POST` | `/api/verify/` | Master verification endpoint (QR/OCR/Manual payload) | ❌ No (Optional) |
| `POST` | `/api/barcode/decode` | Process and decode uploaded QR/barcode image | ❌ No |
| `POST` | `/api/ocr/extract` | Extract text and parse medicine details from carton photo | ❌ No |
| `GET` | `/api/medicines/search` | Search curated medicine database catalog | ❌ No |
| `GET` | `/api/alerts/check` | Check medicine name/batch against CDSCO alerts | ❌ No |
| `POST` | `/api/packaging/analyze` | Perform packaging anomaly checklist evaluation | ❌ No |
| `POST` | `/api/chat/query` | Send natural language inquiry to Gemini AI chatbot | ❌ No |
| `POST` | `/api/voice/process` | Convert Hindi audio to text and synthesize voice response | ❌ No |
| `POST` | `/api/reports/` | Submit suspicious medicine report with optional images | 🔑 Yes |
| `GET` | `/api/history/` | Fetch authenticated user's scan audit history | 🔑 Yes |
| `POST` | `/api/admin/alerts/import` | Upload and import CDSCO NSQ alert batch (Admin only) | 🔑 Yes (Admin) |

<details>
<summary>💡 Click to view example Verification API Request payload</summary>

```json
POST /api/verify/
Content-Type: application/json

{
  "input_method": "ocr",
  "medicine_name": "Paracetamol 500mg",
  "manufacturer": "Sample Pharma Ltd",
  "batch_number": "BATCH-2024-X9",
  "expiry_date": "2024-08-31",
  "gtin": "08901234567890",
  "serial_number": "SN-994820",
  "device_fingerprint": "a3f89021b..."
}
```
</details>

---

## 📊 Risk Scoring System

The Medify Risk Engine computes a transparent **0 to 100 concern score** using a weighted heuristic matrix:

```mermaid
pie title Risk Scoring Categories
    "Low Concern (0 - 25)" : 60
    "Medium Concern (26 - 60)" : 25
    "High Concern (61 - 100)" : 15
```

### Risk Matrix & Heuristics

| Category | Score Range | Triggers & Rules | Recommended Action |
|---|:---:|---|---|
| 🟢 **Low Concern** | `0 – 25` | No CDSCO match, valid unexpired dates, catalog record verified. | Standard usage. Retain receipt and packaging. |
| 🟡 **Medium Concern** | `26 – 60` | Near expiry (<90 days), missing catalog batch record, minor text discrepancies. | Inspect packaging carefully. Verify with pharmacist. |
| 🔴 **High Concern** | `61 – 100` | **Confirmed Expired date**, **CDSCO NSQ alert match**, or **duplicate serial anomaly**. | **Do not consume.** Consult pharmacist and flag via report form. |

```text
Total Concern Score = Math.min(100, ExpiryScore + AlertScore + SerialAnomalyScore + PackagingCheckScore)
```

> **Design Rationale:** Rule-based heuristic scoring provides predictable, explainable results without black-box unpredictability. The service layer exposes a modular interface (`RiskEngineInterface`), making it easy to drop in a trained Machine Learning model in future releases.

---

## 🗣️ AI and Voice Assistant

To overcome language and literacy barriers, Medify integrates **Sarvam AI** for Hindi voice processing and **Google Gemini** for accessible explanations.

```mermaid
sequenceDiagram
    autonumber
    actor User as Rural User
    participant Voice as Sarvam AI (Voice)
    participant Core as Medify Verification
    participant Gemini as Google Gemini
    
    User->>Voice: Speaks Hindi query ("क्या यह दवा सुरक्षित है?")
    Voice->>Core: Speech-to-Text (Hindi Transcribed)
    Core->>Core: Runs Verification & Risk Engine
    Core->>Gemini: Prompts LLM with grounded scan facts & risk score
    Gemini-->>Core: Generates simple Hindi summary
    Core->>Voice: Requests Text-to-Speech audio synthesis
    Voice-->>User: Plays clear Hindi audio response 🔊
```

### Accessibility Impact
- **Hindi Speech Recognition (STT):** Converts spoken Hindi queries into structured search requests.
- **Hindi Text-to-Speech (TTS):** Reads verification results and dosage precautions aloud in clear Hindi.
- **Grounded Gemini Chatbot:** Responds to user safety queries based *strictly* on verified scan facts to eliminate AI hallucinations.

---

## 🧪 Testing and Development Status

The Medify backend includes an automated test suite built with **Pytest** covering core service logic and API endpoints.

```bash
# Run automated tests
pytest -v
```

### Test Suite Coverage
- `tests/test_api_endpoints.py`: Verifies HTTP status codes, JSON response schemas, and authentication middleware.
- `tests/test_barcode_service.py`: Tests GS1 DataMatrix parsing, EAN-13 decoding, and malformed barcode handling.
- `tests/test_cdsco_service.py`: Tests fuzzy string matching and alert queries against seeded CDSCO records.
- `tests/test_risk_engine.py`: Validates risk score calculations across low, medium, and high concern test fixtures.

```text
============================== 16 passed in 1.42s ==============================
```

---

## 🖼️ Screenshots and Demo

<div align="center">

| Mobile / Web Scanning Interface | Verification Results & Voice Assistant |
|:---:|:---:|
| <img src="docs/readme-assets/verification-workflow-preview.png" width="450" alt="Scanning Interface" /> | <img src="docs/readme-assets/system-architecture-preview.png" width="450" alt="Results Interface" /> |
| *Multi-modal QR, OCR & Voice Input* | *Bilingual Explanations & Risk Score* |

</div>

---

## 🛣️ Future Roadmap

- [x] FastAPI modular backend architecture with Pydantic v2 validation
- [x] Multi-modal input pipeline (QR/Barcode, OCR.space, Manual Entry)
- [x] Rule-based risk scoring engine (0–100 concern scale)
- [x] CDSCO Not-of-Standard-Quality (NSQ) alert matching module
- [x] Sarvam AI Hindi voice assistant (STT & TTS) integration code
- [x] Google Gemini AI grounded explanation chatbot
- [x] Interactive Archify system, backend, and workflow architecture diagrams
- [ ] Complete Flutter mobile client deployment (iOS & Android)
- [ ] Train, evaluate, and validate a computer-vision packaging anomaly ML model
- [ ] Direct manufacturer API integration for authentic batch serialization checks
- [ ] Expand CDSCO alert database importer with automated web scrapers
- [ ] Multi-regional language support (Tamil, Telugu, Bengali, Marathi)
- [ ] Offline-first local caching for low-bandwidth rural health centers

---

## 🤝 Team and Contributors

Medify was conceptualized and built for national-level innovation hackathons to empower communities through accessible medicine verification and health safety awareness.

<div align="center">

| Contributor | Position / Key Contributions | Profile / Contact |
|:---|:---|:---:|
| **Sonu Sharma** | **Team Lead** • ML Model Training • PPT Preparation | — |
| **Archi Sharma** | **Backend Development** • System Integration • Deployment • README Documentation • Repository Maintenance | [@archisharma158-cmd](https://github.com/archisharma158-cmd) |
| **Parth Goyal** | **Frontend Development** • Language Conversion | — |
| **Aanchal Pandey** | **Research** • PPT Preparation | — |
| **Aishwarya Bhatt** | **Research** | — |
| **Dipanshu Jasrotiya** | **Research** | — |

<br />

*Contributions, bug reports, and feature suggestions are welcome! Feel free to open an issue or submit a pull request.*

</div>

---

## 🔒 Security and Medical Disclaimer

> [!CAUTION]
> ### ⚕️ Important Medical & Safety Disclaimer
> **Medify is an informational screening tool designed to raise awareness about medicine safety and regulatory alerts. It does not perform laboratory chemical analysis or molecular drug authentication.**
> 
> - **Not Medical Advice:** Medify does not diagnose conditions, prescribe treatments, or provide medical advice.
> - **Not Guarantees of Authenticity:** A low concern score or absence of a CDSCO alert match does **not** guarantee that a drug is genuine, safe, or appropriate for your medical needs.
> - **Always Consult Professionals:** If a medicine appears discolored, damaged, improperly sealed, or suspicious in any way, **do not consume it**. Consult a qualified pharmacist, doctor, or healthcare professional immediately.

### Security Best Practices
- **API Key Security:** Store secrets strictly in environment variables; never expose them in client bundles.
- **Data Privacy:** Location coordinates are collected only with explicit user consent.
- **Audit Logging:** Administrative actions and alert imports are recorded in the `audit_events` log table.

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

<div align="center">

<a href="https://readme-typing-svg.demolab.com">
  <img src="https://readme-typing-svg.demolab.com?font=JetBrains+Mono&weight=600&size=18&duration=2500&pause=800&color=00C878&center=true&vCenter=true&width=700&lines=Safer+Medicines.+Informed+Decisions.;Technology+for+Accessible+Healthcare.;Empowering+Communities+Through+Awareness.;Medify+%E2%80%94+Making+Medicine+Safety+Information+Accessible." alt="Medify Footer Typing Tagline" />
</a>

<br /><br />

[⬆ Back to Top](#medify)

<br /><br />

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:080F12,45:06473B,70:00A86B,100:77FFD1&height=160&section=footer" width="100%" alt="Medify Footer Banner" />

</div>
