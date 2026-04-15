"""REST-API für Terminverwaltung."""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from services.appointment_service import AppointmentService

router = APIRouter(prefix="/appointments", tags=["Termine"])


@router.get("/")
async def list_appointments(
    limit: int = Query(20, le=100),
    db: AsyncSession = Depends(get_db),
):
    svc = AppointmentService(db)
    appointments = await svc.get_all(limit=limit)
    return {"count": len(appointments), "appointments": [a.to_dict() for a in appointments]}


@router.get("/upcoming")
async def get_upcoming_appointments(
    days: int = Query(7, description="Anzahl Tage voraus"),
    db: AsyncSession = Depends(get_db),
):
    svc = AppointmentService(db)
    appointments = await svc.get_upcoming(days=days)
    return {"count": len(appointments), "appointments": [a.to_dict() for a in appointments]}


@router.get("/{appointment_id}")
async def get_appointment(appointment_id: str, db: AsyncSession = Depends(get_db)):
    svc = AppointmentService(db)
    appt = await svc.get(appointment_id)
    if not appt:
        raise HTTPException(status_code=404, detail="Termin nicht gefunden.")
    return appt.to_dict()


@router.get("/{appointment_id}/confirm")
async def confirm_appointment_by_applicant(
    appointment_id: str,
    token: str = Query(..., description="Bestätigungs-Token"),
    db: AsyncSession = Depends(get_db),
):
    """Bewerber bestätigt Termin über E-Mail-Link."""
    svc = AppointmentService(db)
    appt = await svc.confirm_by_applicant(token)
    if not appt or appt.id != appointment_id:
        raise HTTPException(status_code=400, detail="Ungültiger Token oder Termin nicht gefunden.")
    return {
        "message": "Ihr Termin wurde erfolgreich bestätigt. Wir freuen uns auf das Gespräch!",
        "appointment": appt.to_dict(),
    }


@router.patch("/{appointment_id}")
async def update_appointment(
    appointment_id: str, data: dict, db: AsyncSession = Depends(get_db)
):
    svc = AppointmentService(db)
    appt = await svc.update(appointment_id, data)
    if not appt:
        raise HTTPException(status_code=404, detail="Termin nicht gefunden.")
    return appt.to_dict()
