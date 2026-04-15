"""CRUD-Service für Aufträge."""

import logging
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_

from models import JobOrder

logger = logging.getLogger(__name__)


class JobOrderService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, data: dict) -> JobOrder:
        order = JobOrder(**{k: v for k, v in data.items() if hasattr(JobOrder, k)})
        self.db.add(order)
        await self.db.flush()
        logger.info(f"Auftrag angelegt: {order.id} – {order.title} @ {order.company_name}")
        return order

    async def get(self, order_id: str) -> Optional[JobOrder]:
        result = await self.db.execute(select(JobOrder).where(JobOrder.id == order_id))
        return result.scalar_one_or_none()

    async def search(
        self,
        query: str = "",
        status: Optional[str] = None,
        company: Optional[str] = None,
        limit: int = 20,
    ) -> List[JobOrder]:
        stmt = select(JobOrder)
        filters = []
        if query:
            filters.append(
                or_(
                    JobOrder.title.ilike(f"%{query}%"),
                    JobOrder.company_name.ilike(f"%{query}%"),
                    JobOrder.location.ilike(f"%{query}%"),
                )
            )
        if status:
            filters.append(JobOrder.status == status)
        if company:
            filters.append(JobOrder.company_name.ilike(f"%{company}%"))
        if filters:
            stmt = stmt.where(*filters)
        stmt = stmt.order_by(JobOrder.created_at.desc()).limit(limit)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def update(self, order_id: str, data: dict) -> Optional[JobOrder]:
        order = await self.get(order_id)
        if not order:
            return None
        for key, value in data.items():
            if hasattr(order, key) and key not in ("id", "created_at"):
                setattr(order, key, value)
        await self.db.flush()
        return order

    async def get_open_orders(self) -> List[JobOrder]:
        result = await self.db.execute(
            select(JobOrder).where(JobOrder.status == "offen")
            .order_by(JobOrder.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_all(self, limit: int = 100) -> List[JobOrder]:
        result = await self.db.execute(
            select(JobOrder).order_by(JobOrder.created_at.desc()).limit(limit)
        )
        return list(result.scalars().all())
