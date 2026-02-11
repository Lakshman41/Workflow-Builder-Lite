from __future__ import annotations

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.step_output import StepOutputRead


class RunCreate(BaseModel):
    input_text: str = Field(..., min_length=1)


class RunRead(BaseModel):
    id: UUID
    workflow_id: UUID
    browser_id: str
    input_text: str
    status: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    step_outputs: List[StepOutputRead] = []

    class Config:
        from_attributes = True


class RunListItem(BaseModel):
    id: UUID
    workflow_id: UUID
    workflow_name: Optional[str] = None
    input_text: str  # or preview in response
    status: str
    started_at: datetime

    class Config:
        from_attributes = True


class RunCreated(BaseModel):
    run_id: UUID
    workflow_id: UUID
    status: str = "pending"
