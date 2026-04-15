"""Service für Terminverwaltung."""

import secrets
import logging
from datetime import datetime
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from models import Appointment

logger = logging.getLogger(__name__)


class AppointmentService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, data: dict) -> Appointment:
        data["confirmation_token"] = secrets.token_urlsafe(32)
        appt = Appointment(**{k: v for k, v in data.items() if hasattr(Appointment, k)})
        self.db.add(appt)
        await self.db.flush()
        logger.info(f"Termin angelegt: {appt.id} – {appt.title}")
        return appt

    async def get(self, appt_id: str) -> Optional[Appointment]:
        result = await self.db.execute(select(Appointment).where(Appointment.id == appt_id))
        return result.scalar_one_or_none()

    async def get_by_applicant(self, applicant_id: str) -> List[Appointment]:
        result = await self.db.execute(
            select(Appointment)
            .where(Appointment.applicant_id == applicant_id)
            .order_by(Appointment.scheduled_at.desc())
        )
        return list(result.scalars().all())

    async def update(self, appt_id: str, data: dict) -> Optional[Appointment]:
        appt = await self.get(appt_id)
        if not appt:
            return None
        for key, value in data.items():
            if hasattr(appt, key) and key not in ("id", "created_at"):
                setattr(appt, key, value)
        await self.db.flush()
        return appt

    async def confirm_by_applicant(self, token: str) -> Optional[Appointment]:
        result = await self.db.execute(
            select(Appointment).where(Appointment.confirmation_token == token)
        )
        appt = result.scalar_one_or_none()
        if appt:
            appt.applicant_confirmed = True
            appt.status = "bestätigt"
            await self.db.flush()
        return appt

    async def get_upcoming(self, days: int = 7) -> List[Appointment]:
        now = datetime.utcnow()
        result = await self.db.execute(
            select(Appointment)
            .where(
                Appointment.scheduled_at >= now,
                Appointment.status.in_(["bestätigt", "eingeladen", "vorgeschlagen"]),
            )
            .order_by(Appointment.scheduled_at)
        )
        return list(result.scalars().all())

    async def get_all(self, limit: int = 50) -> List[Appointment]:
        result = await self.db.execute(
            select(Appointment).order_by(Appointment.scheduled_at.desc()).limit(limit)
        )
        return list(result.scalars().all())
