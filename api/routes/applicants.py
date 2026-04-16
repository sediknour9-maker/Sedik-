"""REST-API für Bewerberverwaltung."""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from services.applicant_service import ApplicantService

router = APIRouter(prefix="/applicants", tags=["Bewerber"])


class ApplicantCreate(BaseModel):
    first_name: str
    last_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    desired_position: Optional[str] = None
    skills: Optional[str] = None
    experience_years: Optional[float] = None
    education: Optional[str] = None
    languages: Optional[str] = None
    availability_date: Optional[str] = None
    desired_salary: Optional[str] = None
    source: Optional[str] = None
    notes: Optional[str] = None


class ApplicantUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    desired_position: Optional[str] = None
    skills: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None


@router.get("/")
async def list_applicants(
    query: str = Query("", description="Suchbegriff"),
    status: Optional[str] = Query(None),
    skill: Optional[str] = Query(None),
    limit: int = Query(20, le=100),
    db: AsyncSession = Depends(get_db),
):
    svc = ApplicantService(db)
    applicants = await svc.search(query=query, status=status, skill=skill, limit=limit)
    return {"count": len(applicants), "applicants": [a.to_dict() for a in applicants]}


@router.post("/", status_code=201)
async def create_applicant(data: ApplicantCreate, db: AsyncSession = Depends(get_db)):
    svc = ApplicantService(db)
    applicant = await svc.create(data.model_dump(exclude_none=True))
    return applicant.to_dict()


@router.get("/{applicant_id}")
async def get_applicant(applicant_id: str, db: AsyncSession = Depends(get_db)):
    svc = ApplicantService(db)
    applicant = await svc.get(applicant_id)
    if not applicant:
        raise HTTPException(status_code=404, detail="Bewerber nicht gefunden.")
    return applicant.to_dict()


@router.patch("/{applicant_id}")
async def update_applicant(
    applicant_id: str, data: ApplicantUpdate, db: AsyncSession = Depends(get_db)
):
    svc = ApplicantService(db)
    applicant = await svc.update(applicant_id, data.model_dump(exclude_none=True))
    if not applicant:
        raise HTTPException(status_code=404, detail="Bewerber nicht gefunden.")
    return applicant.to_dict()
