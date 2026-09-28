from datetime import date, datetime, timezone

from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.api.v1.deps import require_roles
from app.auth.security import decode_record_qr_token
from app.models import Child, Inventory, User, VaccinationRecord, Vaccine

router = APIRouter(prefix="/doctor", tags=["doctor"])


class ResolveQrRequest(BaseModel):
    qr_token: str


class UpdateDoseRequest(BaseModel):
    dose_number: int | None = None
    administered_date: date | None = None
    notes: str | None = None
    status: str = "completed"


class AdministerDoseRequest(BaseModel):
    child_id: str
    vaccine_id: str
    dose_number: int = 1
    administered_date: date | None = None
    batch_number: str | None = None
    injection_site: str | None = None
    notes: str | None = None


@router.get("/patients")
async def list_patients(current_user: User = Depends(require_roles("doctor", "admin"))):
    try:
        children = await Child.find_all().sort("-created_at").to_list()
        res = []
        for child in children:
            records = await VaccinationRecord.find(VaccinationRecord.child_id == child.id).to_list()
            completed = sum(1 for r in records if r.status == "completed" or r.administered_date)
            res.append({
                "id": str(child.id),
                "first_name": child.first_name,
                "last_name": child.last_name,
                "date_of_birth": child.date_of_birth.date().isoformat(),
                "gender": child.gender,
                "notes": child.notes,
                "completed_count": completed,
                "total_records": len(records),
            })
        return res
    except Exception:
        from app.services.mock_store import get_demo_store
        store = get_demo_store()
        res = []
        for child in store["children"]:
            c_records = [r for r in store["records"] if r.get("child_id") == child["id"]]
            completed = sum(1 for r in c_records if r.get("status") == "completed")
            res.append({
                "id": str(child["id"]),
                "first_name": child["first_name"],
                "last_name": child["last_name"],
                "date_of_birth": child["date_of_birth"].date().isoformat(),
                "gender": child.get("gender"),
                "notes": child.get("notes"),
                "completed_count": completed,
                "total_records": len(c_records),
            })
        return res


@router.get("/patients/{child_id}/timeline")
async def get_patient_timeline(child_id: PydanticObjectId, current_user: User = Depends(require_roles("doctor", "admin"))):
    try:
        child = await Child.get(child_id)
        if not child:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")

        records = await VaccinationRecord.find(VaccinationRecord.child_id == child.id).to_list()
        vaccines = await Vaccine.find_all().to_list()
        v_map = {v.id: v for v in vaccines}

        res = []
        for rec in records:
            vac = v_map.get(rec.vaccine_id)
            res.append({
                "record_id": str(rec.id),
                "vaccine_id": str(rec.vaccine_id),
                "vaccine_name": vac.name if vac else "Unknown Vaccine",
                "disease_target": vac.disease_target if vac else "",
                "dose_number": rec.dose_number or 1,
                "administered_date": rec.administered_date.date().isoformat() if rec.administered_date else None,
                "status": rec.status,
                "notes": rec.notes,
            })
        return {
            "child": {
                "id": str(child.id),
                "full_name": f"{child.first_name} {child.last_name}",
                "date_of_birth": child.date_of_birth.date().isoformat(),
                "gender": child.gender,
                "notes": child.notes,
            },
            "records": res,
        }
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))


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
        obj_id = PydanticObjectId(record_id)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid QR token") from exc

    # Try matching as VaccinationRecord
    try:
        record = await VaccinationRecord.get(obj_id)
        if record:
            vaccine = await Vaccine.get(record.vaccine_id)
            child = await Child.get(record.child_id)
            return {
                "type": "record",
                "record_id": str(record.id),
                "child_id": str(record.child_id),
                "child_name": f"{child.first_name} {child.last_name}" if child else "Unknown Child",
                "vaccine_id": str(record.vaccine_id),
                "vaccine_name": vaccine.name if vaccine else None,
                "dose_number": record.dose_number,
                "administered_date": record.administered_date.isoformat() if record.administered_date else None,
                "status": record.status,
                "notes": record.notes,
            }
    except Exception:
        pass

    # Try matching as Child
    try:
        child = await Child.get(obj_id)
        if child:
            # Return child info and next pending vaccine
            records = await VaccinationRecord.find(VaccinationRecord.child_id == child.id).to_list()
            pending = next((r for r in records if r.status != "completed" and not r.administered_date), None)
            vac = await Vaccine.get(pending.vaccine_id) if pending else None
            return {
                "type": "child_passport",
                "record_id": str(pending.id) if pending else None,
                "child_id": str(child.id),
                "child_name": f"{child.first_name} {child.last_name}",
                "child_dob": child.date_of_birth.date().isoformat(),
                "child_gender": child.gender,
                "vaccine_id": str(pending.vaccine_id) if pending else None,
                "vaccine_name": vac.name if vac else None,
                "dose_number": pending.dose_number if pending else 1,
                "status": "verified_patient",
                "notes": child.notes,
            }
    except Exception:
        pass

    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vaccination record not found")


@router.post("/administer")
async def administer_dose(
    payload: AdministerDoseRequest,
    current_user: User = Depends(require_roles("doctor", "admin")),
):
    try:
        child_oid = PydanticObjectId(payload.child_id)
        vac_oid = PydanticObjectId(payload.vaccine_id)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid child or vaccine ID") from exc

    child = await Child.get(child_oid)
    if not child:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child not found")

    vaccine = await Vaccine.get(vac_oid)
    if not vaccine:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vaccine not found")

    # Check if existing pending record exists
    record = await VaccinationRecord.find_one(
        VaccinationRecord.child_id == child_oid,
        VaccinationRecord.vaccine_id == vac_oid,
    )

    admin_date = datetime.combine(payload.administered_date or date.today(), datetime.min.time(), tzinfo=timezone.utc)
    notes_combined = payload.notes or ""
    if payload.batch_number:
        notes_combined = f"Lot #{payload.batch_number}. {notes_combined}".strip()
    if payload.injection_site:
        notes_combined = f"{notes_combined} [Site: {payload.injection_site}]".strip()

    if record:
        record.status = "completed"
        record.dose_number = payload.dose_number
        record.administered_date = admin_date
        record.verified_by = current_user.id
        record.notes = notes_combined
        await record.save()
    else:
        record = VaccinationRecord(
            child_id=child_oid,
            vaccine_id=vac_oid,
            dose_number=payload.dose_number,
            administered_date=admin_date,
            status="completed",
            notes=notes_combined,
            verified_by=current_user.id,
        )
        await record.insert()

    return {
        "success": True,
        "record_id": str(record.id),
        "child_name": f"{child.first_name} {child.last_name}",
        "vaccine_name": vaccine.name,
        "dose_number": record.dose_number,
        "administered_date": admin_date.date().isoformat(),
        "verified_by_doctor": current_user.full_name,
        "notes": record.notes,
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
        record.administered_date = datetime.combine(payload.administered_date, datetime.min.time(), tzinfo=timezone.utc)
    if payload.notes is not None:
        record.notes = payload.notes
    if payload.status:
        record.status = payload.status
    record.verified_by = current_user.id

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
