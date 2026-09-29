from datetime import datetime, timezone, timedelta
from app.auth.security import get_password_hash
from app.models import (
    User,
    Child,
    Vaccine,
    VaccinationRecord,
    HealthcareCenter,
    Inventory,
    VaccinationSchedule,
)

async def seed_mongodb_if_empty() -> None:
    user_count = await User.count()
    if user_count > 0:
        demo_users = [
            ("parent@vextracker.ai", "+1-555-0101", "+91 98765 43210"),
            ("doctor@vextracker.ai", "+1-555-0102", "+91 98765 43211"),
            ("admin@vextracker.ai", "+1-555-0103", "+91 98765 43212"),
        ]
        for email, old_phone, indian_phone in demo_users:
            user = await User.find_one(User.email == email)
            if user and user.phone == old_phone:
                user.phone = indian_phone
                await user.save()

        demo_centers = [
            ("MCHC-01", "+1-555-0120", "+91 80 4000 0120"),
            ("SPH-02", "+1-555-0145", "+91 22 4000 0145"),
            ("CHCF-03", "+1-555-0189", "+91 11 4000 0189"),
        ]
        for code, old_phone, indian_phone in demo_centers:
            center = await HealthcareCenter.find_one(HealthcareCenter.code == code)
            if center and center.phone == old_phone:
                center.phone = indian_phone
                await center.save()
        return

    print("Seeding initial MongoDB clinical data...")
    now = datetime.now(timezone.utc)

    # 1. Users
    parent = User(
        full_name="Maya Patel",
        email="parent@vextracker.ai",
        phone="+91 98765 43210",
        password_hash=get_password_hash("password123"),
        role="parent",
        is_active=True,
    )
    await parent.insert()

    doctor = User(
        full_name="Dr. Priya Shah, MD",
        email="doctor@vextracker.ai",
        phone="+91 98765 43211",
        password_hash=get_password_hash("password123"),
        role="doctor",
        is_active=True,
    )
    await doctor.insert()

    admin = User(
        full_name="Alicia Grant",
        email="admin@vextracker.ai",
        phone="+91 98765 43212",
        password_hash=get_password_hash("password123"),
        role="admin",
        is_active=True,
    )
    await admin.insert()

    # 2. Healthcare Centers
    clinic_main = HealthcareCenter(
        name="Metro Child Health Clinic",
        code="MCHC-01",
        address="450 Health Parkway, Suite 200, Metro City",
        phone="+91 80 4000 0120",
        email="clinic@metrohealth.example",
        contact_person="Dr. Priya Shah",
    )
    await clinic_main.insert()

    center_sunrise = HealthcareCenter(
        name="Sunrise Pediatric Hospital",
        code="SPH-02",
        address="880 Sunrise Blvd, Metro City",
        phone="+91 22 4000 0145",
        email="pediatrics@sunrisehospital.example",
        contact_person="Dr. Marcus Vance",
    )
    await center_sunrise.insert()

    center_community = HealthcareCenter(
        name="Community Health Center #4",
        code="CHCF-03",
        address="12 Central Square, Metro City",
        phone="+91 11 4000 0189",
        email="info@communityhealth4.example",
        contact_person="Nurse Elena Rostova",
    )
    await center_community.insert()

    # 3. Vaccines Catalog (CDC/WHO Pediatric Schedule)
    vaccine_data = [
        {
            "name": "BCG",
            "disease_target": "Tuberculosis (TB)",
            "description": "Bacillus Calmette–Guérin vaccine to prevent severe pediatric tuberculosis and meningitis.",
            "recommended_age_months": "0 (At birth)",
        },
        {
            "name": "Hepatitis B",
            "disease_target": "Hepatitis B Virus",
            "description": "Protects against hepatitis B infection which can lead to chronic liver disease.",
            "recommended_age_months": "0, 1-2, 6-18",
        },
        {
            "name": "DTaP",
            "disease_target": "Diphtheria, Tetanus, Pertussis",
            "description": "Primary 5-dose childhood series against diphtheria, tetanus (lockjaw), and whooping cough.",
            "recommended_age_months": "2, 4, 6, 15-18, 48-72",
        },
        {
            "name": "IPV",
            "disease_target": "Poliovirus",
            "description": "Inactivated poliovirus vaccine providing robust lifelong protection against paralytic poliomyelitis.",
            "recommended_age_months": "2, 4, 6-18, 48-72",
        },
        {
            "name": "Hib",
            "disease_target": "Haemophilus influenzae type b",
            "description": "Protects against invasive bacterial infections including bacterial meningitis and epiglottitis.",
            "recommended_age_months": "2, 4, 6, 12-15",
        },
        {
            "name": "PCV13",
            "disease_target": "Pneumococcal Disease",
            "description": "13-valent conjugate vaccine preventing pneumococcal pneumonia, ear infections, and bacteremia.",
            "recommended_age_months": "2, 4, 6, 12-15",
        },
        {
            "name": "Rotavirus",
            "disease_target": "Rotavirus Gastroenteritis",
            "description": "Oral vaccine protecting infants against severe dehydrating diarrhea and vomiting.",
            "recommended_age_months": "2, 4",
        },
        {
            "name": "MMR",
            "disease_target": "Measles, Mumps, Rubella",
            "description": "Live attenuated vaccine protecting against measles rash/encephalitis, mumps parotitis, and rubella.",
            "recommended_age_months": "12-15, 48-72",
        },
        {
            "name": "Varicella",
            "disease_target": "Chickenpox",
            "description": "Protects against varicella zoster virus infection and potential secondary bacterial skin complications.",
            "recommended_age_months": "12-15, 48-72",
        },
    ]

    saved_vaccines = {}
    for v_dict in vaccine_data:
        v_doc = Vaccine(**v_dict)
        await v_doc.insert()
        saved_vaccines[v_doc.name] = v_doc

    # 4. Inventory Stock
    inventory_items = [
        Inventory(
            vaccine_id=saved_vaccines["DTaP"].id,
            healthcare_center_id=clinic_main.id,
            batch_number="DT-2049-A",
            quantity_on_hand=68,
            min_stock=20,
            expiry_date=now + timedelta(days=365),
            location="Cold Storage Unit A (2-8°C)",
        ),
        Inventory(
            vaccine_id=saved_vaccines["MMR"].id,
            healthcare_center_id=clinic_main.id,
            batch_number="MMR-1850-B",
            quantity_on_hand=42,
            min_stock=15,
            expiry_date=now + timedelta(days=520),
            location="Cold Storage Unit A (2-8°C)",
        ),
        Inventory(
            vaccine_id=saved_vaccines["Hepatitis B"].id,
            healthcare_center_id=clinic_main.id,
            batch_number="HB-9012-C",
            quantity_on_hand=12,
            min_stock=15,  # Low stock flag!
            expiry_date=now + timedelta(days=45),  # Soon to expire!
            location="Emergency Reserve Fridge 1",
        ),
        Inventory(
            vaccine_id=saved_vaccines["IPV"].id,
            healthcare_center_id=center_sunrise.id,
            batch_number="IPV-3301-D",
            quantity_on_hand=95,
            min_stock=30,
            expiry_date=now + timedelta(days=400),
            location="Freezer B (-20°C)",
        ),
        Inventory(
            vaccine_id=saved_vaccines["PCV13"].id,
            healthcare_center_id=clinic_main.id,
            batch_number="PCV-4019-E",
            quantity_on_hand=54,
            min_stock=20,
            expiry_date=now + timedelta(days=300),
            location="Cold Storage Unit B (2-8°C)",
        ),
    ]
    for item in inventory_items:
        await item.insert()

    # 5. Children for Maya Patel
    child_aarav = Child(
        guardians=[parent.id],
        first_name="Aarav",
        last_name="Patel",
        date_of_birth=datetime(2024, 4, 10, tzinfo=timezone.utc),
        gender="Male",
        notes="Blood Type O+. No known drug allergies. Growth percentiles normal (75th percentile).",
    )
    await child_aarav.insert()

    child_ananya = Child(
        guardians=[parent.id],
        first_name="Ananya",
        last_name="Patel",
        date_of_birth=datetime(2025, 11, 20, tzinfo=timezone.utc),
        gender="Female",
        notes="Born at 38 weeks. Feeding well. Mild skin eczema on cheeks.",
    )
    await child_ananya.insert()

    # 6. Vaccination Records for Aarav
    records_aarav = [
        VaccinationRecord(
            child_id=child_aarav.id,
            vaccine_id=saved_vaccines["BCG"].id,
            dose_number=1,
            administered_date=datetime(2024, 4, 12, tzinfo=timezone.utc),
            status="completed",
            notes="Administered at Metro Hospital birth center. Normal scar formation.",
            verified_by=doctor.id,
        ),
        VaccinationRecord(
            child_id=child_aarav.id,
            vaccine_id=saved_vaccines["Hepatitis B"].id,
            dose_number=1,
            administered_date=datetime(2024, 4, 12, tzinfo=timezone.utc),
            status="completed",
            notes="Birth dose given in left anterolateral thigh.",
            verified_by=doctor.id,
        ),
        VaccinationRecord(
            child_id=child_aarav.id,
            vaccine_id=saved_vaccines["DTaP"].id,
            dose_number=1,
            administered_date=datetime(2024, 6, 15, tzinfo=timezone.utc),
            status="completed",
            notes="2-month primary dose completed. Mild fussiness resolved in 24 hours.",
            verified_by=doctor.id,
        ),
        VaccinationRecord(
            child_id=child_aarav.id,
            vaccine_id=saved_vaccines["IPV"].id,
            dose_number=1,
            administered_date=datetime(2024, 6, 15, tzinfo=timezone.utc),
            status="completed",
            notes="Given concomitantly with DTaP.",
            verified_by=doctor.id,
        ),
        VaccinationRecord(
            child_id=child_aarav.id,
            vaccine_id=saved_vaccines["Rotavirus"].id,
            dose_number=1,
            administered_date=datetime(2024, 6, 15, tzinfo=timezone.utc),
            status="completed",
            notes="Oral dose tolerated with no spit-up.",
            verified_by=doctor.id,
        ),
        VaccinationRecord(
            child_id=child_aarav.id,
            vaccine_id=saved_vaccines["MMR"].id,
            dose_number=1,
            administered_date=None,
            status="pending",
            notes="Scheduled for 12-15 month visit.",
        ),
    ]
    for r in records_aarav:
        await r.insert()

    # 7. Vaccination Records for Ananya
    records_ananya = [
        VaccinationRecord(
            child_id=child_ananya.id,
            vaccine_id=saved_vaccines["BCG"].id,
            dose_number=1,
            administered_date=datetime(2025, 11, 21, tzinfo=timezone.utc),
            status="completed",
            notes="Administered at delivery ward.",
            verified_by=doctor.id,
        ),
        VaccinationRecord(
            child_id=child_ananya.id,
            vaccine_id=saved_vaccines["Hepatitis B"].id,
            dose_number=1,
            administered_date=datetime(2025, 11, 21, tzinfo=timezone.utc),
            status="completed",
            notes="Dose 1 completed.",
            verified_by=doctor.id,
        ),
    ]
    for r in records_ananya:
        await r.insert()

    print("Initial MongoDB clinical data seeded successfully.")
