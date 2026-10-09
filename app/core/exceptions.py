"""Centralized exception definitions and handlers."""
from __future__ import annotations

from typing import Any

from fastapi import FastAPI, Request, status
from fastapi.responses import ORJSONResponse

from app.core.logging import get_logger

logger = get_logger("exceptions")


# ── Custom Exception Classes ──

class MedVerifyException(Exception):
    """Base exception for MedVerify."""

    def __init__(
        self,
        message: str = "An error occurred",
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail: Any = None,
    ):
        self.message = message
        self.status_code = status_code
        self.detail = detail
        super().__init__(message)


class BadRequestError(MedVerifyException):
    def __init__(self, message: str = "Bad request", detail: Any = None):
        super().__init__(message, status.HTTP_400_BAD_REQUEST, detail)


class UnauthorizedError(MedVerifyException):
    def __init__(self, message: str = "Authentication required"):
        super().__init__(message, status.HTTP_401_UNAUTHORIZED)


class ForbiddenError(MedVerifyException):
    def __init__(self, message: str = "Insufficient permissions"):
        super().__init__(message, status.HTTP_403_FORBIDDEN)


class NotFoundError(MedVerifyException):
    def __init__(self, message: str = "Resource not found"):
        super().__init__(message, status.HTTP_404_NOT_FOUND)


class ConflictError(MedVerifyException):
    def __init__(self, message: str = "Resource conflict"):
        super().__init__(message, status.HTTP_409_CONFLICT)


class RateLimitError(MedVerifyException):
    def __init__(self, message: str = "Rate limit exceeded"):
        super().__init__(message, status.HTTP_429_TOO_MANY_REQUESTS)


class ExternalServiceError(MedVerifyException):
    """Raised when an external API (OCR, Gemini, Sarvam, openFDA) fails."""

    def __init__(self, service: str, message: str = "External service unavailable"):
        self.service = service
        super().__init__(f"{service}: {message}", status.HTTP_502_BAD_GATEWAY)


class ValidationError(MedVerifyException):
    def __init__(self, message: str = "Validation failed", detail: Any = None):
        super().__init__(message, status.HTTP_422_UNPROCESSABLE_ENTITY, detail)


class FileTooLargeError(MedVerifyException):
    def __init__(self, max_mb: int):
        super().__init__(
            f"File size exceeds {max_mb}MB limit",
            status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
        )


# ── Exception Handlers ──

def _error_response(
    correlation_id: str | None,
    status_code: int,
    message: str,
    detail: Any = None,
) -> ORJSONResponse:
    body: dict[str, Any] = {
        "error": True,
        "message": message,
        "status_code": status_code,
    }
    if correlation_id:
        body["correlation_id"] = correlation_id
    if detail is not None:
        body["detail"] = detail
    return ORJSONResponse(status_code=status_code, content=body)


async def medverify_exception_handler(request: Request, exc: MedVerifyException) -> ORJSONResponse:
    cid = getattr(request.state, "correlation_id", None)
    logger.warning(
        "handled_exception",
        correlation_id=cid,
        error=exc.message,
        status_code=exc.status_code,
        path=str(request.url.path),
    )
    return _error_response(cid, exc.status_code, exc.message, exc.detail)


async def generic_exception_handler(request: Request, exc: Exception) -> ORJSONResponse:
    cid = getattr(request.state, "correlation_id", None)
    logger.exception(
        "unhandled_exception",
        correlation_id=cid,
        path=str(request.url.path),
        error=str(exc),
    )
    return _error_response(
        cid,
        status.HTTP_500_INTERNAL_SERVER_ERROR,
        "Internal server error",
    )


def register_exception_handlers(app: FastAPI) -> None:
    """Register all exception handlers on the FastAPI app."""
    app.add_exception_handler(MedVerifyException, medverify_exception_handler)
    app.add_exception_handler(Exception, generic_exception_handler)
