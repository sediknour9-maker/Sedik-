"""Zentrale Konfiguration für den Sedik Recruiting Agent."""

from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Anthropic
    anthropic_api_key: str = ""
    claude_model: str = "claude-sonnet-4-6"

    # Datenbank
    database_url: str = "sqlite+aiosqlite:///./sedik_agent.db"

    # Twilio
    twilio_account_sid: str = ""
    twilio_auth_token: str = ""
    twilio_phone_number: str = ""

    # E-Mail
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: str = ""
    smtp_from_name: str = "Sedik Recruiting Agent"
    smtp_from_email: str = ""

    # Anwendung
    app_name: str = "Sedik AI Recruiting Agent"
    app_url: str = "http://localhost:8000"
    secret_key: str = "dev-secret-key-bitte-aendern"
    debug: bool = True

    # Agent-Verhalten
    agent_language: str = "de"
    approval_timeout_hours: int = 24
    staff_emails: str = ""
    staff_phones: str = ""

    @field_validator("staff_emails", mode="before")
    @classmethod
    def parse_emails(cls, v):
        return v or ""

    def get_staff_email_list(self) -> List[str]:
        if not self.staff_emails:
            return []
        return [e.strip() for e in self.staff_emails.split(",") if e.strip()]

    def get_staff_phone_list(self) -> List[str]:
        if not self.staff_phones:
            return []
        return [p.strip() for p in self.staff_phones.split(",") if p.strip()]


settings = Settings()
