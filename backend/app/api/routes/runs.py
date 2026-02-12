"""Run workflow and list run history. POST .../run validates the graph then executes steps with Gemini."""
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.dependencies import get_browser_id
from app.db.session import get_db
from app.models import Run, Workflow
from app.schemas import RunCreate, RunCreated, RunRead, RunListItem
from app.services.validation import validate_workflow_graph
from app.services.workflow_executor import execute_workflow

router = APIRouter(prefix="/runs", tags=["runs"])


@router.post("/workflows/{workflow_id}/run", response_model=RunCreated, status_code=200)
async def create_run(
    workflow_id: UUID,
    body: RunCreate,
    db: AsyncSession = Depends(get_db),
    browser_id: str = Depends(get_browser_id),
):
    result = await db.execute(
        select(Workflow)
        .where(Workflow.id == workflow_id, Workflow.browser_id == browser_id)
        .options(selectinload(Workflow.steps), selectinload(Workflow.edges))
    )
    workflow = result.scalar_one_or_none()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")

    step_ids = [s.id for s in workflow.steps]
    step_types = {s.id: s.step_type for s in workflow.steps}
    edge_list = [(e.source_step_id, e.target_step_id) for e in workflow.edges]
    errors = validate_workflow_graph(step_ids, step_types, edge_list)
    if errors:
        raise HTTPException(status_code=400, detail=errors)

    run = Run(
        workflow_id=workflow_id,
        browser_id=browser_id,
        input_text=body.input_text,
        status="pending",
    )
    db.add(run)
    await db.commit()
    await db.refresh(run)

    await execute_workflow(run.id, body.input_text, db)
    await db.refresh(run)

    return RunCreated(run_id=run.id, workflow_id=workflow_id, status=run.status)


@router.get("", response_model=list[RunListItem])
async def list_runs(
    db: AsyncSession = Depends(get_db),
    browser_id: str = Depends(get_browser_id),
    limit: int = 5,
):
    if limit > 50:
        limit = 50
    result = await db.execute(
        select(Run, Workflow.name)
        .join(Workflow, Run.workflow_id == Workflow.id)
        .where(Run.browser_id == browser_id)
        .order_by(Run.started_at.desc())
        .limit(limit)
    )
    rows = result.all()
    return [
        RunListItem(
            id=r.id,
            workflow_id=r.workflow_id,
            workflow_name=w_name,
            input_text=(r.input_text[:200] + "...") if len(r.input_text) > 200 else r.input_text,
            status=r.status,
            started_at=r.started_at,
        )
        for r, w_name in rows
    ]


@router.get("/{run_id}", response_model=RunRead)
async def get_run(
    run_id: UUID,
    db: AsyncSession = Depends(get_db),
    browser_id: str = Depends(get_browser_id),
):
    result = await db.execute(
        select(Run)
        .where(Run.id == run_id, Run.browser_id == browser_id)
        .options(selectinload(Run.step_outputs))
    )
    run = result.scalar_one_or_none()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return run


# SSE stream for run progress - stub for now (implement with Redis when Celery is added)
# @router.get("/{run_id}/stream")
# async def stream_run_progress(run_id: UUID, ...): ...
