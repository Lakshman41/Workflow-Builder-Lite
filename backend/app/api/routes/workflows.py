from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.dependencies import get_browser_id
from app.db.session import get_db
from app.models import Edge, Step, Workflow
from app.schemas import (
    StepAddInWorkflow,
    StepCreate,
    StepRead,
    StepUpdate,
    WorkflowCreate,
    WorkflowListItem,
    WorkflowRead,
    WorkflowUpdate,
    WorkflowValidateResponse,
)
from app.services.cache import get_workflow_cached, invalidate_workflow, set_workflow_cached
from app.services.validation import validate_workflow_graph

router = APIRouter(prefix="/workflows", tags=["workflows"])


@router.get("", response_model=list[WorkflowListItem])
async def list_workflows(
    db: AsyncSession = Depends(get_db),
    browser_id: str = Depends(get_browser_id),
):
    result = await db.execute(
        select(Workflow).where(Workflow.browser_id == browser_id).order_by(Workflow.created_at.desc())
    )
    workflows = result.scalars().all()
    return list(workflows)


@router.post("", response_model=WorkflowRead, status_code=201)
async def create_workflow(
    body: WorkflowCreate,
    db: AsyncSession = Depends(get_db),
    browser_id: str = Depends(get_browser_id),
):
    n = len(body.steps)
    workflow = Workflow(name=body.name, description=body.description, browser_id=browser_id)
    db.add(workflow)
    await db.flush()

    step_id_by_index: dict[int, UUID] = {}
    for i, s in enumerate(body.steps):
        step = Step(
            workflow_id=workflow.id,
            name=s.name,
            description=s.description,
            step_type=s.step_type,
            position=s.position or {},
        )
        db.add(step)
        await db.flush()
        step_id_by_index[i] = step.id

    for e in body.edges:
        si, ti = e.source_index, e.target_index
        if si in step_id_by_index and ti in step_id_by_index:
            edge = Edge(
                workflow_id=workflow.id,
                source_step_id=step_id_by_index[si],
                target_step_id=step_id_by_index[ti],
            )
            db.add(edge)

    await db.commit()
    await db.refresh(workflow)
    result = await db.execute(
        select(Workflow).where(Workflow.id == workflow.id).options(
            selectinload(Workflow.steps),
            selectinload(Workflow.edges),
        )
    )
    workflow = result.scalar_one()
    return workflow


@router.get("/{workflow_id}", response_model=WorkflowRead)
async def get_workflow(
    workflow_id: UUID,
    db: AsyncSession = Depends(get_db),
    browser_id: str = Depends(get_browser_id),
):
    cached = await get_workflow_cached(workflow_id, browser_id)
    if cached is not None:
        return WorkflowRead.model_validate(cached)
    result = await db.execute(
        select(Workflow)
        .where(Workflow.id == workflow_id, Workflow.browser_id == browser_id)
        .options(selectinload(Workflow.steps), selectinload(Workflow.edges))
    )
    workflow = result.scalar_one_or_none()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    workflow_read = WorkflowRead.model_validate(workflow)
    await set_workflow_cached(
        workflow_id, browser_id, workflow_read.model_dump(mode="json")
    )
    return workflow_read


@router.get("/{workflow_id}/validate", response_model=WorkflowValidateResponse)
async def validate_workflow(
    workflow_id: UUID,
    db: AsyncSession = Depends(get_db),
    browser_id: str = Depends(get_browser_id),
):
    """Return validation result for the workflow graph. Frontend can call this to show errors without duplicating rules."""
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
    return WorkflowValidateResponse(valid=len(errors) == 0, errors=errors)


@router.patch("/{workflow_id}", response_model=WorkflowRead)
async def update_workflow(
    workflow_id: UUID,
    body: WorkflowUpdate,
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

    if body.name is not None:
        workflow.name = body.name
    if body.description is not None:
        workflow.description = body.description

    if body.steps is not None and body.edges is not None:
        # Replace steps and edges (no graph validation; frontend validates, backend validates at run)
        for s in workflow.steps:
            await db.delete(s)
        for e in workflow.edges:
            await db.delete(e)
        await db.flush()

        n = len(body.steps)
        step_id_by_index = {}
        for i, s in enumerate(body.steps):
            step = Step(
                workflow_id=workflow.id,
                name=s.name,
                description=s.description,
                step_type=s.step_type,
                position=s.position or {},
            )
            db.add(step)
            await db.flush()
            step_id_by_index[i] = step.id
        for e in body.edges:
            si, ti = e.source_index, e.target_index
            if si in step_id_by_index and ti in step_id_by_index:
                edge = Edge(
                    workflow_id=workflow.id,
                    source_step_id=step_id_by_index[si],
                    target_step_id=step_id_by_index[ti],
                )
                db.add(edge)
    elif body.steps is not None or body.edges is not None:
        raise HTTPException(status_code=400, detail="Provide both steps and edges when updating graph")

    await db.commit()
    await invalidate_workflow(workflow_id)
    await db.refresh(workflow)
    result = await db.execute(
        select(Workflow).where(Workflow.id == workflow.id).options(
            selectinload(Workflow.steps),
            selectinload(Workflow.edges),
        )
    )
    return result.scalar_one()


@router.delete("/{workflow_id}", status_code=204)
async def delete_workflow(
    workflow_id: UUID,
    db: AsyncSession = Depends(get_db),
    browser_id: str = Depends(get_browser_id),
):
    result = await db.execute(
        select(Workflow).where(Workflow.id == workflow_id, Workflow.browser_id == browser_id)
    )
    workflow = result.scalar_one_or_none()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    await db.delete(workflow)
    await db.commit()
    await invalidate_workflow(workflow_id)
    return None


# --- Step-level operations (add / update / delete) ---


@router.post("/{workflow_id}/steps", response_model=StepRead, status_code=201)
async def add_step(
    workflow_id: UUID,
    body: StepAddInWorkflow,
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

    step_ids_in_workflow = {s.id for s in workflow.steps}
    if body.insert_after_step_id is not None and body.insert_after_step_id not in step_ids_in_workflow:
        raise HTTPException(status_code=400, detail="insert_after_step_id must be a step ID in this workflow")
    if body.insert_before_step_id is not None and body.insert_before_step_id not in step_ids_in_workflow:
        raise HTTPException(status_code=400, detail="insert_before_step_id must be a step ID in this workflow")

    step = Step(
        workflow_id=workflow.id,
        name=body.name,
        description=body.description,
        step_type=body.step_type,
        position=body.position or {},
    )
    db.add(step)
    await db.flush()

    if body.insert_after_step_id is not None:
        db.add(
            Edge(
                workflow_id=workflow.id,
                source_step_id=body.insert_after_step_id,
                target_step_id=step.id,
            )
        )
    if body.insert_before_step_id is not None:
        db.add(
            Edge(
                workflow_id=workflow.id,
                source_step_id=step.id,
                target_step_id=body.insert_before_step_id,
            )
        )

    await db.commit()
    await invalidate_workflow(workflow_id)
    await db.refresh(step)
    return step


@router.patch("/{workflow_id}/steps/{step_id}", response_model=StepRead)
async def update_step(
    workflow_id: UUID,
    step_id: UUID,
    body: StepUpdate,
    db: AsyncSession = Depends(get_db),
    browser_id: str = Depends(get_browser_id),
):
    result = await db.execute(
        select(Step)
        .where(Step.workflow_id == workflow_id, Step.id == step_id)
        .options(selectinload(Step.workflow))
    )
    step = result.scalar_one_or_none()
    if not step or step.workflow.browser_id != browser_id:
        raise HTTPException(status_code=404, detail="Step not found")

    if body.name is not None:
        step.name = body.name
    if body.description is not None:
        step.description = body.description
    if body.position is not None:
        step.position = body.position
    if body.step_type is not None:
        step.step_type = body.step_type

    await db.commit()
    await invalidate_workflow(workflow_id)
    await db.refresh(step)
    return step


@router.delete("/{workflow_id}/steps/{step_id}", status_code=204)
async def delete_step(
    workflow_id: UUID,
    step_id: UUID,
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
    step = next((s for s in workflow.steps if s.id == step_id), None)
    if not step:
        raise HTTPException(status_code=404, detail="Step not found")

    await db.delete(step)
    await db.commit()
    await invalidate_workflow(workflow_id)
    return None


# --- Edge-level operations ---


@router.delete("/{workflow_id}/edges/{edge_id}", status_code=204)
async def delete_edge(
    workflow_id: UUID,
    edge_id: UUID,
    db: AsyncSession = Depends(get_db),
    browser_id: str = Depends(get_browser_id),
):
    result = await db.execute(
        select(Edge)
        .where(
            Edge.id == edge_id,
            Edge.workflow_id == workflow_id,
        )
        .options(selectinload(Edge.workflow))
    )
    edge = result.scalar_one_or_none()
    if not edge or edge.workflow.browser_id != browser_id:
        raise HTTPException(status_code=404, detail="Edge not found")
    await db.delete(edge)
    await db.commit()
    await invalidate_workflow(workflow_id)
    return None
