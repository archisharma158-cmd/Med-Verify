"""Gemini AI chatbot integration service."""
from __future__ import annotations

import json
from typing import Any, Optional

from app.core.config import get_settings
from app.core.exceptions import ExternalServiceError
from app.core.logging import get_logger

logger = get_logger("gemini_service")

# System prompt with medical safety guardrails
SYSTEM_PROMPT = """You are MedVerify Assistant, a helpful chatbot for the MedVerify medicine verification system.
Your role is to help users understand their medicine verification results in simple language.

STRICT RULES:
1. You are a screening assistant, NOT a medical professional.
2. NEVER invent product records, manufacturing details, or medicine data.
3. NEVER claim a medicine is definitely genuine or definitely counterfeit.
4. NEVER prescribe doses, recommend starting/stopping medication, or provide medical advice.
5. NEVER override or contradict deterministic expiry date or regulatory alert findings.
6. When information is unavailable, explicitly state what is unknown.
7. Always recommend consulting a pharmacist or doctor for medical decisions.
8. For Hindi responses, use simple, conversational Hindi understandable by rural users.
9. Keep responses concise (under 200 words) and easy to understand.
10. If asked about something outside medicine verification, politely redirect.

You will receive the user's verified scan results as context. Use ONLY this verified data in your responses.
Do not fabricate additional information."""

HINDI_SYSTEM_PROMPT = """आप MedVerify सहायक हैं, दवाई जांच प्रणाली के लिए एक मददगार चैटबॉट।
आपका काम उपयोगकर्ताओं को उनकी दवाई जांच के परिणाम सरल भाषा में समझाना है।

सख्त नियम:
1. आप एक जांच सहायक हैं, डॉक्टर या फार्मासिस्ट नहीं।
2. कभी भी दवाई की जानकारी न बनाएं।
3. कभी भी दवाई को पूरी तरह असली या नकली न बताएं।
4. दवाई खाने या बंद करने की सलाह न दें।
5. जो जानकारी उपलब्ध नहीं है, उसके बारे में स्पष्ट कहें।
6. हमेशा फार्मासिस्ट या डॉक्टर से मिलने की सलाह दें।
7. सरल हिंदी में जवाब दें।"""

FALLBACK_CANDIDATE_MODELS = [
    "gemini-3.8-flash",
    "gemini-3.5-flash",
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-flash-latest",
]


async def chat_with_context(
    message: str,
    language: str = "en",
    scan_context: Optional[dict] = None,
) -> dict:
    """Generate chatbot response using Gemini with scan context.
    
    Returns: {"reply": str, "language": str, "sources": list[str]}
    """
    settings = get_settings()

    # 1. Check API Key presence
    if not settings.check_service_available("gemini"):
        logger.warning(
            "gemini_api_key_missing",
            diagnostics="GEMINI_API_KEY environment variable is missing or empty",
        )
        return _fallback_response(
            message, language, scan_context, error_reason="MISSING_API_KEY"
        )

    # 2. Check SDK installation
    try:
        from google import genai
        from google.genai import errors
    except ImportError:
        logger.error(
            "gemini_sdk_not_installed",
            diagnostics="google-genai library is not installed in Python environment",
        )
        return _fallback_response(
            message, language, scan_context, error_reason="SDK_NOT_INSTALLED"
        )

    # Build prompt and context
    system = HINDI_SYSTEM_PROMPT if language == "hi" else SYSTEM_PROMPT
    context_text = ""
    sources: list[str] = ["gemini_ai"]

    if scan_context:
        context_text = (
            f"\n\nUser's latest scan result:\n"
            f"{json.dumps(scan_context, indent=2, ensure_ascii=False, default=str)}"
        )
        sources.append("scan_result")

    prompt = f"{system}\n{context_text}\n\nUser message ({language}): {message}"

    try:
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
    except Exception as e:
        logger.error("gemini_client_init_failed", error=str(e))
        return _fallback_response(
            message, language, scan_context, error_reason="CLIENT_INIT_FAILED"
        )

    # Candidate models to try (configured model first, then fallbacks)
    models_to_try = [settings.GEMINI_MODEL]
    for model_candidate in FALLBACK_CANDIDATE_MODELS:
        if model_candidate not in models_to_try:
            models_to_try.append(model_candidate)

    last_error_reason = "UNKNOWN"
    for model in models_to_try:
        try:
            response = client.models.generate_content(
                model=model,
                contents=prompt,
                config={
                    "max_output_tokens": 500,
                    "temperature": 0.3,
                },
            )

            reply = (
                response.text
                if response.text
                else (
                    "मुझे प्रतिक्रिया उत्पन्न करने में असमर्थता हुई। कृपया पुनः प्रयास करें।"
                    if language == "hi"
                    else "I couldn't generate a response. Please try again."
                )
            )

            logger.info(
                "gemini_chat_completed",
                model=model,
                language=language,
                has_scan_context=bool(scan_context),
            )

            return {
                "reply": reply,
                "language": language,
                "sources": sources,
                "provider": "gemini",
            }

        except errors.APIError as e:
            code = getattr(e, "code", None)
            err_msg = getattr(e, "message", str(e))

            if code in (401, 403) or "API_KEY_INVALID" in err_msg or "API key not valid" in err_msg:
                logger.error(
                    "gemini_auth_failed",
                    status_code=code,
                    diagnostics="Invalid or unauthorized Gemini API key",
                )
                return _fallback_response(
                    message, language, scan_context, error_reason="INVALID_API_KEY"
                )
            elif code == 429 or "RESOURCE_EXHAUSTED" in err_msg or "quota" in err_msg.lower():
                logger.error(
                    "gemini_quota_exceeded",
                    status_code=code,
                    diagnostics="Gemini API rate limit or quota exceeded",
                )
                return _fallback_response(
                    message, language, scan_context, error_reason="QUOTA_EXCEEDED"
                )
            elif code == 404 or "not found" in err_msg.lower() or "no longer available" in err_msg.lower():
                logger.warning(
                    "gemini_model_unavailable",
                    model=model,
                    status_code=code,
                    diagnostics=f"Model {model} unavailable, trying next candidate",
                )
                last_error_reason = "MODEL_UNAVAILABLE"
                continue
            else:
                logger.error(
                    "gemini_api_error",
                    model=model,
                    status_code=code,
                    error=err_msg,
                )
                last_error_reason = f"API_ERROR_{code}"
                continue

        except (OSError, ConnectionError) as e:
            logger.error(
                "gemini_network_error",
                error_type=type(e).__name__,
                diagnostics="Network failure connecting to Gemini API endpoint",
            )
            return _fallback_response(
                message, language, scan_context, error_reason="NETWORK_FAILURE"
            )
        except Exception as e:
            logger.error(
                "gemini_chat_error",
                model=model,
                error_type=type(e).__name__,
                error=str(e),
            )
            last_error_reason = type(e).__name__
            continue

    return _fallback_response(
        message, language, scan_context, error_reason=last_error_reason
    )


def _fallback_response(
    message: str,
    language: str,
    scan_context: Optional[dict] = None,
    error_reason: str = "SERVICE_UNAVAILABLE",
) -> dict:
    """Generate a basic response when Gemini is unavailable."""
    if language == "hi":
        if scan_context:
            status = scan_context.get("verification_status", "unknown")
            risk_cat = scan_context.get("risk", {}).get("category", "unknown")
            reply = (
                f"आपकी दवाई की जांच हो चुकी है। "
                f"जांच की स्थिति: {status}। "
                f"जोखिम श्रेणी: {risk_cat}। "
                f"अधिक जानकारी के लिए कृपया अपने फार्मासिस्ट से संपर्क करें।"
            )
        else:
            reply = (
                "AI सहायक अभी उपलब्ध नहीं है। "
                "कृपया अपनी दवाई की जांच करें या फार्मासिस्ट से बात करें।"
            )
    else:
        if scan_context:
            status = scan_context.get("verification_status", "unknown")
            risk_cat = scan_context.get("risk", {}).get("category", "unknown")
            reply = (
                f"Your medicine verification is complete. "
                f"Status: {status}. "
                f"Risk category: {risk_cat}. "
                f"Please consult your pharmacist for any concerns."
            )
        else:
            reply = (
                "AI assistant is currently unavailable. "
                "Please verify your medicine or consult a pharmacist."
            )

    return {
        "reply": reply,
        "language": language,
        "sources": [f"fallback:{error_reason.lower()}"],
        "provider": "none",
    }
