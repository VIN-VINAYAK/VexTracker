from .mongodb_documents import (
    AuditLog,
    Child,
    HealthcareCenter,
    Inventory,
    Notification,
    User,
    Vaccine,
    VaccinationRecord,
    VaccinationSchedule,
)

DOCUMENT_MODELS = [
    User,
    Child,
    Vaccine,
    VaccinationRecord,
    VaccinationSchedule,
    HealthcareCenter,
    Inventory,
    Notification,
    AuditLog,
]

__all__ = [
    "User",
    "Child",
    "Vaccine",
    "VaccinationRecord",
    "VaccinationSchedule",
    "HealthcareCenter",
    "Inventory",
    "Notification",
    "AuditLog",
    "DOCUMENT_MODELS",
]
