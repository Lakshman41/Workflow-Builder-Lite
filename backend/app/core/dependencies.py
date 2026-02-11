from __future__ import annotations

from typing import Annotated, Optional

from fastapi import Header, HTTPException

BROWSER_ID_HEADER = "X-Browser-ID"


async def get_browser_id(
    x_browser_id: Annotated[Optional[str], Header(alias=BROWSER_ID_HEADER)] = None,
) -> str:
    """Extract browser ID from request header. Required for all workflow/run APIs."""
    if not x_browser_id or not x_browser_id.strip():
        raise HTTPException(
            status_code=400,
            detail="Missing or empty X-Browser-ID header. Generate a UUID and send it with every request.",
        )
    return x_browser_id.strip()
