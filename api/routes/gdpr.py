"""DSGVO-Endpunkte für Bewerber: Auskunft, Löschung, Einwilligung."""

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from services.gdpr_service import GdprService

router = APIRouter(prefix="/gdpr", tags=["Datenschutz (DSGVO)"])


@router.get("/applicants/{applicant_id}/export")
async def export_applicant_data(applicant_id: str, db: AsyncSession = Depends(get_db)):
    """
    DSGVO Art. 15 – Auskunftsrecht.
    Gibt alle gespeicherten Daten zu einem Bewerber zurück.
    """
    svc = GdprService(db)
    data = await svc.export_applicant_data(applicant_id)
    if "error" in data:
        raise HTTPException(status_code=404, detail=data["error"])
    return data


class DeletionRequestBody(BaseModel):
    requester_email: str = ""
    reason: str = "Antrag auf Löschung gemäß Art. 17 DSGVO"


@router.post("/applicants/{applicant_id}/delete-request", status_code=201)
async def request_deletion(
    applicant_id: str, body: DeletionRequestBody, db: AsyncSession = Depends(get_db)
):
    """
    DSGVO Art. 17 – Recht auf Vergessenwerden.
    Erstellt einen Löschantrag der von Mitarbeitern genehmigt werden muss.
    """
    svc = GdprService(db)
    req = await svc.request_deletion(
        applicant_id=applicant_id,
        requester_email=body.requester_email,
        reason=body.reason,
    )
    await svc.log(
        actor=body.requester_email or "bewerber",
        action="loeschantrag.eingereicht",
        resource_type="applicant",
        resource_id=applicant_id,
    )
    return {
        "message": "Löschantrag eingegangen. Wird innerhalb von 30 Tagen bearbeitet (DSGVO Art. 17).",
        "request_id": req.id,
    }


@router.post("/applicants/{applicant_id}/anonymize")
async def anonymize_applicant(
    applicant_id: str,
    processed_by: str = Query("mitarbeiter"),
    db: AsyncSession = Depends(get_db),
):
    """Anonymisiert einen Bewerber (nur für autorisierte Mitarbeiter)."""
    svc = GdprService(db)
    success = await svc.anonymize_applicant(applicant_id, processed_by)
    if not success:
        raise HTTPException(status_code=404, detail="Bewerber nicht gefunden.")
    return {"message": "Bewerber erfolgreich anonymisiert.", "applicant_id": applicant_id}


@router.post("/applicants/{applicant_id}/consent")
async def record_consent(
    applicant_id: str,
    consent_type: str = Query(..., description="datenspeicherung | kontaktaufnahme | weitergabe_kunde"),
    given_via: str = Query("chat"),
    db: AsyncSession = Depends(get_db),
):
    """Speichert eine DSGVO-Einwilligung."""
    svc = GdprService(db)
    consent = await svc.record_consent(applicant_id, consent_type, given_via)
    return {"message": "Einwilligung gespeichert.", "consent": consent.to_dict()}


@router.delete("/applicants/{applicant_id}/consent/{consent_type}")
async def revoke_consent(
    applicant_id: str,
    consent_type: str,
    reason: str = Query(""),
    db: AsyncSession = Depends(get_db),
):
    """Widerruft eine Einwilligung (DSGVO Art. 7 Abs. 3)."""
    svc = GdprService(db)
    consent = await svc.revoke_consent(applicant_id, consent_type, reason)
    if not consent:
        raise HTTPException(status_code=404, detail="Einwilligung nicht gefunden.")
    return {"message": "Einwilligung widerrufen.", "consent": consent.to_dict()}


@router.get("/audit-log")
async def get_global_audit_log(
    resource_id: str = Query(None),
    limit: int = Query(100, le=500),
    db: AsyncSession = Depends(get_db),
):
    """Vollständiges Audit-Log (nur für Admins / DSB)."""
    svc = GdprService(db)
    logs = await svc.get_audit_log(resource_id=resource_id, limit=limit)
    return {"count": len(logs), "logs": [l.to_dict() for l in logs]}
