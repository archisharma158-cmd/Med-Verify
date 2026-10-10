"""OpenAI AI chatbot integration service."""
from __future__ import annotations

import json
from typing import Any, Optional

from app.core.config import get_settings
from app.core.logging import get_logger

logger = get_logger("openai_service")

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


async def chat_with_openai(
    message: str,
    language: str = "en",
    scan_context: Optional[dict] = None,
) -> dict:
    """Generate chatbot response using OpenAI with scan context.

    Returns: {"reply": str, "language": str, "sources": list[str], "provider": str}
    """
    settings = get_settings()

    # 1. Check API Key presence
    if not settings.check_service_available("openai"):
        logger.warning(
            "openai_api_key_missing",
            diagnostics="OPENAI_API_KEY environment variable is missing or empty",
        )
        return _fallback_response(
            message, language, scan_context, error_reason="MISSING_API_KEY"
        )

    # 2. Check SDK installation
    try:
        import openai
    except ImportError:
        logger.error(
            "openai_sdk_not_installed",
            diagnostics="openai library is not installed in Python environment",
        )
        return _fallback_response(
            message, language, scan_context, error_reason="SDK_NOT_INSTALLED"
        )

    # Build prompt and context
    system_instruction = HINDI_SYSTEM_PROMPT if language == "hi" else SYSTEM_PROMPT
    sources: list[str] = ["openai_ai"]

    user_content = message
    if scan_context:
        context_str = json.dumps(scan_context, indent=2, ensure_ascii=False, default=str)
        user_content = f"Scan Result Context:\n{context_str}\n\nUser Question ({language}): {message}"
        sources.append("scan_result")

    messages = [
        {"role": "system", "content": system_instruction},
        {"role": "user", "content": user_content},
    ]

    try:
        client = openai.OpenAI(
            api_key=settings.OPENAI_API_KEY,
            timeout=15.0,
            max_retries=1,
        )

        response = client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=messages,
            max_tokens=500,
            temperature=0.3,
        )

        reply = (
            response.choices[0].message.content
            if response.choices and response.choices[0].message.content
            else (
                "मुझे प्रतिक्रिया उत्पन्न करने में असमर्थता हुई। कृपया पुनः प्रयास करें।"
                if language == "hi"
                else "I couldn't generate a response. Please try again."
            )
        )

        logger.info(
            "openai_chat_completed",
            model=settings.OPENAI_MODEL,
            language=language,
            has_scan_context=bool(scan_context),
        )

        return {
            "reply": reply,
            "language": language,
            "sources": sources,
            "provider": "openai",
        }

    except openai.AuthenticationError as e:
        logger.error(
            "openai_auth_failed",
            status_code=401,
            diagnostics="Invalid or unauthorized OpenAI API key",
            error=str(e),
        )
        return _fallback_response(
            message, language, scan_context, error_reason="INVALID_API_KEY"
        )
    except openai.RateLimitError as e:
        logger.error(
            "openai_quota_exceeded",
            status_code=429,
            diagnostics="OpenAI credit balance exhausted or rate limit exceeded",
            error=str(e),
        )
        return _fallback_response(
            message, language, scan_context, error_reason="QUOTA_EXCEEDED"
        )
    except openai.NotFoundError as e:
        logger.error(
            "openai_model_unavailable",
            model=settings.OPENAI_MODEL,
            diagnostics=f"Model {settings.OPENAI_MODEL} not found or unavailable",
            error=str(e),
        )
        return _fallback_response(
            message, language, scan_context, error_reason="MODEL_UNAVAILABLE"
        )
    except (openai.APIConnectionError, openai.APITimeoutError) as e:
        logger.error(
            "openai_network_error",
            error_type=type(e).__name__,
            diagnostics="Network connection or timeout failure reaching OpenAI API",
            error=str(e),
        )
        return _fallback_response(
            message, language, scan_context, error_reason="NETWORK_FAILURE"
        )
    except Exception as e:
        logger.error(
            "openai_chat_error",
            model=settings.OPENAI_MODEL,
            error_type=type(e).__name__,
            error=str(e),
        )
        return _fallback_response(
            message, language, scan_context, error_reason=type(e).__name__
        )


def _fallback_response(
    message: str,
    language: str,
    scan_context: Optional[dict] = None,
    error_reason: str = "SERVICE_UNAVAILABLE",
) -> dict:
    """Generate a fallback dictionary when OpenAI is unavailable."""
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
        "sources": [f"fallback:openai_{error_reason.lower()}"],
        "provider": "none",
    }
