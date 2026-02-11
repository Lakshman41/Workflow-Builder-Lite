from uuid import UUID

from pydantic import BaseModel


class EdgeBase(BaseModel):
    source_step_id: UUID
    target_step_id: UUID


class EdgeCreate(EdgeBase):
    pass


class EdgeCreateByIndex(BaseModel):
    """For creating a workflow in one shot; indices refer to steps list order (0-based)."""
    source_index: int
    target_index: int


class EdgeRead(EdgeBase):
    id: UUID
    workflow_id: UUID

    class Config:
        from_attributes = True
