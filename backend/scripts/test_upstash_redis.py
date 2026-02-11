#!/usr/bin/env python3
"""
Test Upstash Redis connection and cache operations.
Run from project root: python backend/scripts/test_upstash_redis.py
Or from backend: python scripts/test_upstash_redis.py
"""
import asyncio
import sys
from pathlib import Path

# Ensure backend is on path when run from project root
backend = Path(__file__).resolve().parent.parent
if str(backend) not in sys.path:
    sys.path.insert(0, str(backend))


async def main():
    from app.core.config import settings
    from app.services.cache import (
        redis_ping,
        get_workflow_cached,
        set_workflow_cached,
        invalidate_workflow,
    )
    from uuid import uuid4

    url = (getattr(settings, "upstash_redis_rest_url", None) or "").strip()
    token = (getattr(settings, "upstash_redis_rest_token", None) or "").strip()

    if not url or not token:
        print("FAIL: UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set in .env")
        return 1

    print("Config: URL and token are set.")
    print("1. Pinging Upstash Redis...")
    ok = await redis_ping()
    if not ok:
        print("   FAIL: redis_ping() returned False")
        return 1
    print("   OK: Redis is reachable.")

    print("2. Testing cache set/get/invalidate...")
    test_id = uuid4()
    test_browser_id = "test-browser"
    test_data = {"browser_id": test_browser_id, "name": "Test Workflow", "steps": []}

    await set_workflow_cached(test_id, test_browser_id, test_data, ttl=60)
    cached = await get_workflow_cached(test_id, test_browser_id)
    if cached != test_data:
        print(f"   FAIL: get_workflow_cached returned {cached!r}")
        return 1
    print("   OK: Set and get matched.")

    await invalidate_workflow(test_id)
    cached_after = await get_workflow_cached(test_id, test_browser_id)
    if cached_after is not None:
        print(f"   FAIL: invalidate_workflow did not clear cache: {cached_after!r}")
        return 1
    print("   OK: Invalidate cleared cache.")

    print("\nAll Upstash Redis tests passed.")
    return 0


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
