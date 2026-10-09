"""Unit tests for barcode and GS1 parsing."""
from __future__ import annotations

import pytest

from app.services.barcode_service import _parse_gs1, _parse_gs1_date


def test_parse_gs1_date():
    """Verify GS1 YYMMDD date conversion to ISO YYYY-MM-DD."""
    # 260331 -> 2026-03-31
    assert _parse_gs1_date("260331") == "2026-03-31"
    # 251200 -> last day / day 1 of Dec 2025
    assert _parse_gs1_date("251200") == "2025-12-01"
    # Invalid length
    assert _parse_gs1_date("123") is None
    assert _parse_gs1_date("") is None


def test_parse_gs1_payload():
    """Verify GS1 Application Identifiers parsing."""
    # GS1 data string: (01)08901148210356(17)260331(10)DL24089(21)SER123456
    raw_gs1 = "(01)08901148210356(17)260331(10)DL24089|(21)SER123456"
    parsed = _parse_gs1(raw_gs1)

    assert parsed.get("gtin") == "08901148210356"
    assert parsed.get("expiry_date") == "260331"
    assert parsed.get("batch_number") == "DL24089"
    assert parsed.get("serial_number") == "SER123456"
