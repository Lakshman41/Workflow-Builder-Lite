from fastapi import APIRouter

from app.api.routes import health, runs, workflows
from app.core.config import settings

api_router = APIRouter(prefix=settings.api_prefix)
api_router.include_router(workflows.router)
api_router.include_router(runs.router)
api_router.include_router(health.router)
