import uuid

from sqlalchemy import Column, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.session import Base


class Edge(Base):
    __tablename__ = "edges"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workflow_id = Column(UUID(as_uuid=True), ForeignKey("workflows.id", ondelete="CASCADE"), nullable=False)
    source_step_id = Column(UUID(as_uuid=True), ForeignKey("steps.id", ondelete="CASCADE"), nullable=False)
    target_step_id = Column(UUID(as_uuid=True), ForeignKey("steps.id", ondelete="CASCADE"), nullable=False)

    workflow = relationship("Workflow", back_populates="edges")
