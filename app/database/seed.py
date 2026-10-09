"""Database seeding utility with realistic Indian medicines, batches, and CDSCO alerts."""
from __future__ import annotations

import asyncio
import uuid
from datetime import date, datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import get_logger
from app.database.session import get_engine, get_session_factory, init_db
from app.models.models import (
    Medicine,
    MedicineBatch,
    RegulatoryAlert,
    ScanHistory,
    SuspiciousReport,
    User,
)

logger = get_logger("seed")

SAMPLE_MEDICINES = [
    {
        "name": "Dolo 650",
        "manufacturer": "Micro Labs Ltd",
        "gtin": "8901148210356",
        "composition": "Paracetamol (650mg)",
        "strength": "650mg",
        "dosage_form": "Tablet",
        "description": "Antipyretic and analgesic medicine commonly prescribed for fever and pain relief.",
        "data_source": "verified_registry",
        "is_verified": True,
        "batches": [
            {
                "batch_number": "DL24089",
                "manufacturing_date": date(2024, 3, 1),
                "expiry_date": date(2027, 2, 28),
                "verification_source": "manufacturer_confirmed",
                "manufacturer_confirmed": True,
            },
            {
                "batch_number": "DL23412",
                "manufacturing_date": date(2023, 6, 15),
                "expiry_date": date(2026, 5, 31),
                "verification_source": "manufacturer_confirmed",
                "manufacturer_confirmed": True,
            },
        ],
    },
    {
        "name": "Calpol 500",
        "manufacturer": "GlaxoSmithKline Pharmaceuticals Ltd",
        "gtin": "8901117001022",
        "composition": "Paracetamol IP (500mg)",
        "strength": "500mg",
        "dosage_form": "Tablet",
        "description": "Mild to moderate pain and fever relief medication.",
        "data_source": "verified_registry",
        "is_verified": True,
        "batches": [
            {
                "batch_number": "CP24101",
                "manufacturing_date": date(2024, 1, 10),
                "expiry_date": date(2026, 12, 31),
                "verification_source": "manufacturer_confirmed",
                "manufacturer_confirmed": True,
            },
            {
                "batch_number": "CP21045",  # Expired batch for testing
                "manufacturing_date": date(2021, 1, 10),
                "expiry_date": date(2023, 1, 9),
                "verification_source": "historical_record",
                "manufacturer_confirmed": True,
            },
        ],
    },
    {
        "name": "Pan 40",
        "manufacturer": "Alkem Laboratories Ltd",
        "gtin": "8901086001238",
        "composition": "Pantoprazole Sodium IP (40mg)",
        "strength": "40mg",
        "dosage_form": "Tablet",
        "description": "Proton pump inhibitor used to treat acid-related diseases of the stomach and intestine.",
        "data_source": "verified_registry",
        "is_verified": True,
        "batches": [
            {
                "batch_number": "PN24012",
                "manufacturing_date": date(2024, 2, 1),
                "expiry_date": date(2026, 1, 31),
                "verification_source": "manufacturer_confirmed",
                "manufacturer_confirmed": True,
            },
            {
                "batch_number": "PN23999",  # Flagged in CDSCO alerts
                "manufacturing_date": date(2023, 5, 15),
                "expiry_date": date(2025, 4, 30),
                "verification_source": "regulatory_flagged",
                "manufacturer_confirmed": False,
            },
        ],
    },
    {
        "name": "Azithral 500",
        "manufacturer": "Alembic Pharmaceuticals Ltd",
        "gtin": "8901234567890",
        "composition": "Azithromycin IP (500mg)",
        "strength": "500mg",
        "dosage_form": "Tablet",
        "description": "Macrolide antibiotic used for respiratory tract and skin infections.",
        "data_source": "verified_registry",
        "is_verified": True,
        "batches": [
            {
                "batch_number": "AZ24050",
                "manufacturing_date": date(2024, 4, 1),
                "expiry_date": date(2026, 3, 31),
                "verification_source": "manufacturer_confirmed",
                "manufacturer_confirmed": True,
            },
        ],
    },
    {
        "name": "Augmentin 625 Duo",
        "manufacturer": "GlaxoSmithKline Pharmaceuticals Ltd",
        "gtin": "8901117002043",
        "composition": "Amoxicillin IP (500mg) + Clavulanic Acid IP (125mg)",
        "strength": "625mg",
        "dosage_form": "Tablet",
        "description": "Broad-spectrum antibacterial medication.",
        "data_source": "verified_registry",
        "is_verified": True,
        "batches": [
            {
                "batch_number": "AG24188",
                "manufacturing_date": date(2024, 5, 1),
                "expiry_date": date(2026, 4, 30),
                "verification_source": "manufacturer_confirmed",
                "manufacturer_confirmed": True,
            },
        ],
    },
    {
        "name": "Glycomet 500",
        "manufacturer": "USV Private Limited",
        "gtin": "8901235678901",
        "composition": "Metformin Hydrochloride IP (500mg)",
        "strength": "500mg",
        "dosage_form": "Tablet",
        "description": "Biguanide antihyperglycemic agent for managing type 2 diabetes.",
        "data_source": "verified_registry",
        "is_verified": True,
        "batches": [
            {
                "batch_number": "GM24031",
                "manufacturing_date": date(2024, 2, 10),
                "expiry_date": date(2026, 8, 31),
                "verification_source": "manufacturer_confirmed",
                "manufacturer_confirmed": True,
            },
        ],
    },
    {
        "name": "Telma 40",
        "manufacturer": "Glenmark Pharmaceuticals Ltd",
        "gtin": "8901236789012",
        "composition": "Telmisartan IP (40mg)",
        "strength": "40mg",
        "dosage_form": "Tablet",
        "description": "Angiotensin II receptor antagonist used to manage high blood pressure.",
        "data_source": "verified_registry",
        "is_verified": True,
        "batches": [
            {
                "batch_number": "TL24001",
                "manufacturing_date": date(2024, 1, 15),
                "expiry_date": date(2026, 12, 31),
                "verification_source": "manufacturer_confirmed",
                "manufacturer_confirmed": True,
            },
        ],
    },
]

SAMPLE_REGULATORY_ALERTS = [
    {
        "product_name": "Pan 40",
        "manufacturer": "Alkem Laboratories Ltd",
        "batch_number": "PN23999",
        "alert_type": "Not of Standard Quality (NSQ)",
        "reported_issue": "Failed dissolution test according to Indian Pharmacopoeia standards. Recalled by state regulator.",
        "regulatory_source": "CDSCO Central Drug Laboratory",
        "publication_date": date(2024, 8, 15),
        "source_url": "https://cdsco.gov.in/opencms/opencms/en/Drug-Safety/Alerts/",
        "import_batch_id": "seed_batch_2024_01",
    },
    {
        "product_name": "Telmisartan Tablets IP 40mg",
        "manufacturer": "Glenmark Pharmaceuticals Ltd",
        "batch_number": "TLM2211",
        "alert_type": "Spurious / Substandard",
        "reported_issue": "Substandard active pharmaceutical ingredient content detected below minimum prescribed threshold.",
        "regulatory_source": "CDSCO East Zone",
        "publication_date": date(2024, 9, 1),
        "source_url": "https://cdsco.gov.in/opencms/opencms/en/Drug-Safety/Alerts/",
        "import_batch_id": "seed_batch_2024_01",
    },
    {
        "product_name": "Amoxicillin and Potassium Clavulanate Tablets IP",
        "manufacturer": "Sample Pharma Ltd",
        "batch_number": "AMX9901",
        "alert_type": "Not of Standard Quality (NSQ)",
        "reported_issue": "Assay of Clavulanic Acid failed pharmacopoeial specifications upon testing.",
        "regulatory_source": "CDSCO North Zone",
        "publication_date": date(2024, 10, 10),
        "source_url": "https://cdsco.gov.in/opencms/opencms/en/Drug-Safety/Alerts/",
        "import_batch_id": "seed_batch_2024_01",
    },
    {
        "product_name": "Paracetamol Tablets IP 500mg",
        "manufacturer": "Standard Healthcare",
        "batch_number": "PCM8820",
        "alert_type": "Not of Standard Quality (NSQ)",
        "reported_issue": "Disintegration time exceeded pharmacopoeia specifications.",
        "regulatory_source": "State Drugs Controller",
        "publication_date": date(2024, 7, 20),
        "source_url": "https://cdsco.gov.in",
        "import_batch_id": "seed_batch_2024_01",
    },
]


async def seed_database(db: AsyncSession) -> dict:
    """Seed sample medicines, batches, alerts, admin user, and sample scans."""
    logger.info("seed_started")
    counts = {"medicines": 0, "batches": 0, "alerts": 0, "users": 0}

    # 1. Seed Admin User
    admin_query = select(User).where(User.email == "admin@medverify.gov.in")
    res = await db.execute(admin_query)
    admin_user = res.scalar_one_or_none()
    if not admin_user:
        admin_user = User(
            id=uuid.uuid4(),
            email="admin@medverify.gov.in",
            name="MedVerify Admin",
            role="admin",
            preferred_language="en",
            is_active=True,
        )
        db.add(admin_user)
        counts["users"] += 1

    # 2. Seed Medicines & Batches
    for med_data in SAMPLE_MEDICINES:
        m_query = select(Medicine).where(Medicine.name == med_data["name"])
        m_res = await db.execute(m_query)
        medicine = m_res.scalar_one_or_none()

        if not medicine:
            medicine = Medicine(
                id=uuid.uuid4(),
                name=med_data["name"],
                manufacturer=med_data.get("manufacturer"),
                gtin=med_data.get("gtin"),
                composition=med_data.get("composition"),
                strength=med_data.get("strength"),
                dosage_form=med_data.get("dosage_form"),
                description=med_data.get("description"),
                data_source=med_data.get("data_source", "manual"),
                is_verified=med_data.get("is_verified", True),
            )
            db.add(medicine)
            await db.flush()
            counts["medicines"] += 1

        # Batches
        for b_data in med_data.get("batches", []):
            b_query = select(MedicineBatch).where(
                MedicineBatch.medicine_id == medicine.id,
                MedicineBatch.batch_number == b_data["batch_number"],
            )
            b_res = await db.execute(b_query)
            batch = b_res.scalar_one_or_none()

            if not batch:
                batch = MedicineBatch(
                    id=uuid.uuid4(),
                    medicine_id=medicine.id,
                    batch_number=b_data["batch_number"],
                    manufacturing_date=b_data.get("manufacturing_date"),
                    expiry_date=b_data.get("expiry_date"),
                    verification_source=b_data.get("verification_source"),
                    manufacturer_confirmed=b_data.get("manufacturer_confirmed", False),
                )
                db.add(batch)
                counts["batches"] += 1

    # 3. Seed Regulatory Alerts
    for alert_data in SAMPLE_REGULATORY_ALERTS:
        a_query = select(RegulatoryAlert).where(
            RegulatoryAlert.product_name == alert_data["product_name"],
            RegulatoryAlert.batch_number == alert_data["batch_number"],
        )
        a_res = await db.execute(a_query)
        alert = a_res.scalar_one_or_none()

        if not alert:
            alert = RegulatoryAlert(
                id=uuid.uuid4(),
                product_name=alert_data["product_name"],
                manufacturer=alert_data.get("manufacturer"),
                batch_number=alert_data.get("batch_number"),
                alert_type=alert_data.get("alert_type"),
                reported_issue=alert_data.get("reported_issue"),
                regulatory_source=alert_data.get("regulatory_source", "CDSCO"),
                publication_date=alert_data.get("publication_date"),
                source_url=alert_data.get("source_url"),
                import_batch_id=alert_data.get("import_batch_id"),
            )
            db.add(alert)
            counts["alerts"] += 1

    await db.commit()
    logger.info("seed_completed", counts=counts)
    return counts


async def main():
    """CLI runner for seed script."""
    await init_db()
    factory = get_session_factory()
    async with factory() as session:
        counts = await seed_database(session)
        print("Database seeded successfully:", counts)


if __name__ == "__main__":
    asyncio.run(main())
