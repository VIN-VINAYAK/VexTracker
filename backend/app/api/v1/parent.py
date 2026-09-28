from datetime import date, datetime

from beanie import PydanticObjectId
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from app.api.v1.deps import CurrentUser
from app.models import Child, Vaccine, VaccinationRecord
from app.services.authorization import user_is_guardian
from app.services.mock_store import build_memory_timeline, create_memory_child, list_memory_children_for_user, list_memory_vaccines
from app.services.scheduling import calculateDueDate, calculatePriority, getVaccineStatus

router = APIRouter(prefix="/parent", tags=["parent"])


class ChildCreateRequest(BaseModel):
    first_name: str
    last_name: str
    date_of_birth: date
    gender: str | None = None
    notes: str | None = None


@router.get("/children")
async def list_children(current_user: CurrentUser):
    try:
        children = await Child.find(Child.guardians == current_user.id).to_list()
        return [{
            "id": str(child.id),
            "first_name": child.first_name,
            "last_name": child.last_name,
            "date_of_birth": child.date_of_birth.date().isoformat(),
            "gender": child.gender,
            "notes": child.notes,
        } for child in children]
    except Exception:
        children = list_memory_children_for_user(str(current_user.id))
        return [{
            "id": child["id"],
            "first_name": child["first_name"],
            "last_name": child["last_name"],
            "date_of_birth": child["date_of_birth"].date().isoformat(),
            "gender": child.get("gender"),
            "notes": child.get("notes"),
        } for child in children]


@router.post("/children", status_code=status.HTTP_201_CREATED)
async def create_child(payload: ChildCreateRequest, current_user: CurrentUser):
    try:
        child = Child(
            guardians=[current_user.id],
            first_name=payload.first_name,
            last_name=payload.last_name,
            date_of_birth=datetime.combine(payload.date_of_birth, datetime.min.time()),
            gender=payload.gender,
            notes=payload.notes,
        )
        await child.insert()
        return {"id": str(child.id), "first_name": child.first_name, "last_name": child.last_name}
    except Exception:
        child = create_memory_child(str(current_user.id), payload.model_dump())
        return {"id": child["id"], "first_name": child["first_name"], "last_name": child["last_name"]}


@router.get("/children/{child_id}/timeline")
async def get_child_timeline(child_id: PydanticObjectId, current_user: CurrentUser):
    try:
        child = await Child.get(child_id)
        if child is None or not user_is_guardian(current_user.id, child):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child not found")

        records = await VaccinationRecord.find(VaccinationRecord.child_id == child.id).to_list()
        vaccines = await Vaccine.find_all().to_list()

        administered_lookup = {record.vaccine_id: record for record in records}
        dob = child.date_of_birth.date()

        items = []
        for vaccine in vaccines:
            due_date = calculateDueDate(dob, 6 if vaccine.name.lower().startswith("dpt") else 12)
            record = administered_lookup.get(vaccine.id)
            administered_date = record.administered_date.date() if record and record.administered_date else None
            vaccine_status = getVaccineStatus(due_date, administered_date=administered_date, as_of=date.today())
            priority = calculatePriority(vaccine_status, due_date=due_date, as_of=date.today())
            items.append(
                {
                    "vaccine_name": vaccine.name,
                    "due_date": due_date.isoformat(),
                    "status": vaccine_status,
                    "priority": priority,
                    "dose_number": record.dose_number if record else None,
                    "administered_date": administered_date.isoformat() if administered_date else None,
                }
            )

        return {"child_id": str(child.id), "items": items}
    except Exception:
        children = list_memory_children_for_user(str(current_user.id))
        target = next((item for item in children if item["id"] == str(child_id)), None)
        if target is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child not found")
        return {"child_id": str(child_id), "items": build_memory_timeline(str(child_id))}
