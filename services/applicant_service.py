"""CRUD-Service für Bewerber."""

import json
import logging
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_

from models import Applicant, QualificationCheck

logger = logging.getLogger(__name__)


class ApplicantService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, data: dict) -> Applicant:
        applicant = Applicant(**{k: v for k, v in data.items() if hasattr(Applicant, k)})
        self.db.add(applicant)
        await self.db.flush()
        logger.info(f"Bewerber angelegt: {applicant.id} – {applicant.full_name}")
        return applicant

    async def get(self, applicant_id: str) -> Optional[Applicant]:
        result = await self.db.execute(select(Applicant).where(Applicant.id == applicant_id))
        return result.scalar_one_or_none()

    async def search(
        self,
        query: str = "",
        status: Optional[str] = None,
        skill: Optional[str] = None,
        limit: int = 20,
    ) -> List[Applicant]:
        stmt = select(Applicant)
        filters = []
        if query:
            filters.append(
                or_(
                    Applicant.first_name.ilike(f"%{query}%"),
                    Applicant.last_name.ilike(f"%{query}%"),
                    Applicant.email.ilike(f"%{query}%"),
                    Applicant.desired_position.ilike(f"%{query}%"),
                )
            )
        if status:
            filters.append(Applicant.status == status)
        if skill:
            filters.append(Applicant.skills.ilike(f"%{skill}%"))
        if filters:
            stmt = stmt.where(*filters)
        stmt = stmt.order_by(Applicant.created_at.desc()).limit(limit)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def update(self, applicant_id: str, data: dict) -> Optional[Applicant]:
        applicant = await self.get(applicant_id)
        if not applicant:
            return None
        for key, value in data.items():
            if hasattr(applicant, key) and key not in ("id", "created_at"):
                setattr(applicant, key, value)
        await self.db.flush()
        return applicant

    async def update_status(self, applicant_id: str, status: str) -> Optional[Applicant]:
        return await self.update(applicant_id, {"status": status})

    async def find_by_phone(self, phone: str) -> Optional[Applicant]:
        result = await self.db.execute(
            select(Applicant).where(Applicant.phone == phone)
        )
        return result.scalar_one_or_none()

    async def find_by_email(self, email: str) -> Optional[Applicant]:
        result = await self.db.execute(
            select(Applicant).where(Applicant.email == email)
        )
        return result.scalar_one_or_none()

    async def get_all(self, limit: int = 100) -> List[Applicant]:
        result = await self.db.execute(
            select(Applicant).order_by(Applicant.created_at.desc()).limit(limit)
        )
        return list(result.scalars().all())
