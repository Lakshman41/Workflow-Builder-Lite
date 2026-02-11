"""
Execute a workflow run: order steps (BFS from START), run each step through the LLM, persist StepOutput.
"""
from __future__ import annotations

import time
from datetime import datetime, timezone
from typing import List
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import Edge, Run, Step, StepOutput, Workflow
from app.services.llm import execute_step as llm_execute_step


def get_steps_in_execution_order(steps: List[Step], edges: List[Edge]) -> List[Step]:
    """
    Return steps in execution order: BFS from the START step following edges.
    Works for single-step (START only) or multi-step (START → … → END) valid workflows.
    """
    step_by_id = {s.id: s for s in steps}
    out_edges: dict[UUID, list[UUID]] = {s.id: [] for s in steps}
    for e in edges:
        if e.source_step_id in out_edges:
            out_edges[e.source_step_id].append(e.target_step_id)

    start_step = next(s for s in steps if s.step_type == "START")
    order: List[Step] = []
    seen: set[UUID] = set()
    queue: list[UUID] = [start_step.id]
    while queue:
        step_id = queue.pop(0)
        if step_id in seen:
            continue
        seen.add(step_id)
        order.append(step_by_id[step_id])
        for next_id in out_edges.get(step_id, []):
            if next_id not in seen:
                queue.append(next_id)
    return order


async def execute_workflow(
    run_id: UUID,
    input_text: str,
    db: AsyncSession,
) -> None:
    """
    Load run and workflow, set status to running, execute steps in order via LLM,
    persist each StepOutput, then set status to completed or failed.
    """
    result = await db.execute(
        select(Run)
        .where(Run.id == run_id)
        .options(selectinload(Run.workflow).selectinload(Workflow.steps), selectinload(Run.workflow).selectinload(Workflow.edges))
    )
    run = result.scalar_one_or_none()
    if not run or not run.workflow:
        return

    workflow = run.workflow
    steps_ordered = get_steps_in_execution_order(workflow.steps, workflow.edges)

    run.status = "running"
    await db.commit()

    current_text = input_text
    try:
        for step in steps_ordered:
            step_input = current_text
            t0 = time.perf_counter()
            output_text, err = llm_execute_step(
                step.name,
                step.description or "",
                step_input,
                step.step_type,
            )
            duration_ms = (time.perf_counter() - t0) * 1000

            if err:
                run.status = "failed"
                run.error_message = f"Step '{step.name}': {err}"
                output_text = output_text or err
            else:
                current_text = output_text

            step_output = StepOutput(
                run_id=run_id,
                step_id=step.id,
                input_text=step_input,
                output_text=output_text,
                duration_ms=round(duration_ms, 2),
            )
            db.add(step_output)

            if err:
                break
        else:
            run.status = "completed"
    except Exception as e:
        run.status = "failed"
        run.error_message = str(e)

    run.completed_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(run)
