"""Application configuration, loaded from environment (12-factor)."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",  # ignore Phase 4+ vars (SMTP_*, GOOGLE_*, ...) not modelled yet
    )

    # --- Database ---
    DATABASE_URL: str = "postgresql+psycopg2://vedi:vedi@localhost:5432/vedi"

    # --- JWT ---
    JWT_SECRET: str = "dev-access-secret-change-me"
    JWT_REFRESH_SECRET: str = "dev-refresh-secret-change-me"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TTL_MIN: int = 30
    JWT_REFRESH_TTL_DAYS: int = 7

    # --- Seller seed ---
    SELLER_EMAIL: str = "seller@vedicollections.example"
    SELLER_PASSWORD: str = "change-me-please"
    SELLER_WHATSAPP_NUMBER: str = "919999999999"

    # --- CORS ---
    FRONTEND_ORIGIN: str = "http://localhost:3000"

    # --- Meta Graph API / catalog sync ---
    META_ACCESS_TOKEN: str = ""
    META_CATALOG_ID: str = ""
    META_GRAPH_API_VERSION: str = "v21.0"
    META_GRAPH_API_BASE_URL: str = "https://graph.facebook.com"
    CATALOG_SYNC_INTERVAL_MINUTES: int = 30
    CATALOG_SYNC_SCHEDULER_ENABLED: bool = False

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
