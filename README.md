# MediFy — Smart Medicine Verification Platform

<div align="center">

<img src="public/logo.png" alt="MediFy — Safe Medicines, Healthier India" width="380" />

### Smart Medicine Verification & Packaging Safety Platform

**"Check Your Medicine. Stay Safe."**

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?logo=vite&logoColor=white)](https://vite.dev)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES2023+-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org)
[![Tesseract.js](https://img.shields.io/badge/OCR-Tesseract.js-5c6bc0)](https://github.com/naptha/tesseract.js)
[![html5-qrcode](https://img.shields.io/badge/Scanner-html5--qrcode-22c55e)](https://github.com/mebjas/html5-qrcode)

[Features](#1-project-overview--core-mission) · [Tech Stack](#2-technology-stack) · [Architecture](#3-project-architecture) · [Quick Start](#5-installation--local-development) · [Safety Protocol](#10-critical-safety-disclaimer)

</div>

---

## 1. Project Overview & Core Mission

Substandard and falsified (SF) medical products pose severe risks to patient health globally. While counterfeiters frequently duplicate barcodes or mimic outer brand aesthetics, discrepancies often emerge in micro-typography, mismatching batch identifiers, expired shelf-life stamps, or tampered physical seals.

**MediFy** empowers patients, caregivers, and community pharmacies with browser-native tools to:
1. **Decode Serialization Codes**: Read 2D DataMatrix (GS1), QR codes, and linear barcodes stamped on medicine cartons and blister packs.
2. **Extract Label Typography**: Use client-side Optical Character Recognition (OCR) to convert fine-print pharmaceutical labels into editable digital records.
3. **Analyze Batch & Shelf Life**: Evaluate alphanumeric batch structures and calculate real-time expiration timelines to prevent consuming stale pharmaceuticals.
4. **Compare with Reference Standards**: Highlight what matches standard monographs while explicitly identifying parameters that **remain unverified** by digital scans.
5. **Interactive Packaging Safety Checklist**: Walk through a 6-point physical inspection protocol (seals, typography, holograms, blister integrity).
6. **Bilingual Voice Assistant (MediBot)**: Access packaging literacy advice in English and Hindi with Speech-to-Text (STT) and Text-to-Speech (TTS) capabilities.

---

## 2. Technology Stack

- **Framework**: [React 19](https://react.dev/) with [Vite](https://vite.dev/)
- **Language**: JavaScript (ES2023+ JSX)
- **Styling**: Vanilla Modern CSS using CSS custom properties (design tokens), modern typography (`Manrope` & `Inter`), responsive grid and flexbox architectures.
- **Icons**: [Lucide React](https://lucide.dev/)
- **Camera Barcode & QR Scanner**: [`html5-qrcode`](https://github.com/mebjas/html5-qrcode) (supporting GS1 DataMatrix, QR codes, and linear barcodes)
- **Image OCR**: [`tesseract.js`](https://github.com/naptha/tesseract.js) (client-side optical character recognition)
- **Speech Technologies**: Browser [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API) (`SpeechRecognition` / `webkitSpeechRecognition` for voice input, and `window.speechSynthesis` for spoken responses) with runtime capability detection and graceful fallbacks.
- **Service Layer**: Dedicated abstract modules (`src/services/medicineService.js`, `src/services/chatbotService.js`, `src/services/speechService.js`) designed for modular API swaps.

---

## 3. Project Architecture

```text
Med-Verify/
├── index.html                           # App shell, Google Fonts (Manrope & Inter), meta tags
├── package.json                         # Dependencies & npm scripts
├── vite.config.js                       # Vite configuration
├── .env.example                         # Environment configuration template
├── README.md                            # Complete documentation & safety guide
├── public/
│   ├── favicon.png                      # 3D MediFy icon mark
│   ├── logo.png                         # 3D MediFy brand wordmark
│   ├── logo-icon.png                    # Square 3D brand emblem
│   └── logo.svg                         # Vector branding definition
├── app/                                 # FastAPI Backend (Python)
│   ├── main.py                          # Backend entrypoint
│   ├── api/                             # REST API routes (verify, barcode, ocr, chat, voice)
│   ├── services/                        # Service logic & integrations
│   └── models/                          # Database schemas & models
└── src/                                 # React Frontend (Vite)
    ├── main.jsx                         # React root bootstrap
    ├── App.jsx                          # Main view orchestration & state management
    ├── index.css                        # Design tokens, color system, typography, resets
    ├── App.css                          # Master component stylesheet, animations & responsive layout
    ├── assets/                          # Static brand image assets
    ├── constants/
    │   ├── demoCatalog.js               # Sample reference drugs & monographs (Demo Mode)
    │   └── medicineKnowledge.js         # Regulatory registers, physical inspection checklist, disclaimers
    ├── services/
    │   ├── medicineService.js           # Heuristic OCR parser, QR parser, shelf-life evaluator, report formatter
    │   ├── chatbotService.js            # Multilingual safe guidance engine (English & Hindi)
    │   └── speechService.js             # Web Speech API wrapper with capability detection
    ├── hooks/
    │   ├── useSpeechRecognition.js      # Voice input hook (STT)
    │   └── useSpeechSynthesis.js        # Voice playback hook (TTS)
    └── components/
        ├── layout/
        │   ├── Navbar.jsx               # Header with mobile drawer & quick jumps
        │   ├── Footer.jsx               # Authority links, emergency helplines, legal disclaimers
        │   └── ContactModal.jsx         # User feedback & inquiry dialog
        ├── home/
        │   ├── Hero.jsx                 # Value proposition, interactive medicine mockup card
        │   ├── BenefitsSection.jsx      # Practical healthcare utilities
        │   ├── HowItWorksSection.jsx    # 3-step inspection process pipeline
        │   ├── SafetySection.jsx        # Boundaries of automated scans & golden safety rules
        │   └── RegulatoryRegistrySection.jsx # CDSCO, US FDA, MHRA, EMA, WHO directories
        ├── scanner/
        │   ├── MedicineScanner.jsx      # Tab navigation wrapper
        │   ├── QrBarcodeScanner.jsx     # On-demand camera & file code scanner
        │   ├── PhotoOcrScanner.jsx      # Image preview, Tesseract progress, editable candidate fields
        │   └── ManualEntryForm.jsx      # Validated manual entry with demo prefill presets
        ├── verification/
        │   ├── VerificationResults.jsx  # 3-column transparency panel & report exporter
        │   └── PackagingChecklist.jsx   # 6-point physical verification protocol
        ├── chatbot/
        │   ├── MediBot.jsx              # Floating assistant with speech & language toggles
        │   └── ChatMessage.jsx          # Message bubble with TTS reader & copy feature
        └── common/
            ├── StatusBadge.jsx          # Semantic status pills
            └── DisclaimerAlert.jsx      # Reusable high-contrast safety notice boxes
```

---

## 4. Prerequisites

- **Node.js**: Version `18.0.0` or later (Node 20+ recommended)
- **Package Manager**: `npm` (v9+) or `yarn` / `pnpm`
- **Supported Browsers**: Modern Evergreen browsers (Chrome, Edge, Firefox, Safari).
  - *Camera access* requires HTTPS or `http://localhost`.
  - *Web Speech API* (Speech Recognition) has native support in Chrome, Edge, and Chromium-based browsers; graceful fallbacks are active in other environments.

---

## 5. Installation & Local Development

1. Clone or navigate to the repository:
   ```bash
   git clone https://github.com/archisharma158-cmd/Med-Verify.git
   cd Med-Verify
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Launch the Vite development server:
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:5173`.

4. Run code quality checks:
   ```bash
   npm run lint
   ```

5. Build for production:
   ```bash
   npm run build
   ```
   Preview the production build locally:
   ```bash
   npm run preview
   ```

---

## 6. Scanner Camera Permissions & Troubleshooting

- **Explicit User Action Required**: MediFy adheres strictly to web privacy standards. The camera will **never** activate simply by switching tabs. Camera access is requested only when the user explicitly clicks **"Start Camera Scanner"**.
- **Secure Context (HTTPS)**: Browsers block camera access unless served over `https://` or `localhost`.
- **Camera Selection**: If your device has multiple sensors (front vs rear/environment), a dropdown appears automatically allowing you to select the high-focus macro camera.
- **Image File Fallback**: Users without a working camera can use the **"Upload code screenshot or photo"** dropzone in the same tab, which decodes barcodes directly from image files using `Html5Qrcode.scanFile()`.

---

## 7. OCR Limitations & Best Practices

- **Client-Side Processing**: OCR runs entirely in the browser using WebAssembly workers in `tesseract.js`. No medicine photos are uploaded to external clouds.
- **Image Quality**: Blister foils are reflective and metallic; glare from overhead lights can cause character misreadings. For best results:
  - Take photos in even, indirect lighting.
  - Position the camera perpendicular to the text without steep angles.
- **Editable Extraction**: MediFy makes both the candidate fields (Name, Batch, Expiry) and the raw extracted text **directly editable** in the UI, allowing users to correct any misread letters prior to verification.

---

## 8. How to Connect a Future Official Medicine API

MediFy separates data consumption from presentation through `src/services/medicineService.js`. Currently, it runs in **Reference Framework Mode** using the local standard catalog `src/constants/demoCatalog.js`.

To integrate an authorized government API (e.g. CDSCO SUGAM, US FDA NDC directory, or GS1 Global Registry):
1. Add endpoint credentials to your local `.env`:
   ```env
   VITE_REGULATORY_API_URL=https://api.your-regulator.gov/v1
   VITE_REGULATORY_API_KEY=your_sandbox_api_key
   ```
2. In `src/services/medicineService.js`, update the `evaluateMedicine()` function to query your remote endpoint:
   ```javascript
   export async function evaluateMedicine({ medicineName, batchNumber, ...rest }) {
     if (import.meta.env.VITE_REGULATORY_API_URL) {
       const response = await fetch(`${import.meta.env.VITE_REGULATORY_API_URL}/verify`, {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           'Authorization': `Bearer ${import.meta.env.VITE_REGULATORY_API_KEY}`
         },
         body: JSON.stringify({ name: medicineName, batch: batchNumber })
       });
       const liveData = await response.json();
       // Return live matched monograph
     }
     // Fallback to local demo framework
   }
   ```
No UI components require rewriting when transitioning from demo mode to live API production.

---

## 9. Current Demo Limitations

- **Demo Catalog Scope**: The built-in offline demo database includes representative monographs for common essential medicines (Paracetamol 650mg, Amoxicillin + Clavulanate 625mg, Metformin 500mg SR, Pantoprazole 40mg, Atorvastatin 10mg, Cetirizine 10mg). Unlisted items will display with an "Extracted Only (Unmatched)" status.
- **Mock AI Assistant**: MediBot operates on a safe, rule-based medical safety guidance engine in `src/services/chatbotService.js`. It does not make external calls to third-party LLM providers.

---

## 10. Critical Safety Disclaimer

> **DO NOT RELY ON AUTOMATED SCANS TO PROVE MEDICINE SAFETY.**
> 
> Automated QR/barcode scanning, packaging OCR, and data structure lookups assist in reading packaging details. They **CANNOT** scientifically confirm whether a medicine is genuine, chemically pure, untampered, properly stored, or approved by a regulatory body.
> 
> Sophisticated counterfeiters can duplicate genuine barcodes onto fake packaging. True confirmation requires physical inspection by a licensed pharmacist, checking with the manufacturer, or laboratory testing.
> 
> MediFy and MediBot **do not provide medical diagnosis, prescribe treatments, or suggest dosage changes**. Always consult a registered medical practitioner or licensed pharmacist for medical advice.

---

## 11. Official Emergency Helplines & Reporting

- **India**: National Pharmacovigilance Programme (PvPI) Toll-Free: **1800-180-3024** | [CDSCO Sugam Portal](https://cdsco.gov.in)
- **United States**: FDA MedWatch: **1-800-FDA-1088** | [FDA MedWatch Online](https://www.fda.gov/safety/medwatch)
- **United Kingdom**: MHRA Yellow Card: **0800 731 6789** | [Yellow Card Scheme](https://yellowcard.mhra.gov.uk)
- **European Union**: [European Medicines Agency (EMA)](https://www.ema.europa.eu)
- **Global**: WHO Medical Product Alerts: **rapidalert@who.int**

---

<div align="center">

### 🛡️ Built with patient safety as the highest priority.

**MediFy · Safer Medicines • Healthier India**

</div>
