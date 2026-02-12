"""
Workflow Builder Lite API.
- Serves /api/* (workflows, runs, health). All workflow/run routes require X-Browser-ID.
- If STATIC_DIR is set (e.g. in Docker), also serves the frontend SPA at / and /assets.
"""
import logging
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from app.api import api_router
from app.core.config import settings

logger = logging.getLogger(__name__)

app = FastAPI(
    title="Workflow Builder Lite API",
    version="0.1.0",
    description="Workflow Builder Lite – all workflow/run endpoints require **X-Browser-ID** header.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)

# Optional: serve frontend static files (used in Docker / single-service deployment)
_static_dir = (getattr(settings, "static_dir", None) or "").strip()
_static_path = Path(_static_dir) if _static_dir else None


@app.get("/")
async def root():
    if _static_path and _static_path.is_dir():
        return FileResponse(_static_path / "index.html")
    return {"message": "Workflow Builder Lite API", "docs": "/docs", "api_prefix": settings.api_prefix}


if _static_path and _static_path.is_dir():
    assets_dir = _static_path / "assets"
    if assets_dir.is_dir():
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        """Serve index.html for SPA client-side routes (e.g. /workflows, /runs)."""
        if full_path.startswith("api/") or full_path == "api":
            from fastapi.responses import JSONResponse
            return JSONResponse(status_code=404, content={"detail": "Not Found"})
        return FileResponse(_static_path / "index.html")


@app.exception_handler(Exception)
async def unhandled_exception_handler(request, exc):
    """Return JSON on unhandled errors; log traceback for debugging."""
    logger.exception("Unhandled exception: %s", exc)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "type": type(exc).__name__},
    )
