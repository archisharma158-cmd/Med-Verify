"""Medicine verification routes."""
from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import CurrentUser, get_optional_user
from app.database import get_db
from app.schemas.schemas import VerifyRequest, VerifyResponse
from app.services.verification_service import verify_medicine

router = APIRouter(prefix="/api/verify", tags=["Verification"])


@router.post("", response_model=VerifyResponse)
async def verify(
    body: VerifyRequest,
    user: Optional[CurrentUser] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
):
    """Run complete medicine verification.
    
    Accepts medicine details from QR/barcode decode, OCR extraction, or manual entry.
    Performs: expiry check, manufacturer matching, regulatory alert check,
    duplicate scan analysis, and risk scoring.
    
    Authentication is optional – basic verification works for guests.
    """
    user_id = user.user_id if user else None
    result = await verify_medicine(db, body, user_id=user_id)
    return result
