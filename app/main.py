"""
MedVerify – Smart Medicine Verification System
FastAPI Main Application Entry Point
"""
from __future__ import annotations

import time
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, HTTPException, Request, Response, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.api.admin import router as admin_router
from app.api.alerts import router as alerts_router
from app.api.auth import router as auth_router
from app.api.barcode import router as barcode_router
from app.api.chat import router as chat_router
from app.api.health import router as health_router
from app.api.history import router as history_router
from app.api.medicines import router as medicines_router
from app.api.ocr import router as ocr_router
from app.api.packaging import router as packaging_router
from app.api.reports import router as reports_router
from app.api.verify import router as verify_router
from app.api.voice import router as voice_router
from app.core.config import get_settings
from app.core.exceptions import MedVerifyException, register_exception_handlers
from app.core.logging import generate_correlation_id, get_logger, setup_logging
from app.database import close_db, init_db

# ── Rate Limiter ──
limiter = Limiter(key_func=get_remote_address, default_limits=["120/minute"])


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan manager: runs startup and shutdown tasks."""
    settings = get_settings()
    setup_logging(settings.LOG_LEVEL)
    logger = get_logger("lifespan")
    logger.info(
        "app_startup",
        app_name=settings.APP_NAME,
        version=settings.APP_VERSION,
        environment=settings.ENVIRONMENT,
    )

    # Initialize tables on startup if in dev/local
    try:
        await init_db()
        logger.info("database_initialized")
    except Exception as e:
        logger.warning("database_init_warning", error=str(e), note="Proceeding; tables may already exist or require migrations")

    # Log service status
    for svc in ("gemini", "sarvam", "ocr", "openfda"):
        avail = settings.check_service_available(svc)
        logger.info("service_status", service=svc, available=avail)

    yield

    # Shutdown
    logger.info("app_shutdown")
    await close_db()


def create_application() -> FastAPI:
    """FastAPI application factory."""
    settings = get_settings()

    app = FastAPI(
        title=f"{settings.APP_NAME} API",
        version=settings.APP_VERSION,
        description=(
            "Backend API for MedVerify – Smart Medicine Verification System. "
            "Assists users in rural and urban India in verifying medicine packaging, "
            "expiry dates, barcodes, OCR text, CDSCO regulatory alerts, and reporting suspicious drugs."
        ),
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )

    # Rate Limiting
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    # ── CORS Middleware ──
    origins = settings.cors_origins
    if not settings.is_production and "*" not in origins:
        origins.append("*")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins if "*" not in origins else ["*"],
        allow_credentials=True if "*" not in origins else False,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Correlation ID & Timing Middleware ──
    @app.middleware("http")
    async def add_correlation_and_timing(request: Request, call_next):
        start_time = time.time()
        correlation_id = request.headers.get("X-Correlation-ID") or generate_correlation_id()
        request.state.correlation_id = correlation_id

        response: Response = await call_next(request)

        process_time = round((time.time() - start_time) * 1000, 2)
        response.headers["X-Correlation-ID"] = correlation_id
        response.headers["X-Response-Time-Ms"] = str(process_time)
        return response

    # ── Exception Handlers ──
    register_exception_handlers(app)

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "error": "VALIDATION_ERROR",
                "message": "Input validation failed",
                "detail": exc.errors(),
                "correlation_id": getattr(request.state, "correlation_id", None),
            },
        )

    @app.exception_handler(Exception)
    async def global_unhandled_exception_handler(request: Request, exc: Exception):
        logger = get_logger("exception_handler")
        logger.error(
            "unhandled_exception",
            path=str(request.url.path),
            method=request.method,
            error=str(exc),
            exc_info=True,
        )
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred. Please try again later.",
                "correlation_id": getattr(request.state, "correlation_id", None),
            },
        )

    # ── Root Welcome Endpoint ──
    @app.get("/", tags=["Root"])
    async def root():
        return {
            "name": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "status": "operational",
            "docs": "/docs",
            "disclaimer": (
                "MedVerify is a screening and public awareness tool. "
                "It does not guarantee medicine authenticity or provide medical advice. "
                "Always consult qualified healthcare professionals."
            ),
        }

    # ── Include Routers ──
    app.include_router(health_router)
    app.include_router(auth_router)
    app.include_router(verify_router)
    app.include_router(barcode_router)
    app.include_router(ocr_router)
    app.include_router(medicines_router)
    app.include_router(reports_router)
    app.include_router(history_router)
    app.include_router(chat_router)
    app.include_router(voice_router)
    app.include_router(alerts_router)
    app.include_router(packaging_router)
    app.include_router(admin_router)

    return app


app = create_application()
