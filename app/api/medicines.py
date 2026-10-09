"""Medicine search routes (openFDA + local database)."""
from __future__ import annotations

from typing import Any, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.core.security import CurrentUser, get_optional_user
from app.database import get_db
from app.schemas.schemas import MedicineResponse, OpenFDASearchResult, PaginatedResponse
from app.services import medicine_service, openfda_service

router = APIRouter(prefix="/api/medicines", tags=["Medicines"])


@router.get("/search")
async def search_medicines(
    q: Optional[str] = Query(None, description="General search query for medicine or brand name"),
    name: Optional[str] = Query(None, description="Drug/brand name"),
    manufacturer: Optional[str] = Query(None, description="Manufacturer name"),
    gtin: Optional[str] = Query(None, description="GTIN barcode identifier"),
    db: AsyncSession = Depends(get_db),
):
    """Search medicines across local registry and openFDA.
    
    Returns both verified Indian database matches and supplementary openFDA records.
    """
    search_term = q or name
    local_matches = []
    if search_term or manufacturer or gtin:
        raw_local = await medicine_service.search_medicine(
            db, name=search_term, manufacturer=manufacturer, gtin=gtin
        )
        local_matches = [MedicineResponse.model_validate(m).model_dump() for m in raw_local]

    openfda_matches = []
    if search_term:
        openfda_matches = await openfda_service.search_drug(name=search_term, manufacturer=manufacturer)

    return {
        "query": search_term,
        "local_matches": local_matches,
        "openfda_matches": openfda_matches,
    }


@router.get("/lookup", response_model=list[MedicineResponse])
async def lookup_medicine(
    name: Optional[str] = Query(None, description="Medicine name"),
    manufacturer: Optional[str] = Query(None, description="Manufacturer name"),
    gtin: Optional[str] = Query(None, description="GTIN/product identifier"),
    db: AsyncSession = Depends(get_db),
):
    """Search the local curated medicine database.
    
    This is the primary source for Indian medicine verification.
    """
    medicines = await medicine_service.search_medicine(
        db, name=name, manufacturer=manufacturer, gtin=gtin
    )
    return [MedicineResponse.model_validate(m) for m in medicines]


@router.get("/{medicine_id}", response_model=MedicineResponse)
async def get_medicine(
    medicine_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get medicine details by ID."""
    medicine = await medicine_service.get_medicine_by_id(db, medicine_id)
    if not medicine:
        raise NotFoundError("Medicine", str(medicine_id))
    return MedicineResponse.model_validate(medicine)
