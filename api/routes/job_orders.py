"""REST-API für Auftragsverwaltung."""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from services.job_order_service import JobOrderService

router = APIRouter(prefix="/job-orders", tags=["Auftr\u00e4ge"])


class JobOrderCreate(BaseModel):
    company_name: str
    title: str
    company_contact_name: Optional[str] = None
    company_contact_email: Optional[str] = None
    company_contact_phone: Optional[str] = None
    description: Optional[str] = None
    required_skills: Optional[str] = None
    required_experience_years: Optional[float] = None
    location: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    positions_count: int = 1
    hourly_rate_min: Optional[float] = None
    hourly_rate_max: Optional[float] = None
    shift_type: Optional[str] = None
    priority: str = "normal"
    notes: Optional[str] = None


@router.get("/")
async def list_job_orders(
    query: str = Query(""),
    status: Optional[str] = Query(None),
    company: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    svc = JobOrderService(db)
    orders = await svc.search(query=query, status=status, company=company)
    return {"count": len(orders), "job_orders": [o.to_dict() for o in orders]}


@router.get("/open")
async def get_open_orders(db: AsyncSession = Depends(get_db)):
    svc = JobOrderService(db)
    orders = await svc.get_open_orders()
    return {"count": len(orders), "job_orders": [o.to_dict() for o in orders]}


@router.post("/", status_code=201)
async def create_job_order(data: JobOrderCreate, db: AsyncSession = Depends(get_db)):
    svc = JobOrderService(db)
    order = await svc.create(data.model_dump(exclude_none=True))
    return order.to_dict()


@router.get("/{order_id}")
async def get_job_order(order_id: str, db: AsyncSession = Depends(get_db)):
    svc = JobOrderService(db)
    order = await svc.get(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Auftrag nicht gefunden.")
    return order.to_dict()


@router.patch("/{order_id}")
async def update_job_order(order_id: str, data: dict, db: AsyncSession = Depends(get_db)):
    svc = JobOrderService(db)
    order = await svc.update(order_id, data)
    if not order:
        raise HTTPException(status_code=404, detail="Auftrag nicht gefunden.")
    return order.to_dict()
