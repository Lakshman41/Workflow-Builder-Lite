from __future__ import annotations

from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class StepOutputRead(BaseModel):
    id: UUID
    run_id: UUID
    step_id: UUID
    input_text: str
    output_text: str
    duration_ms: Optional[float] = None

    class Config:
        from_attributes = True
