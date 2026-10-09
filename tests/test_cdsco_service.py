"""Unit tests for CDSCO regulatory alert service."""
from __future__ import annotations

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.cdsco_service import check_regulatory_alerts, import_alerts_from_csv


@pytest.mark.asyncio
async def test_import_and_match_regulatory_alerts(db_session: AsyncSession):
    """Test importing alerts from CSV and matching by product name and batch number."""
    csv_content = """product_name,manufacturer,batch_number,alert_type,reported_issue,publication_date
TestCillin 500,Test Pharma Ltd,TC5501,Not of Standard Quality,Failed assay test,2024-05-01
SpuriousCef 250,Fake Labs,SP0012,Spurious,Counterfeit active drug,2024-06-15
"""
    result = await import_alerts_from_csv(db_session, csv_content, source="Test CDSCO")
    assert result.imported == 2
    assert result.skipped == 0
    assert len(result.errors) == 0

    # 1. Exact batch and name match
    match_result = await check_regulatory_alerts(
        db_session,
        product_name="TestCillin 500",
        batch_number="TC5501",
    )
    assert match_result["status"] == "alert_match"
    assert len(match_result["alerts"]) > 0
    assert match_result["alerts"][0]["batch_number"] == "TC5501"
    assert match_result["alerts"][0]["match_strength"] == "strong"

    # 2. No match in imported data
    clean_result = await check_regulatory_alerts(
        db_session,
        product_name="Completely Clean Drug 100",
        batch_number="CLEAN999",
    )
    assert clean_result["status"] == "no_match_in_imported_data"
    assert len(clean_result["alerts"]) == 0

    # 3. Insufficient data
    empty_result = await check_regulatory_alerts(db_session)
    assert empty_result["status"] == "insufficient_data"
