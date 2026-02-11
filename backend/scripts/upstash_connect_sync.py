#!/usr/bin/env python3
"""
Upstash Redis connection test using the exact sync pattern from Upstash docs.
Uses URL and token from .env.

  From project root:  python backend/scripts/upstash_connect_sync.py
  From backend dir:   python scripts/upstash_connect_sync.py
"""
import os
import sys
from pathlib import Path

# Load .env from project root (parent of backend)
project_root = Path(__file__).resolve().parent.parent.parent
env_file = project_root / ".env"
if env_file.exists():
    for line in env_file.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            key, _, val = line.partition("=")
            key, val = key.strip(), val.strip().strip('"').strip("'")
            if key and key not in os.environ:
                os.environ[key] = val

url = os.environ.get("UPSTASH_REDIS_REST_URL", "").strip()
token = os.environ.get("UPSTASH_REDIS_REST_TOKEN", "").strip()
if not url or not token:
    print("Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in .env")
    sys.exit(1)

# Exact pattern from Upstash Python docs (sync client)
from upstash_redis import Redis

redis = Redis(url=url, token=token)
redis.set("foo", "bar")
value = redis.get("foo")

if value == "bar":
    print("OK: Upstash Redis (sync) – set/get works.")
else:
    print(f"Unexpected get result: {value!r}")
    sys.exit(1)
