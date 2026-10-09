"""Integration tests for MedVerify API endpoints."""
from __future__ import annotations

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_check_endpoint(client: AsyncClient):
    """GET /health should return 200 with service status."""
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "version" in data
    assert "services" in data


@pytest.mark.asyncio
async def test_root_endpoint(client: AsyncClient):
    """GET / should return 200 with disclaimer and status."""
    response = await client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "MedVerify"
    assert "disclaimer" in data


@pytest.mark.asyncio
async def test_verify_medicine_endpoint(client: AsyncClient, seed_data):
    """POST /api/verify should return comprehensive verification result."""
    payload = {
        "medicine_name": "Dolo 650",
        "manufacturer": "Micro Labs Ltd",
        "batch_number": "DL24089",
        "expiry_date": "2027-02-28",
        "input_method": "qr",
        "location_consent": False,
    }
    response = await client.post("/api/verify", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert "scan_id" in data
    assert "risk" in data
    assert data["risk"]["category"] in ("low", "medium", "high")
    assert "checks" in data
    assert "explanation" in data
    assert "en" in data["explanation"]
    assert "hi" in data["explanation"]
    assert "next_steps" in data


@pytest.mark.asyncio
async def test_verify_expired_medicine(client: AsyncClient, seed_data):
    """POST /api/verify with past expiry date should flag expired status."""
    payload = {
        "medicine_name": "Dolo 650",
        "batch_number": "DL20001",
        "expiry_date": "2022-01-01",
        "input_method": "manual",
    }
    response = await client.post("/api/verify", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["checks"]["expiry"] == "expired"
    assert len(data["warnings"]) > 0


@pytest.mark.asyncio
async def test_search_medicines_endpoint(client: AsyncClient, seed_data):
    """GET /api/medicines/search should find seeded medicine."""
    response = await client.get("/api/medicines/search", params={"q": "Dolo"})
    assert response.status_code == 200
    data = response.json()
    assert "local_matches" in data
    assert len(data["local_matches"]) > 0
    assert data["local_matches"][0]["name"] == "Dolo 650"


@pytest.mark.asyncio
async def test_alerts_check_endpoint(client: AsyncClient, seed_data):
    """POST /api/alerts/check should match seeded alert."""
    payload = {
        "product_name": "Pan 40",
        "batch_number": "PN23999",
    }
    response = await client.post("/api/alerts/check", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "alert_match"
    assert len(data["alerts"]) > 0


@pytest.mark.asyncio
async def test_chat_endpoint_graceful_fallback(client: AsyncClient):
    """POST /api/chat should provide helpful response with safety guidelines."""
    payload = {
        "message": "What does this verification score mean?",
        "language": "en",
    }
    response = await client.post("/api/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "reply" in data
    assert len(data["reply"]) > 0
    assert data["language"] == "en"


@pytest.mark.asyncio
async def test_create_suspicious_report_endpoint(client: AsyncClient):
    """POST /api/reports should allow submitting a suspicious medicine report."""
    payload = {
        "medicine_name": "Suspect Tablet 500",
        "manufacturer": "Unknown Co",
        "batch_number": "UNK1234",
        "reason": "suspicious_packaging",
        "description": "Blister seal appears broken and label looks smudged.",
        "contact_info": "citizen@example.com",
    }
    response = await client.post("/api/reports", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    assert data["status"] == "submitted"
    assert data["reason"] == "suspicious_packaging"


@pytest.mark.asyncio
async def test_admin_dashboard_endpoint(client: AsyncClient, seed_data):
    """GET /api/admin/dashboard should return system metrics."""
    response = await client.get("/api/admin/dashboard")
    assert response.status_code == 200
    data = response.json()
    assert "total_scans" in data
    assert "total_medicines" in data
    assert "total_alerts" in data
    assert data["total_medicines"] >= 1
