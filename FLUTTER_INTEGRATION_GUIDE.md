# MedVerify – Flutter Frontend Integration Guide

This guide details how the Flutter mobile application interfaces with the MedVerify FastAPI backend.

---

## 1. Base Configuration

- **Development Base URL (Emulator)**: `http://10.0.2.2:8000` (Android) or `http://localhost:8000` (iOS simulator)
- **Production Base URL**: `https://medverify-backend.onrender.com` (or your deployed domain)
- **Interactive Swagger Documentation**: `http://localhost:8000/docs`

### Authentication Header
Endpoints requiring user identity accept the Supabase Auth JWT token:
```http
Authorization: Bearer <supabase_access_token>
```
*Note: Basic verification (`/api/verify`) works for guest users without an Authorization header.*

---

## 2. API Endpoints Contract

### A. Health Check
- **Endpoint**: `GET /health`
- **Response**:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "services": {
    "database": "connected",
    "gemini_ai": "configured",
    "sarvam_voice": "configured",
    "ocr_space": "configured",
    "openfda": "configured",
    "supabase": "configured"
  }
}
```

---

### B. Barcode / QR Code Decoding
- **Endpoint**: `POST /api/barcode/decode`
- **Content-Type**: `multipart/form-data`
- **Body**: `file: [binary image]`
- **Response**:
```json
{
  "raw_payload": "(01)08901148210356(17)260331(10)DL24089",
  "barcode_type": "DATAMATRIX",
  "gtin": "08901148210356",
  "batch_number": "DL24089",
  "expiry_date": "2026-03-31",
  "serial_number": null,
  "parsed_fields": {
    "gtin": "08901148210356",
    "expiry_date": "260331",
    "batch_number": "DL24089"
  },
  "notes": [],
  "success": true
}
```
*Flutter Action: Extract `gtin`, `batch_number`, and `expiry_date` and pass directly to `POST /api/verify`.*

---

### C. Medicine Packaging OCR
- **Endpoint**: `POST /api/ocr/extract`
- **Content-Type**: `multipart/form-data`
- **Body**: `file: [binary image]`
- **Response**:
```json
{
  "raw_text": "DOLO 650 B.No. DL24089 MFG 03/2024 EXP 02/2027",
  "medicine_name": { "value": "Dolo 650", "confidence": "high", "requires_confirmation": false },
  "batch_number": { "value": "DL24089", "confidence": "high", "requires_confirmation": false },
  "expiry_date": { "value": "2027-02-28", "confidence": "high", "requires_confirmation": false },
  "notes": []
}
```
*Flutter Action: Display fields in confirmation UI with editable text fields so the user can verify OCR results before submission.*

---

### D. Complete Medicine Verification (Core Endpoint)
- **Endpoint**: `POST /api/verify`
- **Content-Type**: `application/json`
- **Request Body**:
```json
{
  "medicine_name": "Dolo 650",
  "manufacturer": "Micro Labs Ltd",
  "batch_number": "DL24089",
  "gtin": "8901148210356",
  "expiry_date": "2027-02-28",
  "input_method": "qr",
  "location_lat": 28.6139,
  "location_lng": 77.2090,
  "location_consent": true
}
```
- **Response**:
```json
{
  "scan_id": "bbf1129a-258c-4a46-893b-7205c137c90a",
  "verification_status": "checks_completed",
  "risk": {
    "score": 0.0,
    "category": "low",
    "method": "rule_based",
    "model_version": "rules-v1",
    "validated_probability": false
  },
  "medicine": {
    "name": "Dolo 650",
    "manufacturer": "Micro Labs Ltd",
    "dosage_form": "Tablet",
    "strength": "650mg"
  },
  "checks": {
    "expiry": "not_expired",
    "manufacturer": "confirmed_match",
    "regulatory_alert": "no_match_in_imported_data",
    "duplicate_scan": "no_anomaly_detected",
    "packaging": "not_checked"
  },
  "warnings": [],
  "explanation": {
    "en": "No significant concerns identified in the available checks.",
    "hi": "उपलब्ध जांच में कोई महत्वपूर्ण चिंता नहीं मिली।"
  },
  "next_steps": [
    "Consult a pharmacist if you have any concerns about this medicine."
  ]
}
```

---

### E. AI Assistant Chatbot (Hindi / English)
- **Endpoint**: `POST /api/chat`
- **Content-Type**: `application/json`
- **Request Body**:
```json
{
  "message": "Is this medicine safe to consume?",
  "language": "hi",
  "scan_id": "bbf1129a-258c-4a46-893b-7205c137c90a"
}
```
- **Response**:
```json
{
  "reply": "नमस्ते! उपलब्ध जांच के अनुसार यह दवाई एक्सपायर नहीं हुई है...",
  "language": "hi",
  "sources": ["scan_result"]
}
```

---

### F. Voice Assistant (Sarvam AI STT & TTS)
#### 1. Speech-to-Text (Voice Search / Query)
- **Endpoint**: `POST /api/voice/transcribe`
- **Content-Type**: `multipart/form-data`
- **Body**: `file: [audio blob]`, `language: "hi-IN"`
- **Response**:
```json
{
  "text": "क्या यह डोलो दवाई असली है?",
  "language": "hi-IN",
  "confidence": 0.94
}
```

#### 2. Text-to-Speech (Audio Answer Playback)
- **Endpoint**: `POST /api/voice/speak`
- **Content-Type**: `application/json`
- **Request Body**:
```json
{
  "text": "उपलब्ध जांच में कोई महत्वपूर्ण चिंता नहीं मिली।",
  "language": "hi-IN",
  "speaker": "meera"
}
```
- **Response**:
```json
{
  "audio_base64": "UklGRi...",
  "format": "wav",
  "language": "hi-IN"
}
```
*Flutter Action: Decode base64 and feed into `audioplayers` or `just_audio` package to play out loud.*

---

### G. Suspicious Medicine Reporting
- **Endpoint**: `POST /api/reports` (JSON) OR `POST /api/reports/multipart` (with photos)
- **Body**:
```json
{
  "medicine_name": "Counterfeit Syrup",
  "manufacturer": "Unknown",
  "batch_number": "SY9901",
  "reason": "suspicious_packaging",
  "description": "Cap seal was broken upon purchase.",
  "contact_info": "+919876543210"
}
```

---

## 3. Recommended Flutter UI State Handling

1. **Risk Score Badge**:
   - `risk.category == 'low'`: Green badge (#2E7D32), "Low Concern / कम चिंता"
   - `risk.category == 'medium'`: Amber badge (#ED6C02), "Caution Advised / सावधानी जरूरी"
   - `risk.category == 'high'`: Red badge (#D32F2F), "High Concern / उच्च चिंता"

2. **Mandatory Disclaimer Banner**:
   - Always display in app: *"MedVerify is a screening and public awareness tool. Never stop or start medication without consulting a certified doctor or pharmacist."*

3. **Offline Mode**:
   - When network connection drops, cache scanned records locally via `hive` or `sqflite`.
   - Sync scans with `POST /api/verify` when connectivity resumes.
