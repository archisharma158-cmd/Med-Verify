"""Authentication and user management routes."""
from __future__ import annotations

import uuid
from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import CurrentUser, get_current_user, get_optional_user
from app.database import get_db
from app.models.models import User
from app.schemas.schemas import UserCreate, UserResponse, UserUpdate

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=201)
async def register_or_sync_user(
    body: UserCreate,
    user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Register or sync a user from Supabase Auth.
    
    Called after Supabase authentication to ensure a local user record exists.
    """
    # Check if user already exists
    result = await db.execute(
        select(User).where(User.supabase_uid == user.user_id)
    )
    existing = result.scalar_one_or_none()

    if existing:
        # Update if needed
        if body.name and body.name != existing.name:
            existing.name = body.name
        if body.preferred_language != existing.preferred_language:
            existing.preferred_language = body.preferred_language
        await db.flush()
        return existing

    # Create new user
    new_user = User(
        supabase_uid=user.user_id,
        name=body.name,
        email=user.email or body.email,
        phone=body.phone,
        preferred_language=body.preferred_language,
        role=user.role,
    )
    db.add(new_user)
    await db.flush()
    return new_user


@router.get("/me", response_model=UserResponse)
async def get_profile(
    user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get current user profile."""
    result = await db.execute(
        select(User).where(User.supabase_uid == user.user_id)
    )
    db_user = result.scalar_one_or_none()
    if not db_user:
        # Auto-create profile
        db_user = User(
            supabase_uid=user.user_id,
            email=user.email,
            role=user.role,
        )
        db.add(db_user)
        await db.flush()
    return db_user


@router.patch("/me", response_model=UserResponse)
async def update_profile(
    body: UserUpdate,
    user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update current user profile."""
    result = await db.execute(
        select(User).where(User.supabase_uid == user.user_id)
    )
    db_user = result.scalar_one_or_none()
    if not db_user:
        from app.core.exceptions import NotFoundError
        raise NotFoundError("User profile not found")

    if body.name is not None:
        db_user.name = body.name
    if body.preferred_language is not None:
        db_user.preferred_language = body.preferred_language
    await db.flush()
    return db_user
