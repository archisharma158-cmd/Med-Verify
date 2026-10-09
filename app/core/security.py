"""Security utilities: JWT verification, password hashing, auth dependencies."""
from __future__ import annotations

import time
from typing import Annotated, Optional

from fastapi import Depends, Header, Request
from jose import JWTError, jwt

from app.core.config import Settings, get_settings
from app.core.exceptions import ForbiddenError, UnauthorizedError
from app.core.logging import get_logger

logger = get_logger("security")


# ── JWT Token Verification ──

def _decode_supabase_jwt(token: str, settings: Settings) -> dict:
    """Decode and validate a Supabase-issued JWT.
    
    Uses the SUPABASE_JWT_SECRET if configured; otherwise falls back
    to the HS256 secret derived from the Supabase project.
    """
    secret = settings.SUPABASE_JWT_SECRET or settings.SECRET_KEY
    try:
        payload = jwt.decode(
            token,
            secret,
            algorithms=["HS256"],
            options={
                "verify_aud": False,
                "verify_exp": True,
            },
        )
        return payload
    except JWTError as e:
        logger.warning("jwt_decode_failed", error=str(e))
        raise UnauthorizedError("Invalid or expired token")


def _extract_token(authorization: str | None) -> str:
    """Extract Bearer token from Authorization header."""
    if not authorization:
        raise UnauthorizedError("Authorization header missing")
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise UnauthorizedError("Invalid authorization format. Use: Bearer <token>")
    return parts[1]


# ── User context data class ──

class CurrentUser:
    """Lightweight representation of the authenticated user."""

    def __init__(self, user_id: str, email: str | None, role: str, raw_payload: dict):
        self.user_id = user_id
        self.email = email
        self.role = role
        self.raw_payload = raw_payload

    @property
    def is_admin(self) -> bool:
        return self.role == "admin"

    def __repr__(self) -> str:
        return f"CurrentUser(id={self.user_id}, role={self.role})"


# ── FastAPI Dependencies ──

async def get_current_user(
    request: Request,
    authorization: Annotated[Optional[str], Header()] = None,
    settings: Settings = Depends(get_settings),
) -> CurrentUser:
    """Dependency: Require a valid authenticated user."""
    token = _extract_token(authorization)
    payload = _decode_supabase_jwt(token, settings)
    user_id = payload.get("sub")
    if not user_id:
        raise UnauthorizedError("Token missing user identity")
    email = payload.get("email")
    # Role from app_metadata or default
    app_meta = payload.get("app_metadata", {})
    role = app_meta.get("role", "user")
    return CurrentUser(user_id=user_id, email=email, role=role, raw_payload=payload)


async def get_optional_user(
    request: Request,
    authorization: Annotated[Optional[str], Header()] = None,
    settings: Settings = Depends(get_settings),
) -> Optional[CurrentUser]:
    """Dependency: Optionally authenticate user (guest-friendly endpoints)."""
    if not authorization:
        return None
    try:
        return await get_current_user(request, authorization, settings)
    except UnauthorizedError:
        return None


async def require_admin(
    user: CurrentUser = Depends(get_current_user),
) -> CurrentUser:
    """Dependency: Require admin role."""
    if not user.is_admin:
        raise ForbiddenError("Admin access required")
    return user
