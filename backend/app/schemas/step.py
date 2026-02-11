from __future__ import annotations

from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class StepBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: str = ""
    step_type: str = Field(..., pattern="^(START|NORMAL|END)$")
    position: Optional[dict] = None  # {"x": float, "y": float}


class StepCreate(StepBase):
    pass


class StepAddInWorkflow(BaseModel):
    """Add a step to an existing workflow. Connect it via insert_after/insert_before (step IDs)."""
    name: str = Field(..., min_length=1, max_length=255)
    description: str = ""
    step_type: str = Field(..., pattern="^(START|NORMAL|END)$")
    position: Optional[dict] = None  # {"x": float, "y": float}
    insert_after_step_id: Optional[UUID] = None  # edge: this step -> new step (who feeds into new step)
    insert_before_step_id: Optional[UUID] = None  # edge: new step -> this step (who new step feeds into)


class StepUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    step_type: Optional[str] = Field(None, pattern="^(START|NORMAL|END)$")
    position: Optional[dict] = None


class StepRead(StepBase):
    id: UUID
    workflow_id: UUID

    class Config:
        from_attributes = True
