import time
from typing import Any, Dict

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.services.cache import redis_status
from app.services.llm import is_available as llm_available

router = APIRouter(prefix="/health", tags=["health"])


@router.get("")
async def health(
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    start = time.perf_counter()
    db_ok = False
    try:
        await db.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        pass
    try:
        redis_status_val = await redis_status()
    except Exception:
        redis_status_val = "error"
    try:
        llm_val = "gemini_configured" if llm_available() else "gemini_not_configured"
    except Exception:
        llm_val = "error"
    elapsed_ms = (time.perf_counter() - start) * 1000

    return {
        "status": "ok" if db_ok else "degraded",
        "backend_response_time_ms": round(elapsed_ms, 2),
        "database": "connected" if db_ok else "disconnected",
        "redis": redis_status_val,
        "llm": llm_val,
    }
