"""
Upstash Redis workflow cache: key workflow:{id}, TTL 1h.
Used to cache GET workflow by id; invalidated on update/delete.
Uses Upstash REST API (serverless-friendly, easy to deploy).
"""
from __future__ import annotations

import json
import logging
from typing import Any, Optional
from uuid import UUID

from app.core.config import settings

logger = logging.getLogger(__name__)

WORKFLOW_CACHE_PREFIX = "workflow:"
WORKFLOW_CACHE_TTL = 3600  # 1 hour

_redis_client: Optional[Any] = None


def _get_client():
    """Lazy Upstash Redis client (async). Returns None if not configured or connection fails."""
    global _redis_client
    if _redis_client is None:
        url = (getattr(settings, "upstash_redis_rest_url", None) or "").strip()
        token = (getattr(settings, "upstash_redis_rest_token", None) or "").strip()
        if not url or not token:
            _redis_client = False
        else:
            try:
                from upstash_redis.asyncio import Redis
                _redis_client = Redis(
                    url=url,
                    token=token,
                    allow_telemetry=False,
                    rest_retries=2,
                    rest_retry_interval=1.0,
                )
            except Exception as e:
                logger.warning("Redis client init failed: %s", e)
                _redis_client = False
    return _redis_client if _redis_client else None


def redis_configured() -> bool:
    """Return True if Upstash URL and token are set."""
    url = (getattr(settings, "upstash_redis_rest_url", None) or "").strip()
    token = (getattr(settings, "upstash_redis_rest_token", None) or "").strip()
    return bool(url and token)


async def redis_ping() -> bool:
    """Return True if Redis is reachable (Upstash REST)."""
    client = _get_client()
    if not client:
        return False
    try:
        result = await client.ping()
        return (result == "PONG") if isinstance(result, str) else bool(result)
    except Exception as e:
        logger.warning("Redis health check failed: %s", e)
        return False


async def redis_status() -> str:
    """Return 'not_configured' | 'connected' | 'disconnected' for health display."""
    if not redis_configured():
        return "not_configured"
    if await redis_ping():
        return "connected"
    return "disconnected"


async def get_workflow_cached(workflow_id: UUID, browser_id: str) -> Optional[dict]:
    """Return cached workflow dict if present and browser_id matches, else None."""
    client = _get_client()
    if not client:
        return None
    key = f"{WORKFLOW_CACHE_PREFIX}{workflow_id}"
    try:
        raw = await client.get(key)
        if not raw:
            return None
        data = json.loads(raw)
        if data.get("browser_id") != browser_id:
            return None
        return data
    except Exception:
        return None


async def set_workflow_cached(
    workflow_id: UUID,
    browser_id: str,
    data: dict,
    ttl: int = WORKFLOW_CACHE_TTL,
) -> None:
    """Cache workflow read payload. data must include browser_id."""
    client = _get_client()
    if not client:
        return
    key = f"{WORKFLOW_CACHE_PREFIX}{workflow_id}"
    try:
        await client.set(
            key,
            json.dumps(data, default=str),
            ex=ttl,
        )
    except Exception:
        pass


async def invalidate_workflow(workflow_id: UUID) -> None:
    """Remove workflow from cache (call after update/delete/add step/delete step/edge)."""
    client = _get_client()
    if not client:
        return
    key = f"{WORKFLOW_CACHE_PREFIX}{workflow_id}"
    try:
        await client.delete(key)
    except Exception:
        pass
