"""Initial schema: workflows, steps, edges, runs, step_outputs

Revision ID: 001
Revises:
Create Date: 2025-02-12

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "001"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "workflows",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("browser_id", sa.String(36), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_workflows_browser_id"), "workflows", ["browser_id"], unique=False)

    op.create_table(
        "steps",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("workflow_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("step_type", sa.String(20), nullable=False),
        sa.Column("position", postgresql.JSONB(), nullable=True),
        sa.ForeignKeyConstraint(["workflow_id"], ["workflows.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_steps_workflow_id"), "steps", ["workflow_id"], unique=False)

    op.create_table(
        "edges",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("workflow_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("source_step_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("target_step_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.ForeignKeyConstraint(["workflow_id"], ["workflows.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["source_step_id"], ["steps.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["target_step_id"], ["steps.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_edges_workflow_id"), "edges", ["workflow_id"], unique=False)

    op.create_table(
        "runs",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("workflow_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("browser_id", sa.String(36), nullable=False),
        sa.Column("input_text", sa.Text(), nullable=False),
        sa.Column("status", sa.String(20), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["workflow_id"], ["workflows.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_runs_browser_id"), "runs", ["browser_id"], unique=False)
    op.create_index(op.f("ix_runs_workflow_id"), "runs", ["workflow_id"], unique=False)

    op.create_table(
        "step_outputs",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("run_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("step_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("input_text", sa.Text(), nullable=False),
        sa.Column("output_text", sa.Text(), nullable=False),
        sa.Column("duration_ms", sa.Float(), nullable=True),
        sa.ForeignKeyConstraint(["run_id"], ["runs.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["step_id"], ["steps.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_step_outputs_run_id"), "step_outputs", ["run_id"], unique=False)
    op.create_index(op.f("ix_step_outputs_step_id"), "step_outputs", ["step_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_step_outputs_step_id"), table_name="step_outputs")
    op.drop_index(op.f("ix_step_outputs_run_id"), table_name="step_outputs")
    op.drop_table("step_outputs")
    op.drop_index(op.f("ix_runs_workflow_id"), table_name="runs")
    op.drop_index(op.f("ix_runs_browser_id"), table_name="runs")
    op.drop_table("runs")
    op.drop_index(op.f("ix_edges_workflow_id"), table_name="edges")
    op.drop_table("edges")
    op.drop_index(op.f("ix_steps_workflow_id"), table_name="steps")
    op.drop_table("steps")
    op.drop_index(op.f("ix_workflows_browser_id"), table_name="workflows")
    op.drop_table("workflows")
