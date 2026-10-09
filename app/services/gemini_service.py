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


async def chat_with_context(
    message: str,
    language: str = "en",
    scan_context: Optional[dict] = None,
) -> dict:
    """Generate chatbot response using Gemini with scan context.
    
    Returns: {"reply": str, "language": str, "sources": list[str]}
    """
    settings = get_settings()
    if not settings.check_service_available("gemini"):
        # Fallback response when Gemini is unavailable
        return _fallback_response(message, language, scan_context)

    try:
        from google import genai

        client = genai.Client(api_key=settings.GEMINI_API_KEY)

        # Build context
        system = HINDI_SYSTEM_PROMPT if language == "hi" else SYSTEM_PROMPT
        context_text = ""
        sources: list[str] = []

        if scan_context:
            context_text = f"\n\nUser's latest scan result:\n{json.dumps(scan_context, indent=2, ensure_ascii=False, default=str)}"
            sources.append("scan_result")

        prompt = f"{system}\n{context_text}\n\nUser message ({language}): {message}"

        # Call Gemini
        response = client.models.generate_content(
            model="gemini-3.8-flash",
            contents=prompt,
            config={
                "max_output_tokens": 500,
                "temperature": 0.3,
            },
        )

        reply = response.text if response.text else "I couldn't generate a response. Please try again."

        logger.info("gemini_chat_completed", language=language)

        return {
            "reply": reply,
            "language": language,
            "sources": sources,
        }

    except ImportError:
        logger.error("gemini_sdk_not_installed")
        return _fallback_response(message, language, scan_context)
    except Exception as e:
        logger.error("gemini_chat_error", error=str(e))
        return _fallback_response(message, language, scan_context)


def _fallback_response(
    message: str,
    language: str,
    scan_context: Optional[dict] = None,
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
        "sources": ["fallback"],
    }
