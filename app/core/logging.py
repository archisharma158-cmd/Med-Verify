"""Structured logging configuration using structlog."""
from __future__ import annotations

import logging
import sys
import uuid

import structlog
from fastapi import Request


def setup_logging(log_level: str = "INFO") -> None:
    """Configure structured JSON logging."""
    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.processors.add_log_level,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.UnicodeDecoder(),
            structlog.processors.JSONRenderer(),
        ],
        context_class=dict,
        logger_factory=structlog.PrintLoggerFactory(),
        wrapper_class=structlog.make_filtering_bound_logger(
            getattr(logging, log_level.upper(), logging.INFO)
        ),
        cache_logger_on_first_use=True,
    )
    # Suppress noisy library loggers
    for name in ("httpx", "httpcore", "asyncio", "uvicorn.access"):
        logging.getLogger(name).setLevel(logging.WARNING)


def get_logger(name: str | None = None) -> structlog.BoundLogger:
    """Get a named structured logger."""
    return structlog.get_logger(name or "medverify")


def generate_correlation_id() -> str:
    """Generate a unique request correlation ID."""
    return str(uuid.uuid4())[:12]
