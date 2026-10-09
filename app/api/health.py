"""Health check endpoint monitoring system services and dependencies."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.logging import get_logger
from app.database import get_db
from app.schemas.schemas import HealthResponse

logger = get_logger("health_routes")
router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse)
@router.get("/api/health", response_model=HealthResponse)
async def health_check(db: AsyncSession = Depends(get_db)):
    """Health check endpoint providing real-time status of backend services."""
    settings = get_settings()
    services: dict[str, str] = {}

    # 1. Database check
    try:
        await db.execute(text("SELECT 1"))
        services["database"] = "connected"
    except Exception as e:
        logger.warning("database_health_check_failed", error=str(e))
        services["database"] = "disconnected"

    # 2. External API configurations
    services["gemini_ai"] = "configured" if settings.check_service_available("gemini") else "unconfigured"
    services["sarvam_voice"] = "configured" if settings.check_service_available("sarvam") else "unconfigured"
    services["ocr_space"] = "configured" if settings.check_service_available("ocr") else "unconfigured"
    services["openfda"] = "configured" if settings.check_service_available("openfda") else "unconfigured"
    services["supabase"] = "configured" if settings.SUPABASE_URL and settings.SUPABASE_SECRET_KEY else "unconfigured"

    is_healthy = services.get("database") == "connected"
    status_str = "healthy" if is_healthy else "degraded"

    return HealthResponse(
        status=status_str,
        version=settings.APP_VERSION,
        services=services,
    )
