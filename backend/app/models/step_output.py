import uuid

from sqlalchemy import Column, Float, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.session import Base


class StepOutput(Base):
    __tablename__ = "step_outputs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    run_id = Column(UUID(as_uuid=True), ForeignKey("runs.id", ondelete="CASCADE"), nullable=False)
    step_id = Column(UUID(as_uuid=True), ForeignKey("steps.id", ondelete="CASCADE"), nullable=False)
    input_text = Column(Text, nullable=False)
    output_text = Column(Text, nullable=False)
    duration_ms = Column(Float, nullable=True)

    run = relationship("Run", back_populates="step_outputs")
    step = relationship("Step", back_populates="step_outputs")
