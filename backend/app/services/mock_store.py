from __future__ import annotations

from datetime import date, datetime
from types import SimpleNamespace
from uuid import uuid4

from app.auth.security import get_password_hash

_store = {
    "users": [],
    "children": [],
    "vaccines": [],
    "records": [],
    "inventory": [],
    "notes": [],
}


def _hash_password(password: str) -> str:
    return get_password_hash(password)


def seed_demo_store() -> None:
    if _store["users"]:
        return

    parent_id = str(uuid4())
    doctor_id = str(uuid4())
    admin_id = str(uuid4())
    child_id = str(uuid4())
    vaccine_ids = [str(uuid4()) for _ in range(4)]

    _store["users"] = [
        {
            "id": parent_id,
            "full_name": "Maya Patel",
            "email": "parent@vextracker.ai",
            "password_hash": _hash_password("password123"),
            "phone": "+91 98765 43210",
            "role": "parent",
            "is_active": True,
        },
        {
            "id": doctor_id,
            "full_name": "Dr. Priya Shah",
            "email": "doctor@vextracker.ai",
            "password_hash": _hash_password("password123"),
            "phone": "+91 98765 43211",
            "role": "doctor",
            "is_active": True,
        },
        {
            "id": admin_id,
            "full_name": "Alicia Grant",
            "email": "admin@vextracker.ai",
            "password_hash": _hash_password("password123"),
            "phone": "+91 98765 43212",
            "role": "admin",
            "is_active": True,
        },
    ]

    _store["children"] = [
        {
            "id": child_id,
            "guardians": [parent_id],
            "first_name": "Aarav",
            "last_name": "Patel",
            "date_of_birth": datetime(2022, 3, 10),
            "gender": "Male",
            "notes": "Mild seasonal allergies.",
        }
    ]

    _store["vaccines"] = [
        {
            "id": vaccine_ids[0],
            "name": "DTaP",
            "disease_target": "Diphtheria, Tetanus, Pertussis",
            "description": "Booster and primary dose schedule",
            "recommended_age_months": "2, 4, 6, 15-18",
        },
        {
            "id": vaccine_ids[1],
            "name": "MMR",
            "disease_target": "Measles, Mumps, Rubella",
            "description": "Childhood vaccine for measles, mumps, and rubella",
            "recommended_age_months": "12-15",
        },
        {
            "id": vaccine_ids[2],
            "name": "Polio",
            "disease_target": "Poliovirus",
            "description": "Routine polio protection",
            "recommended_age_months": "2, 4, 6-18",
        },
        {
            "id": vaccine_ids[3],
            "name": "Hepatitis B",
            "disease_target": "Hepatitis B",
            "description": "Early infant protection",
            "recommended_age_months": "0, 1, 6",
        },
    ]

    _store["records"] = [
        {
            "id": str(uuid4()),
            "child_id": child_id,
            "vaccine_id": vaccine_ids[0],
            "dose_number": 1,
            "administered_date": datetime(2024, 6, 12),
            "status": "completed",
            "notes": "Completed at local clinic.",
            "verified_by": doctor_id,
        },
        {
            "id": str(uuid4()),
            "child_id": child_id,
            "vaccine_id": vaccine_ids[2],
            "dose_number": 1,
            "administered_date": None,
            "status": "pending",
            "notes": None,
            "verified_by": None,
        },
    ]

    _store["inventory"] = [
        {
            "id": str(uuid4()),
            "vaccine_id": vaccine_ids[0],
            "batch_number": "DT-2049",
            "quantity_on_hand": 24,
            "expiry_date": datetime(2027, 4, 10),
            "location": "North storage",
            "updated_at": datetime.utcnow(),
        },
        {
            "id": str(uuid4()),
            "vaccine_id": vaccine_ids[1],
            "batch_number": "MMR-1850",
            "quantity_on_hand": 18,
            "expiry_date": datetime(2028, 1, 13),
            "location": "Cold room",
            "updated_at": datetime.utcnow(),
        },
    ]


def get_demo_store() -> dict[str, list[dict[str, object]]]:
    seed_demo_store()
    return _store


def user_to_public(user: dict[str, object]) -> SimpleNamespace:
    return SimpleNamespace(
        id=user["id"],
        full_name=user["full_name"],
        email=user["email"],
        phone=user.get("phone"),
        role=user["role"],
        is_active=user.get("is_active", True),
    )


def find_memory_user_by_email(email: str) -> dict[str, object] | None:
    seed_demo_store()
    for user in _store["users"]:
        if user["email"] == email:
            return user
    return None


def register_memory_user(payload: dict[str, object]) -> dict[str, object]:
    seed_demo_store()
    user = {
        "id": str(uuid4()),
        "full_name": str(payload["full_name"]),
        "email": str(payload["email"]),
        "password_hash": _hash_password(str(payload["password"])),
        "phone": payload.get("phone"),
        "role": str(payload.get("role", "parent")),
        "is_active": True,
    }
    _store["users"].append(user)
    return user


def login_memory_user(email: str, password: str) -> dict[str, object] | None:
    seed_demo_store()
    user = find_memory_user_by_email(email)
    if user is None:
        return None
    stored_hash = str(user["password_hash"])
    if not stored_hash:
        return None
    from app.auth.security import verify_password

    if verify_password(password, stored_hash):
        return user
    return None


def list_memory_children_for_user(user_id: str) -> list[dict[str, object]]:
    seed_demo_store()
    return [child for child in _store["children"] if user_id in child.get("guardians", [])]


def create_memory_child(user_id: str, payload: dict[str, object]) -> dict[str, object]:
    seed_demo_store()
    child = {
        "id": str(uuid4()),
        "guardians": [user_id],
        "first_name": str(payload["first_name"]),
        "last_name": str(payload["last_name"]),
        "date_of_birth": datetime.combine(payload["date_of_birth"], datetime.min.time()),
        "gender": payload.get("gender"),
        "notes": payload.get("notes"),
    }
    _store["children"].append(child)
    return child


def list_memory_vaccines() -> list[dict[str, object]]:
    seed_demo_store()
    return _store["vaccines"]


def list_memory_inventory() -> list[dict[str, object]]:
    seed_demo_store()
    return _store["inventory"]


def create_memory_vaccine(payload: dict[str, object]) -> dict[str, object]:
    seed_demo_store()
    vaccine = {
        "id": str(uuid4()),
        "name": str(payload["name"]),
        "disease_target": payload.get("disease_target"),
        "description": payload.get("description"),
        "recommended_age_months": payload.get("recommended_age_months"),
    }
    _store["vaccines"].append(vaccine)
    return vaccine


def list_memory_records_for_child(child_id: str) -> list[dict[str, object]]:
    seed_demo_store()
    return [record for record in _store["records"] if record.get("child_id") == child_id]


def build_memory_timeline(child_id: str) -> list[dict[str, object]]:
    seed_demo_store()
    child = next((item for item in _store["children"] if item["id"] == child_id), None)
    if child is None:
        return []
    child_dob = child["date_of_birth"].date()
    items = []
    for vaccine in _store["vaccines"]:
        due_date = date(child_dob.year + ((child_dob.month + 6) // 12), ((child_dob.month + 6) % 12) or 12, child_dob.day)
        if "MMR" in str(vaccine["name"]):
            due_date = date(child_dob.year + 1, 12, 15)
        if "Polio" in str(vaccine["name"]):
            due_date = date(child_dob.year + 1, 1, 15)
        record = next((r for r in _store["records"] if r.get("child_id") == child_id and r.get("vaccine_id") == vaccine["id"]), None)
        administered = record.get("administered_date") if record else None
        status = "Completed" if administered else "Upcoming"
        items.append(
            {
                "vaccine_name": vaccine["name"],
                "due_date": due_date.isoformat(),
                "status": status,
                "priority": "High" if status == "Upcoming" else "Normal",
                "dose_number": record.get("dose_number") if record else 1,
                "administered_date": administered.date().isoformat() if administered else None,
            }
        )
    return items
