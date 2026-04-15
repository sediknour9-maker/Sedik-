"""REST-API für Genehmigungsworkflow – Human-in-the-Loop."""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from services.approval_service import ApprovalService
from services.email_service import EmailService

router = APIRouter(prefix="/approvals", tags=["Genehmigungen"])


@router.get("/")
async def list_pending_approvals(db: AsyncSession = Depends(get_db)):
    """Listet alle ausstehenden Genehmigungsanfragen."""
    svc = ApprovalService(db)
    approvals = await svc.get_pending_approvals()
    return {"count": len(approvals), "approvals": [a.to_dict() for a in approvals]}


@router.get("/{approval_id}/decide")
async def decide_approval_via_link(
    approval_id: str,
    token: str = Query(...),
    decision: str = Query(..., description="genehmigt oder abgelehnt"),
    note: str = Query("", description="Optionale Begründung"),
    db: AsyncSession = Depends(get_db),
):
    """
    Mitarbeiter klickt auf Genehmigungslink aus der E-Mail.
    GET-Endpunkt für einfache Link-Bestätigung.
    """
    if decision not in ("genehmigt", "abgelehnt"):
        raise HTTPException(status_code=400, detail="Ungültige Entscheidung. Erlaubt: genehmigt, abgelehnt")

    svc = ApprovalService(db, EmailService())
    approval = await svc.process_decision(
        approval_id=approval_id,
        token=token,
        decision=decision,
        decided_by="Mitarbeiter (E-Mail-Link)",
        decision_note=note,
    )

    if not approval:
        raise HTTPException(status_code=404, detail="Genehmigungsanfrage nicht gefunden oder Token ungültig.")

    status_text = "✅ Genehmigt" if decision == "genehmigt" else "❌ Abgelehnt"
    return {
        "message": f"{status_text}: '{approval.action_title}'",
        "approval": approval.to_dict(),
    }


class DecisionRequest(BaseModel):
    decision: str  # "genehmigt" | "abgelehnt"
    decided_by: Optional[str] = "Mitarbeiter"
    note: Optional[str] = ""


@router.post("/{approval_id}/decide")
async def decide_approval(
    approval_id: str,
    token: str = Query(...),
    body: DecisionRequest = ...,
    db: AsyncSession = Depends(get_db),
):
    """Mitarbeiter entscheidet über Genehmigungsanfrage (API-Aufruf)."""
    if body.decision not in ("genehmigt", "abgelehnt"):
        raise HTTPException(status_code=400, detail="Ungültige Entscheidung.")

    svc = ApprovalService(db, EmailService())
    approval = await svc.process_decision(
        approval_id=approval_id,
        token=token,
        decision=body.decision,
        decided_by=body.decided_by or "Mitarbeiter",
        decision_note=body.note or "",
    )

    if not approval:
        raise HTTPException(status_code=404, detail="Anfrage nicht gefunden oder Token ungültig.")

    return {"approval": approval.to_dict()}


@router.post("/expire")
async def expire_old_approvals(db: AsyncSession = Depends(get_db)):
    """Markiert abgelaufene Genehmigungsanfragen (Cron-Job-Aufruf)."""
    svc = ApprovalService(db)
    count = await svc.expire_old_approvals()
    return {"expired_count": count}
