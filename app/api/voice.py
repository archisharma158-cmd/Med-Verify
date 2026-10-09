"""Voice integration routes using Sarvam AI for Hindi STT, TTS, and translation."""
from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, File, Form, UploadFile
from pydantic import BaseModel, Field

from app.core.config import get_settings
from app.core.exceptions import BadRequestError, FileTooLargeError
from app.core.logging import get_logger
from app.schemas.schemas import SpeakResponse, VoiceTranscribeResponse
from app.services.sarvam_service import speech_to_text, text_to_speech, translate_text

logger = get_logger("voice_routes")
router = APIRouter(prefix="/api/voice", tags=["Voice Assistant"])

ALLOWED_AUDIO_TYPES = {
    "audio/wav",
    "audio/x-wav",
    "audio/mpeg",
    "audio/mp3",
    "audio/ogg",
    "audio/webm",
    "audio/m4a",
    "audio/x-m4a",
    "audio/flac",
    "application/octet-stream",
}


class SpeakRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=1000)
    language: str = Field(default="hi-IN", description="Language code e.g. hi-IN")
    speaker: str = Field(default="meera", description="Voice speaker name e.g. meera, pavithra, etc.")


class TranslateRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=2000)
    source_language: str = Field(default="en-IN")
    target_language: str = Field(default="hi-IN")


@router.post("/transcribe", response_model=VoiceTranscribeResponse)
async def transcribe_audio(
    file: UploadFile = File(..., description="Audio recording of spoken medicine question"),
    language: str = Form("hi-IN", description="Target audio language (default hi-IN)"),
):
    """Transcribe spoken Hindi/English question into text.
    
    Accepts audio recordings from mobile or web microphones and converts
    speech to text using Sarvam Saarika model.
    """
    settings = get_settings()

    if file.content_type and file.content_type not in ALLOWED_AUDIO_TYPES:
        logger.warning("unsupported_audio_type", content_type=file.content_type)
        # Proceed with warning for broad client audio compatibility

    audio_bytes = await file.read()
    if not audio_bytes:
        raise BadRequestError("Uploaded audio file is empty")

    if len(audio_bytes) > settings.max_audio_bytes:
        raise FileTooLargeError(settings.MAX_AUDIO_SIZE_MB)

    result = await speech_to_text(audio_bytes, language=language)
    return VoiceTranscribeResponse(
        text=result.get("text", ""),
        language=result.get("language", language),
        confidence=result.get("confidence"),
    )


@router.post("/speak", response_model=SpeakResponse)
async def synthesize_speech(body: SpeakRequest):
    """Synthesize text into natural spoken Hindi audio (TTS).
    
    Converts verification results or assistant explanations into clear
    audio for low-literacy or visually impaired users.
    """
    result = await text_to_speech(
        text=body.text,
        language=body.language,
        speaker=body.speaker,
    )
    return SpeakResponse(
        audio_base64=result.get("audio_base64", ""),
        format=result.get("format", "wav"),
        language=result.get("language", body.language),
    )


@router.post("/translate")
async def translate(body: TranslateRequest):
    """Translate text between English and Hindi using Sarvam Mayura model."""
    translated = await translate_text(
        text=body.text,
        source_language=body.source_language,
        target_language=body.target_language,
    )
    return {
        "original": body.text,
        "translated": translated,
        "source_language": body.source_language,
        "target_language": body.target_language,
    }
