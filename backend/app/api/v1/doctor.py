from datetime import date, datetime

from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.api.v1.deps import require_roles
from app.auth.security import decode_record_qr_token
from app.models import User, VaccinationRecord, Vaccine

router = APIRouter(prefix="/doctor", tags=["doctor"])


class ResolveQrRequest(BaseModel):
    qr_token: str


class UpdateDoseRequest(BaseModel):
    dose_number: int | None = None
    administered_date: date | None = None
    notes: str | None = None
    status: str = "completed"


@router.post("/qr/resolve", response_model=dict)
async def resolve_qr_record(
    payload: ResolveQrRequest,
    current_user: User = Depends(require_roles("doctor", "admin")),
):
    try:
        record_id = decode_record_qr_token(payload.qr_token)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid QR token") from exc

    try:
        record = await VaccinationRecord.get(PydanticObjectId(record_id))
    except Exception as exc:  # malformed ObjectId string inside an otherwise-valid token
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid QR token") from exc

    if record is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vaccination record not found")

    vaccine = await Vaccine.get(record.vaccine_id)
    return {
        "record_id": str(record.id),
        "child_id": str(record.child_id),
        "vaccine_id": str(record.vaccine_id),
        "vaccine_name": vaccine.name if vaccine else None,
        "dose_number": record.dose_number,
        "administered_date": record.administered_date.isoformat() if record.administered_date else None,
        "status": record.status,
    }


@router.patch("/records/{record_id}")
async def update_record_dose(
    record_id: PydanticObjectId,
    payload: UpdateDoseRequest,
    current_user: User = Depends(require_roles("doctor", "admin")),
):
    record = await VaccinationRecord.get(record_id)
    if record is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vaccination record not found")

    if payload.dose_number is not None:
        record.dose_number = payload.dose_number
    if payload.administered_date is not None:
        record.administered_date = datetime.combine(payload.administered_date, datetime.min.time())
    if payload.notes is not None:
        record.notes = payload.notes
    if payload.status:
        record.status = payload.status

    await record.save()
    return {
        "record_id": str(record.id),
        "child_id": str(record.child_id),
        "vaccine_id": str(record.vaccine_id),
        "dose_number": record.dose_number,
        "administered_date": record.administered_date.isoformat() if record.administered_date else None,
        "status": record.status,
        "notes": record.notes,
    }
