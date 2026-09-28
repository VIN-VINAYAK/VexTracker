from beanie import PydanticObjectId

from app.models import HealthcareCenter, Inventory, Vaccine


def test_admin_model_example_data_shapes():
    vaccine = Vaccine(
        name="Hepatitis B",
        disease_target="Hepatitis B",
        description="Protects against hepatitis B infection.",
        recommended_age_months="0, 1, 6",
    )
    assert vaccine.name == "Hepatitis B"
    assert vaccine.recommended_age_months == "0, 1, 6"

    center = HealthcareCenter(
        name="City Health Center",
        code="CHC-01",
        address="123 Wellness Ave",
        phone="555-0101",
        email="info@cityhealth.example",
        contact_person="Dr. Smith",
    )
    assert center.code == "CHC-01"

    inventory = Inventory(
        vaccine_id=PydanticObjectId(),
        batch_number="HB-1001",
        quantity_on_hand=120,
        location="North storage",
    )
    assert inventory.batch_number == "HB-1001"
    assert inventory.quantity_on_hand == 120
