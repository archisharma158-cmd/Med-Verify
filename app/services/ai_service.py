"""Shared AI orchestration service for multi-provider chatbot support (Gemini & OpenAI)."""
from __future__ import annotations

from typing import Optional

from app.core.config import get_settings
from app.core.logging import get_logger
from app.services.gemini_service import chat_with_context as chat_with_gemini
from app.services.openai_service import chat_with_openai

logger = get_logger("ai_service")


async def generate_chat_response(
    message: str,
    language: str = "en",
    scan_context: Optional[dict] = None,
) -> dict:
    """Generate AI response with multi-provider fallback.

    Primary provider defaults to `settings.AI_PRIMARY_PROVIDER` ("gemini" or "openai").
    If primary provider fails or is unavailable, automatically falls back to secondary provider.
    If both fail, returns a user-friendly error response without pretending a fallback is an AI answer.
    """
    settings = get_settings()
    primary = (settings.AI_PRIMARY_PROVIDER or "gemini").strip().lower()

    if primary == "openai":
        first_provider, first_func = "openai", chat_with_openai
        second_provider, second_func = "gemini", chat_with_gemini
    else:
        first_provider, first_func = "gemini", chat_with_gemini
        second_provider, second_func = "openai", chat_with_openai

    logger.info("ai_chat_request_start", primary_provider=first_provider)

    # 1. Attempt Primary Provider
    res = await first_func(message=message, language=language, scan_context=scan_context)
    if res.get("provider") == first_provider:
        logger.info("ai_chat_primary_success", provider=first_provider)
        return res

    # Primary failed! Log warning and attempt Fallback Provider
    first_sources = res.get("sources", [])
    logger.warning(
        "primary_ai_provider_failed_triggering_fallback",
        primary_provider=first_provider,
        fallback_provider=second_provider,
        error_sources=first_sources,
    )

    # 2. Attempt Secondary Provider
    res_second = await second_func(message=message, language=language, scan_context=scan_context)
    if res_second.get("provider") == second_provider:
        logger.info("ai_chat_fallback_success", provider=second_provider)
        return res_second

    # 3. Both Providers Failed!
    second_sources = res_second.get("sources", [])
    logger.error(
        "all_ai_providers_failed",
        primary_sources=first_sources,
        secondary_sources=second_sources,
    )

    user_error_reply = (
        "सभी AI सहायक वर्तमान में अनुपलब्ध हैं। कृपया बाद में प्रयास करें या फार्मासिस्ट से संपर्क करें।"
        if language == "hi"
        else "All AI assistants are currently unavailable. Please try again later or consult a pharmacist."
    )

    return {
        "reply": user_error_reply,
        "language": language,
        "sources": ["error:all_providers_failed"],
        "provider": "none",
    }
