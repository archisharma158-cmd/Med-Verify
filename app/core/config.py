"""
MedVerify – Smart Medicine Verification System
Core configuration module using Pydantic Settings.
"""
from __future__ import annotations

import os
from functools import lru_cache
from typing import Optional

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=True,
    )

    # ── Application ──
    APP_NAME: str = "MedVerify"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = Field(default="development", description="development | staging | production")
    LOG_LEVEL: str = "INFO"
    SECRET_KEY: str = Field(
        default="medverify-dev-secret-change-in-production",
        description="Application-level secret for signing tokens",
    )
    ALLOWED_ORIGINS: str = Field(
        default="http://localhost:3000,http://localhost:8080",
        description="Comma-separated list of allowed CORS origins",
    )
    PORT: int = Field(default=8000, description="Server port (Render sets this)")

    # ── Supabase ──
    SUPABASE_URL: str
    SUPABASE_SECRET_KEY: str
    SUPABASE_JWT_SECRET: Optional[str] = Field(
        default=None,
        description="JWT secret for verifying Supabase access tokens",
    )

    # ── External API Keys ──
    SARVAM_API_KEY: Optional[str] = None
    OCR_SPACE_API_KEY: Optional[str] = None
    OPENFDA_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None

    # ── Database ──
    DATABASE_URL: Optional[str] = Field(
        default=None,
        description="Direct PostgreSQL connection string (overrides Supabase-derived URL)",
    )

    # ── Upload Limits ──
    MAX_UPLOAD_SIZE_MB: int = 10
    MAX_AUDIO_SIZE_MB: int = 5

    # ── Rate Limits ──
    RATE_LIMIT_DEFAULT: str = "60/minute"
    RATE_LIMIT_GUEST: str = "20/minute"
    RATE_LIMIT_VERIFY: str = "30/minute"

    # ── Risk Scoring ──
    RISK_MODEL_PATH: Optional[str] = None
    RISK_MODEL_VERSION: str = "rules-v1"

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",") if o.strip()]

    @property
    def max_upload_bytes(self) -> int:
        return self.MAX_UPLOAD_SIZE_MB * 1024 * 1024

    @property
    def max_audio_bytes(self) -> int:
        return self.MAX_AUDIO_SIZE_MB * 1024 * 1024

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"

    def get_database_url(self) -> str:
        """Derive async PostgreSQL URL from Supabase or explicit DATABASE_URL."""
        if self.DATABASE_URL:
            url = self.DATABASE_URL
        else:
            # Derive from Supabase URL
            # Supabase URL format: https://<project>.supabase.co
            project_ref = self.SUPABASE_URL.replace("https://", "").replace(".supabase.co", "")
            url = (
                f"postgresql+asyncpg://postgres.{project_ref}:"
                f"{self.SUPABASE_SECRET_KEY}@aws-0-ap-south-1.pooler.supabase.com:6543/postgres"
            )
        # Ensure async driver
        if url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        return url

    def check_service_available(self, service: str) -> bool:
        """Check if an optional service has its required credentials."""
        mapping = {
            "sarvam": self.SARVAM_API_KEY,
            "ocr": self.OCR_SPACE_API_KEY,
            "openfda": self.OPENFDA_API_KEY,
            "gemini": self.GEMINI_API_KEY,
        }
        val = mapping.get(service)
        return val is not None and len(val.strip()) > 0


@lru_cache()
def get_settings() -> Settings:
    """Cached singleton for application settings."""
    return Settings()
