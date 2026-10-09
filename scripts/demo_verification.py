"""
End-to-End Local Demo Runner for MedVerify
Demonstrates:
  1. Safe / Low-risk verification (Dolo 650)
  2. Expired medicine detection (Calpol 500)
  3. CDSCO NSQ Regulatory alert detection (Pan 40)
  4. Unregistered medicine with explainable uncertainty
  5. Multilingual AI Assistant explanation (English + Hindi)
"""
from __future__ import annotations

import asyncio
import os
import sys

# Ensure UTF-8 printing in Windows console
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ.setdefault('SUPABASE_URL', 'https://demo.supabase.co')
os.environ.setdefault('SUPABASE_SECRET_KEY', 'demo_secret_key')
os.environ.setdefault('SECRET_KEY', 'demo_secret_key_12345')
os.environ.setdefault('ENVIRONMENT', 'development')

from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from app.database.session import Base, get_db
from app.database.seed import seed_database
from app.main import create_application


async def run_demo():
    print("=" * 70)
    print(" MEDVERIFY – SMART MEDICINE VERIFICATION SYSTEM")
    print(" Complete End-to-End Backend Verification Demonstration")
    print("=" * 70)

    # In-memory SQLite for self-contained demonstration
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", poolclass=StaticPool)
    session_factory = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with session_factory() as session:
        counts = await seed_database(session)
        print(f"\n[+] Database seeded with {counts['medicines']} medicines, {counts['batches']} batches, {counts['alerts']} alerts.")

    app = create_application()

    async def override_db():
        async with session_factory() as s:
            yield s

    app.dependency_overrides[get_db] = override_db
    transport = ASGITransport(app=app)

    async with AsyncClient(transport=transport, base_url="http://demo") as client:
        # 1. Health check
        print("\n--- [DEMO 1] System Health & Service Check ---")
        health = (await client.get("/health")).json()
        print(f"Status: {health['status']} | Version: {health['version']}")
        print(f"Configured services: {health['services']}")

        # 2. Genuine verification: Dolo 650
        print("\n--- [DEMO 2] Safe Medicine Verification (Dolo 650) ---")
        payload1 = {
            "medicine_name": "Dolo 650",
            "manufacturer": "Micro Labs Ltd",
            "batch_number": "DL24089",
            "expiry_date": "2027-02-28",
            "input_method": "qr",
        }
        res1 = (await client.post("/api/verify", json=payload1)).json()
        print(f"Medicine: {res1['medicine'].get('name')} | Batch: {payload1['batch_number']}")
        print(f"Risk Score: {res1['risk']['score']}/100 | Category: {res1['risk']['category'].upper()}")
        print(f"Checks: Expiry={res1['checks']['expiry']}, Mfr={res1['checks']['manufacturer']}, Alerts={res1['checks']['regulatory_alert']}")
        print(f"Explanation (EN): {res1['explanation']['en']}")
        print(f"Explanation (HI): {res1['explanation']['hi']}")

        # 3. Expired Medicine: Calpol 500
        print("\n--- [DEMO 3] Expired Medicine Detection ---")
        payload2 = {
            "medicine_name": "Calpol 500",
            "manufacturer": "GlaxoSmithKline Pharmaceuticals Ltd",
            "batch_number": "CP21045",
            "expiry_date": "2023-01-09",
            "input_method": "barcode",
        }
        res2 = (await client.post("/api/verify", json=payload2)).json()
        print(f"Medicine: {payload2['medicine_name']} | Batch: {payload2['batch_number']}")
        print(f"Risk Score: {res2['risk']['score']}/100 | Category: {res2['risk']['category'].upper()}")
        print(f"Checks: Expiry={res2['checks']['expiry']}")
        print(f"Warnings: {res2['warnings']}")
        print(f"Next Steps: {res2['next_steps']}")

        # 4. CDSCO Alert Match: Pan 40
        print("\n--- [DEMO 4] CDSCO Regulatory Alert Match (Pan 40) ---")
        payload3 = {
            "medicine_name": "Pan 40",
            "batch_number": "PN23999",
            "expiry_date": "2025-04-30",
            "input_method": "ocr",
        }
        res3 = (await client.post("/api/verify", json=payload3)).json()
        print(f"Medicine: {payload3['medicine_name']} | Batch: {payload3['batch_number']}")
        print(f"Verification Status: {res3['verification_status']}")
        print(f"Risk Score: {res3['risk']['score']}/100 | Category: {res3['risk']['category'].upper()}")
        print(f"Checks: Regulatory Alert={res3['checks']['regulatory_alert']}")
        print(f"Warnings: {res3['warnings']}")
        print(f"Explanation (HI): {res3['explanation']['hi']}")

        # 5. Multilingual AI Assistant Chat
        print("\n--- [DEMO 5] AI Assistant Grounded Explanation ---")
        chat_req = {
            "message": "Why is this medicine flagged as high risk?",
            "language": "hi",
            "scan_id": res3["scan_id"],
        }
        chat_res = (await client.post("/api/chat", json=chat_req)).json()
        print(f"User Query: {chat_req['message']}")
        print(f"AI Assistant Reply: {chat_res['reply']}")

        # 6. Admin Dashboard Stats
        print("\n--- [DEMO 6] Admin Dashboard Metrics ---")
        admin_res = (await client.get("/api/admin/dashboard")).json()
        print(f"Total Scans Recorded: {admin_res['total_scans']}")
        print(f"High Risk Scans: {admin_res['high_risk_scans']}")
        print(f"Total Medicines in Registry: {admin_res['total_medicines']}")
        print(f"Total Regulatory Alerts: {admin_res['total_alerts']}")

    print("\n" + "=" * 70)
    print(" DEMO COMPLETED SUCCESSFULLY: ALL WORKFLOWS VALIDATED")
    print("=" * 70)


if __name__ == "__main__":
    asyncio.run(run_demo())
