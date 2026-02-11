from __future__ import annotations

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.edge import EdgeCreateByIndex, EdgeRead
from app.schemas.step import StepCreate, StepRead


class WorkflowBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: str = ""


class WorkflowCreate(WorkflowBase):
    steps: List[StepCreate] = []
    edges: List[EdgeCreateByIndex] = []  # indices into steps (0-based)


class WorkflowUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    steps: Optional[List[StepCreate]] = None
    edges: Optional[List[EdgeCreateByIndex]] = None  # indices into steps (0-based)


class WorkflowRead(WorkflowBase):
    id: UUID
    browser_id: str
    created_at: datetime
    steps: List[StepRead] = []
    edges: List[EdgeRead] = []

    class Config:
        from_attributes = True


class WorkflowListItem(BaseModel):
    id: UUID
    name: str
    description: str
    created_at: datetime

    class Config:
        from_attributes = True


class WorkflowValidateResponse(BaseModel):
    """Result of workflow graph validation. Frontend can use GET /workflows/{id}/validate to show errors."""
    valid: bool
    errors: List[str] = []  # empty when valid=True
