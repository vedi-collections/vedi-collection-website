"""Application configuration, loaded from environment (12-factor)."""

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# Repo-root .env, resolved absolutely so it loads no matter the CWD
# (running uvicorn/alembic/seed from backend/ would otherwise miss it).
# In Docker this path won't exist and env vars are passed directly — harmless.
_ROOT_ENV = Path(__file__).resolve().parents[3] / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=_ROOT_ENV,
        env_file_encoding="utf-8",
        extra="ignore",  # ignore vars not modelled yet (GOOGLE_*, STORAGE_* extras, ...)
    )

    # --- Database ---
    DATABASE_URL: str = "postgresql+psycopg2://vedi:vedi@localhost:5432/vedi"

    # --- JWT ---
    JWT_SECRET: str = "dev-access-secret-change-me"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TTL_MIN: int = 30

    # --- Admin seed (the first admin, created by scripts/seed_admin.py) ---
    ADMIN_NAME: str = "Vedi Admin"
    ADMIN_EMAIL: str = "admin@vedicollections.example"
    ADMIN_PASSWORD: str = "change-me-please"
    # The single store owner. Every admin can manage products; only the owner
    # may manage the admin team (add / deactivate admins). Compared case-
    # insensitively against the signed-in admin's email.
    OWNER_EMAIL: str = "vedicollections.official@gmail.com"
    # Boutique WhatsApp number for storefront "Order on WhatsApp" deep links.
    SELLER_WHATSAPP_NUMBER: str = "919968835942"

    # --- CORS ---
    FRONTEND_ORIGIN: str = "http://localhost:3000"

    # --- Scheduler (in-process APScheduler) ---
    # No jobs run until Phase 5 registers the scheduled→live launch job.
    SCHEDULER_ENABLED: bool = False

    # --- S3-compatible object storage ---
    STORAGE_ENDPOINT: str = ""
    STORAGE_REGION: str = "ap-south-1"
    STORAGE_BUCKET: str = ""
    STORAGE_ACCESS_KEY: str = ""
    STORAGE_SECRET_KEY: str = ""
    STORAGE_PUBLIC_BASE_URL: str = ""


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
