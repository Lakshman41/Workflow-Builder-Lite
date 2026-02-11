import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

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


@app.get("/")
async def root():
    return {"message": "Workflow Builder Lite API", "docs": "/docs", "api_prefix": settings.api_prefix}


@app.exception_handler(Exception)
async def unhandled_exception_handler(request, exc):
    """Return JSON on unhandled errors; log traceback for debugging."""
    logger.exception("Unhandled exception: %s", exc)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "type": type(exc).__name__},
    )
