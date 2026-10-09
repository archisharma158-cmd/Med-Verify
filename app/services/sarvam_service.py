"""Sarvam AI Hindi voice assistant service."""
from __future__ import annotations

import base64
from typing import Optional

import httpx

from app.core.config import get_settings
from app.core.exceptions import ExternalServiceError
from app.core.logging import get_logger

logger = get_logger("sarvam_service")

SARVAM_BASE_URL = "https://api.sarvam.ai"


def _get_headers() -> dict:
    settings = get_settings()
    return {
        "api-subscription-key": settings.SARVAM_API_KEY or "",
        "Content-Type": "application/json",
    }


async def speech_to_text(
    audio_bytes: bytes,
    language: str = "hi-IN",
) -> dict:
    """Transcribe speech audio to text using Sarvam STT.
    
    Returns: {"text": str, "language": str, "confidence": float|None}
    """
    settings = get_settings()
    if not settings.check_service_available("sarvam"):
        raise ExternalServiceError("sarvam", "Sarvam API key not configured")

    try:
        audio_b64 = base64.b64encode(audio_bytes).decode("utf-8")

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{SARVAM_BASE_URL}/speech-to-text",
                headers=_get_headers(),
                json={
                    "input": audio_b64,
                    "language_code": language,
                    "model": "saarika:v2",
                    "with_timestamps": False,
                },
            )
            response.raise_for_status()
            result = response.json()

        transcript = result.get("transcript", "")
        logger.info("stt_completed", language=language, text_length=len(transcript))

        return {
            "text": transcript,
            "language": language,
            "confidence": result.get("confidence"),
        }

    except httpx.TimeoutException:
        logger.error("sarvam_stt_timeout")
        raise ExternalServiceError("sarvam", "Speech-to-text timed out")
    except httpx.HTTPStatusError as e:
        logger.error("sarvam_stt_error", status=e.response.status_code)
        raise ExternalServiceError("sarvam", f"Speech-to-text failed: {e.response.status_code}")
    except Exception as e:
        logger.error("sarvam_stt_error", error=str(e))
        raise ExternalServiceError("sarvam", "Speech-to-text unavailable")


async def text_to_speech(
    text: str,
    language: str = "hi-IN",
    speaker: str = "meera",
) -> dict:
    """Convert text to speech using Sarvam TTS.
    
    Returns: {"audio_base64": str, "format": str, "language": str}
    """
    settings = get_settings()
    if not settings.check_service_available("sarvam"):
        raise ExternalServiceError("sarvam", "Sarvam API key not configured")

    try:
        # Truncate long text for TTS
        if len(text) > 500:
            text = text[:497] + "..."

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{SARVAM_BASE_URL}/text-to-speech",
                headers=_get_headers(),
                json={
                    "inputs": [text],
                    "target_language_code": language,
                    "speaker": speaker,
                    "model": "bulbul:v1",
                },
            )
            response.raise_for_status()
            result = response.json()

        audios = result.get("audios", [])
        if not audios:
            raise ExternalServiceError("sarvam", "No audio generated")

        logger.info("tts_completed", language=language)

        return {
            "audio_base64": audios[0],
            "format": "wav",
            "language": language,
        }

    except httpx.TimeoutException:
        logger.error("sarvam_tts_timeout")
        raise ExternalServiceError("sarvam", "Text-to-speech timed out")
    except httpx.HTTPStatusError as e:
        logger.error("sarvam_tts_error", status=e.response.status_code)
        raise ExternalServiceError("sarvam", f"Text-to-speech failed: {e.response.status_code}")
    except ExternalServiceError:
        raise
    except Exception as e:
        logger.error("sarvam_tts_error", error=str(e))
        raise ExternalServiceError("sarvam", "Text-to-speech unavailable")


async def translate_text(
    text: str,
    source_language: str = "en-IN",
    target_language: str = "hi-IN",
) -> str:
    """Translate text between English and Hindi using Sarvam.
    
    Returns translated text string.
    """
    settings = get_settings()
    if not settings.check_service_available("sarvam"):
        return text  # Fallback: return original text

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                f"{SARVAM_BASE_URL}/translate",
                headers=_get_headers(),
                json={
                    "input": text,
                    "source_language_code": source_language,
                    "target_language_code": target_language,
                    "model": "mayura:v1",
                    "enable_preprocessing": True,
                },
            )
            response.raise_for_status()
            result = response.json()

        translated = result.get("translated_text", text)
        logger.info("translation_completed", src=source_language, tgt=target_language)
        return translated

    except Exception as e:
        logger.warning("sarvam_translate_error", error=str(e))
        return text  # Graceful fallback
