"""KI-gestützte Qualifikationsprüfung von Bewerbern."""

import json
import logging
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from models import Applicant, QualificationCheck, JobOrder

logger = logging.getLogger(__name__)


class QualificationService:
    """Prüft Qualifikationen eines Bewerbers – mit oder ohne Stellenauftrag."""

    def __init__(self, db: AsyncSession, anthropic_client=None):
        self.db = db
        self.client = anthropic_client

    async def check_qualification(
        self,
        applicant: Applicant,
        job_order: Optional[JobOrder] = None,
        agent_analysis: Optional[str] = None,
    ) -> QualificationCheck:
        """
        Prüft den Bewerber gegen eine Stelle (oder allgemein).
        Wenn ein anthropic_client vorhanden ist, nutzt es KI-Analyse.
        """
        score, skill_score, exp_score, availability, strengths, gaps, recommendation = (
            await self._analyze(applicant, job_order, agent_analysis)
        )

        check = QualificationCheck(
            applicant_id=applicant.id,
            job_order_id=job_order.id if job_order else None,
            overall_score=score,
            skill_match_score=skill_score,
            experience_match_score=exp_score,
            availability_match=availability,
            strengths=json.dumps(strengths, ensure_ascii=False),
            gaps=json.dumps(gaps, ensure_ascii=False),
            recommendation=recommendation,
            ai_analysis=agent_analysis,
            passed=score >= 60 if score is not None else None,
        )
        self.db.add(check)
        await self.db.flush()
        return check

    async def _analyze(
        self,
        applicant: Applicant,
        job_order: Optional[JobOrder],
        agent_analysis: Optional[str],
    ) -> tuple:
        """Berechnet Qualifikations-Scores."""

        # Wenn KI-Analyse bereits vorhanden (vom Agent geliefert)
        if agent_analysis:
            try:
                data = json.loads(agent_analysis)
                return (
                    data.get("overall_score"),
                    data.get("skill_match_score"),
                    data.get("experience_match_score"),
                    data.get("availability_match"),
                    data.get("strengths", []),
                    data.get("gaps", []),
                    data.get("recommendation", ""),
                )
            except Exception:
                pass

        # Einfache regelbasierte Analyse als Fallback
        if not job_order:
            return (70, 70, 70, True, ["Vollständiges Profil"], [], "Bewerber zur näheren Prüfung empfohlen.")

        strengths = []
        gaps = []
        skill_score = 50
        exp_score = 50

        # Skill-Abgleich
        if job_order.required_skills and applicant.skills:
            required = json.loads(job_order.required_skills) if job_order.required_skills.startswith("[") else [job_order.required_skills]
            applicant_skills_str = applicant.skills.lower()
            matched = [s for s in required if s.lower() in applicant_skills_str]
            skill_score = int((len(matched) / max(len(required), 1)) * 100)
            strengths.extend([f"Skill vorhanden: {s}" for s in matched])
            gaps.extend([f"Skill fehlt: {s}" for s in required if s not in matched])

        # Erfahrungs-Abgleich
        if job_order.required_experience_years and applicant.experience_years:
            if applicant.experience_years >= job_order.required_experience_years:
                exp_score = 90
                strengths.append(f"{applicant.experience_years} Jahre Erfahrung (gefordert: {job_order.required_experience_years})")
            else:
                exp_score = int((applicant.experience_years / job_order.required_experience_years) * 80)
                gaps.append(f"Nur {applicant.experience_years} von {job_order.required_experience_years} Jahren Erfahrung")

        overall = int((skill_score * 0.6 + exp_score * 0.4))
        rec = "Bewerber geeignet." if overall >= 60 else "Bewerber bedingt geeignet, weitere Prüfung empfohlen."

        return overall, skill_score, exp_score, True, strengths, gaps, rec
