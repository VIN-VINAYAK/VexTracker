from datetime import datetime, timezone
from typing import Literal

from beanie import Document, PydanticObjectId
from pydantic import BaseModel, Field
from pymongo import IndexModel


class User(Document):
    full_name: str
    email: str
    phone: str | None = None
    password_hash: str
    role: Literal["parent", "doctor", "admin"] = "parent"
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "users"
        indexes = [
            IndexModel([("email", 1)], unique=True),
            IndexModel([("role", 1)]),
        ]


class Child(Document):
    guardians: list[PydanticObjectId] = Field(default_factory=list)
    first_name: str
    last_name: str
    date_of_birth: datetime
    gender: str | None = None
    notes: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "children"
        indexes = [
            IndexModel([("guardians", 1)]),
            IndexModel([("created_at", -1)]),
        ]


class Vaccine(Document):
    name: str
    disease_target: str | None = None
    description: str | None = None
    recommended_age_months: str | None = None

    class Settings:
        name = "vaccines"
        indexes = [IndexModel([("name", 1)], unique=True)]


class VaccinationRecord(Document):
    """One dose entry for one child. Its own collection (not embedded in Child)
    because doctors need to look a record up directly by ID via QR, independent
    of which child it belongs to."""

    child_id: PydanticObjectId
    vaccine_id: PydanticObjectId
    dose_number: int | None = None
    administered_date: datetime | None = None
    status: str = "pending"
    notes: str | None = None
    verified_by: PydanticObjectId | None = None

    class Settings:
        name = "vaccination_records"
        indexes = [
            IndexModel([("child_id", 1)]),
            IndexModel([("vaccine_id", 1)]),
        ]


class VaccinationSchedule(Document):
    """A scheduled/assigned dose for a specific child (what the admin dashboard manages)."""

    vaccine_id: PydanticObjectId
    child_id: PydanticObjectId
    due_month: int
    recommended_date: datetime | None = None
    status: str = "pending"

    class Settings:
        name = "vaccination_schedules"
        indexes = [
            IndexModel([("child_id", 1)]),
            IndexModel([("vaccine_id", 1)]),
        ]


class HealthcareCenter(Document):
    name: str
    code: str | None = None
    address: str | None = None
    phone: str | None = None
    email: str | None = None
    contact_person: str | None = None

    class Settings:
        name = "healthcare_centers"
        indexes = [IndexModel([("name", 1)], unique=True)]


class Inventory(Document):
    vaccine_id: PydanticObjectId
    healthcare_center_id: PydanticObjectId | None = None
    batch_number: str | None = None
    quantity_on_hand: int = 0
    min_stock: int = 0
    expiry_date: datetime | None = None
    location: str | None = None
    consumption_rate: float = 0.0
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "inventory"
        indexes = [
            IndexModel([("vaccine_id", 1)]),
            IndexModel([("expiry_date", 1)]),
        ]


class Notification(Document):
    child_id: PydanticObjectId
    user_id: PydanticObjectId | None = None
    type: str = "reminder"
    sent_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    status: Literal["queued", "sent", "failed"] = "queued"
    message: str | None = None

    class Settings:
        name = "notifications"
        indexes = [
            IndexModel([("child_id", 1)]),
            IndexModel([("status", 1)]),
        ]


class AuditLog(Document):
    user_id: PydanticObjectId | None = None
    action: str
    target: str | None = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    details: str | None = None

    class Settings:
        name = "audit_logs"
        indexes = [
            IndexModel([("user_id", 1)]),
            IndexModel([("timestamp", -1)]),
        ]

