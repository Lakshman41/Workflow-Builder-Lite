import uuid

from sqlalchemy import Column, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from app.db.session import Base


class Step(Base):
    __tablename__ = "steps"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workflow_id = Column(UUID(as_uuid=True), ForeignKey("workflows.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, default="")
    step_type = Column(String(20), nullable=False)  # START | NORMAL | END
    position = Column(JSONB, default=dict)  # e.g. {"x": 0, "y": 0} for ReactFlow

    workflow = relationship("Workflow", back_populates="steps")
    step_outputs = relationship("StepOutput", back_populates="step", cascade="all, delete-orphan")
