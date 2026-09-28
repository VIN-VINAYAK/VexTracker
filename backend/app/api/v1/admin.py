from datetime import date, datetime

from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.api.v1.deps import require_roles
from app.models import HealthcareCenter, Inventory, User, VaccinationSchedule, Vaccine

router = APIRouter(prefix="/admin", tags=["admin"])


class VaccineCreateUpdate(BaseModel):
    name: str
    disease_target: str | None = None
    description: str | None = None
    recommended_age_months: str | None = None


class CenterCreateUpdate(BaseModel):
    name: str
    code: str | None = None
    address: str | None = None
    phone: str | None = None
    email: str | None = None
    contact_person: str | None = None


class InventoryCreateUpdate(BaseModel):
    vaccine_id: PydanticObjectId
    batch_number: str | None = None
    quantity_on_hand: int = 0
    expiry_date: date | None = None
    location: str | None = None


class ScheduleCreateUpdate(BaseModel):
    vaccine_id: PydanticObjectId
    child_id: PydanticObjectId
    due_month: int
    recommended_date: date | None = None
    status: str = "pending"


@router.get("/vaccines")
async def list_vaccines(current_user: User = Depends(require_roles("admin", "doctor"))):
    return await Vaccine.find_all().sort("+name").to_list()


@router.post("/vaccines", status_code=status.HTTP_201_CREATED)
async def create_vaccine(payload: VaccineCreateUpdate, current_user: User = Depends(require_roles("admin"))):
    existing = await Vaccine.find_one(Vaccine.name == payload.name)
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Vaccine already exists")

    vaccine = Vaccine(**payload.model_dump())
    await vaccine.insert()
    return vaccine


@router.get("/vaccines/{vaccine_id}")
async def get_vaccine(vaccine_id: PydanticObjectId, current_user: User = Depends(require_roles("admin", "doctor"))):
    vaccine = await Vaccine.get(vaccine_id)
    if vaccine is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vaccine not found")
    return vaccine


@router.put("/vaccines/{vaccine_id}")
async def update_vaccine(
    vaccine_id: PydanticObjectId,
    payload: VaccineCreateUpdate,
    current_user: User = Depends(require_roles("admin")),
):
    vaccine = await Vaccine.get(vaccine_id)
    if vaccine is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vaccine not found")

    for field, value in payload.model_dump().items():
        setattr(vaccine, field, value)

    await vaccine.save()
    return vaccine


@router.delete("/vaccines/{vaccine_id}")
async def delete_vaccine(vaccine_id: PydanticObjectId, current_user: User = Depends(require_roles("admin"))):
    vaccine = await Vaccine.get(vaccine_id)
    if vaccine is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vaccine not found")

    await vaccine.delete()
    return {"deleted": True, "vaccine_id": str(vaccine_id)}


@router.get("/centers")
async def list_centers(current_user: User = Depends(require_roles("admin", "doctor"))):
    return await HealthcareCenter.find_all().sort("+name").to_list()


@router.post("/centers", status_code=status.HTTP_201_CREATED)
async def create_center(payload: CenterCreateUpdate, current_user: User = Depends(require_roles("admin"))):
    existing = await HealthcareCenter.find_one(HealthcareCenter.name == payload.name)
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Center already exists")

    center = HealthcareCenter(**payload.model_dump())
    await center.insert()
    return center


@router.get("/centers/{center_id}")
async def get_center(center_id: PydanticObjectId, current_user: User = Depends(require_roles("admin", "doctor"))):
    center = await HealthcareCenter.get(center_id)
    if center is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Center not found")
    return center


@router.put("/centers/{center_id}")
async def update_center(
    center_id: PydanticObjectId,
    payload: CenterCreateUpdate,
    current_user: User = Depends(require_roles("admin")),
):
    center = await HealthcareCenter.get(center_id)
    if center is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Center not found")

    for field, value in payload.model_dump().items():
        setattr(center, field, value)

    await center.save()
    return center


@router.delete("/centers/{center_id}")
async def delete_center(center_id: PydanticObjectId, current_user: User = Depends(require_roles("admin"))):
    center = await HealthcareCenter.get(center_id)
    if center is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Center not found")

    await center.delete()
    return {"deleted": True, "center_id": str(center_id)}


@router.get("/inventory")
async def list_inventory(current_user: User = Depends(require_roles("admin", "doctor"))):
    items = await Inventory.find_all().to_list()
    return [
        {
            "id": str(item.id),
            "vaccine_id": str(item.vaccine_id),
            "batch_number": item.batch_number,
            "quantity_on_hand": item.quantity_on_hand,
            "expiry_date": item.expiry_date.isoformat() if item.expiry_date else None,
            "location": item.location,
            "updated_at": item.updated_at.isoformat() if item.updated_at else None,
        }
        for item in items
    ]


@router.post("/inventory", status_code=status.HTTP_201_CREATED)
async def create_inventory_item(payload: InventoryCreateUpdate, current_user: User = Depends(require_roles("admin"))):
    vaccine = await Vaccine.get(payload.vaccine_id)
    if vaccine is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vaccine not found")

    item = Inventory(
        vaccine_id=payload.vaccine_id,
        batch_number=payload.batch_number,
        quantity_on_hand=payload.quantity_on_hand,
        expiry_date=datetime.combine(payload.expiry_date, datetime.min.time()) if payload.expiry_date else None,
        location=payload.location,
    )
    await item.insert()
    return item


@router.put("/inventory/{item_id}")
async def update_inventory_item(
    item_id: PydanticObjectId,
    payload: InventoryCreateUpdate,
    current_user: User = Depends(require_roles("admin")),
):
    item = await Inventory.get(item_id)
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inventory item not found")

    item.vaccine_id = payload.vaccine_id
    item.batch_number = payload.batch_number
    item.quantity_on_hand = payload.quantity_on_hand
    item.expiry_date = datetime.combine(payload.expiry_date, datetime.min.time()) if payload.expiry_date else None
    item.location = payload.location
    item.updated_at = datetime.utcnow()
    await item.save()
    return item


@router.delete("/inventory/{item_id}")
async def delete_inventory_item(item_id: PydanticObjectId, current_user: User = Depends(require_roles("admin"))):
    item = await Inventory.get(item_id)
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inventory item not found")

    await item.delete()
    return {"deleted": True, "item_id": str(item_id)}


@router.get("/schedules")
async def list_schedules(current_user: User = Depends(require_roles("admin", "doctor"))):
    return await VaccinationSchedule.find_all().to_list()


@router.post("/schedules", status_code=status.HTTP_201_CREATED)
async def create_schedule(payload: ScheduleCreateUpdate, current_user: User = Depends(require_roles("admin"))):
    schedule = VaccinationSchedule(**payload.model_dump())
    await schedule.insert()
    return schedule


@router.put("/schedules/{schedule_id}")
async def update_schedule(
    schedule_id: PydanticObjectId,
    payload: ScheduleCreateUpdate,
    current_user: User = Depends(require_roles("admin")),
):
    schedule = await VaccinationSchedule.get(schedule_id)
    if schedule is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Schedule not found")

    for field, value in payload.model_dump().items():
        setattr(schedule, field, value)

    await schedule.save()
    return schedule


@router.delete("/schedules/{schedule_id}")
async def delete_schedule(schedule_id: PydanticObjectId, current_user: User = Depends(require_roles("admin"))):
    schedule = await VaccinationSchedule.get(schedule_id)
    if schedule is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Schedule not found")

    await schedule.delete()
    return {"deleted": True, "schedule_id": str(schedule_id)}
