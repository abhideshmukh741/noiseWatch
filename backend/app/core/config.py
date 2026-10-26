# NoiseWatch Backend
from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    """Application configuration loaded from environment variables."""

    # Supabase
    supabase_url: str = "https://your-project.supabase.co"
    supabase_anon_key: str = "your-anon-key"
    supabase_service_role_key: str = "your-service-role-key"
    database_url: str = "postgresql+asyncpg://postgres:password@localhost:5432/noisewatch"

    # JWT
    jwt_secret: str = "dev-secret-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expiration_minutes: int = 60

    # App
    app_env: str = "development"
    app_debug: bool = True
    app_host: str = "0.0.0.0"
    app_port: int = 8001
    cors_origins: str = "http://localhost:5173,http://localhost:5174,http://localhost:3000"

    # Email
    smtp_host: Optional[str] = None
    smtp_port: int = 587
    smtp_user: Optional[str] = None
    smtp_password: Optional[str] = None
    email_from: str = "noreply@noisewatch.app"

    # Storage buckets
    evidence_bucket: str = "evidence-files"
    reports_bucket: str = "generated-reports"

    # ML
    ml_model_path: str = "./ml/models/"
    ml_model_version: str = "baseline-v1"

    # AI & Groq LLM
    groq_api_key: Optional[str] = None
    groq_model: str = "openai/gpt-oss-120b"

    # Demo Mode
    demo_mode: bool = True

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",")]

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
