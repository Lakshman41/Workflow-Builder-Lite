import uuid

from sqlalchemy import Column, DateTime, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.session import Base


class Run(Base):
    __tablename__ = "runs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workflow_id = Column(UUID(as_uuid=True), ForeignKey("workflows.id", ondelete="CASCADE"), nullable=False)
    browser_id = Column(String(36), nullable=False, index=True)
    input_text = Column(Text, nullable=False)
    status = Column(String(20), nullable=False, default="pending")  # pending | running | completed | failed
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    error_message = Column(Text, nullable=True)

    workflow = relationship("Workflow", back_populates="runs")
    step_outputs = relationship("StepOutput", back_populates="run", cascade="all, delete-orphan")
