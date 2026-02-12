from pathlib import Path

from pydantic_settings import BaseSettings

# Project root (backend's parent); .env there is loaded first so GEMINI_API_KEY works when running from backend/
# __file__ = backend/app/core/config.py -> parent.parent.parent = backend, parent^4 = project root
_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent


class Settings(BaseSettings):
    """Application settings from environment."""

    # Database
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/workflows"
    database_ssl_no_verify: bool = False

    # Upstash Redis (optional – workflow cache; leave empty to disable)
    upstash_redis_rest_url: str = ""
    upstash_redis_rest_token: str = ""

    # Gemini (for step execution)
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"  # e.g. gemini-2.5-flash, gemini-2.5-pro, gemini-2.0-flash

    # App
    api_prefix: str = "/api"
    # When set (e.g. in Docker), serve frontend static files and SPA fallback from this directory
    static_dir: str = ""

    class Config:
        env_file = (str(_PROJECT_ROOT / ".env"), ".env", "../.env")
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()
