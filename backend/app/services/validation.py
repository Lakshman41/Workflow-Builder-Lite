"""
Validate workflow graph.
- One step: that step must be START (no END required).
- Two or more steps: exactly one START, one END, no cycles (DAG), all steps connected.
Returns list of error strings; empty list means valid.
"""
from uuid import UUID


def validate_workflow_graph(
    step_ids: list[UUID],
    step_types: dict[UUID, str],  # step_id -> "START" | "NORMAL" | "END"
    edges: list[tuple[UUID, UUID]],  # (source_step_id, target_step_id)
) -> list[str]:
    errors: list[str] = []
    step_set = set(step_ids)
    if not step_set:
        return ["Workflow must have at least one step."]

    starts = [sid for sid in step_ids if step_types.get(sid) == "START"]
    ends = [sid for sid in step_ids if step_types.get(sid) == "END"]

    if len(step_ids) == 1:
        # Single-step workflow: only START is required (no END).
        if len(starts) != 1:
            errors.append("The single step must be a START step.")
    else:
        # Two or more steps: exactly one START and one END.
        if len(starts) != 1:
            errors.append("Workflow must have exactly one START step.")
        if len(ends) != 1:
            errors.append("Workflow must have exactly one END step.")

    # Build adjacency list (outgoing). Only include edges where both endpoints are in step_set.
    adj: dict[UUID, list[UUID]] = {s: [] for s in step_ids}
    for src, tgt in edges:
        if src in adj and tgt in step_set:
            adj[src].append(tgt)

    # Each step must have at most one incoming and one outgoing edge (linear chain).
    valid_edges_for_degree = [(src, tgt) for src, tgt in edges if src in step_set and tgt in step_set]
    out_degree: dict[UUID, int] = {s: 0 for s in step_ids}
    in_degree: dict[UUID, int] = {s: 0 for s in step_ids}
    for src, tgt in valid_edges_for_degree:
        out_degree[src] = out_degree.get(src, 0) + 1
        in_degree[tgt] = in_degree.get(tgt, 0) + 1
    for sid in step_ids:
        if out_degree.get(sid, 0) > 1:
            errors.append(
                "Each step may have only one outgoing connection (one edge from its output). "
                "Remove extra edges from the same step."
            )
            break
    for sid in step_ids:
        if in_degree.get(sid, 0) > 1:
            errors.append(
                "Each step may have only one incoming connection (one edge to its input). "
                "Remove extra edges to the same step."
            )
            break

    # Cycle detection via DFS
    WHITE, GRAY, BLACK = 0, 1, 2
    color: dict[UUID, int] = {s: WHITE for s in step_ids}

    def has_cycle(u: UUID) -> bool:
        color[u] = GRAY
        for v in adj.get(u, []):
            if color.get(v, WHITE) == GRAY:
                return True
            if color.get(v, WHITE) == WHITE and has_cycle(v):
                return True
        color[u] = BLACK
        return False

    for sid in step_ids:
        if color[sid] == WHITE and has_cycle(sid):
            errors.append("Workflow must not contain cycles (DAG required).")
            break

    # All steps connected: from START we can reach every node, and from every node we can reach END
    if not errors and starts and ends:
        start_id = starts[0]
        end_id = ends[0]
        # Edges that stay within our steps (ignore stale references)
        valid_edges = [(src, tgt) for src, tgt in edges if src in step_set and tgt in step_set]
        if not valid_edges and len(step_ids) > 1:
            errors.append(
                "No connections between steps. Connect each step (drag from one step's output to another's input) and click Save."
            )
        elif valid_edges:
            # Reachable from START (forward BFS)
            reachable_from_start = set()
            stack = [start_id]
            while stack:
                u = stack.pop()
                if u in reachable_from_start:
                    continue
                reachable_from_start.add(u)
                for v in adj.get(u, []):
                    if v not in reachable_from_start:
                        stack.append(v)
            # Reverse: who can reach END? Only use edges with both endpoints in step_set.
            rev_adj: dict[UUID, list[UUID]] = {s: [] for s in step_ids}
            for src, tgt in edges:
                if tgt in rev_adj and src in step_set and tgt in step_set:
                    rev_adj[tgt].append(src)
            can_reach_end = set()
            stack = [end_id]
            while stack:
                u = stack.pop()
                if u in can_reach_end:
                    continue
                can_reach_end.add(u)
                for v in rev_adj.get(u, []):
                    if v not in can_reach_end:
                        stack.append(v)
            if reachable_from_start != step_set or can_reach_end != step_set:
                # Report which steps are disconnected so the user can fix them.
                not_from_start = step_set - reachable_from_start
                not_to_end = step_set - can_reach_end
                parts = []
                if not_from_start:
                    idx_types = [
                        f"step {i + 1} ({step_types.get(sid, '?')})"
                        for i, sid in enumerate(step_ids)
                        if sid in not_from_start
                    ]
                    parts.append("not reachable from START: " + ", ".join(idx_types))
                if not_to_end:
                    idx_types = [
                        f"step {i + 1} ({step_types.get(sid, '?')})"
                        for i, sid in enumerate(step_ids)
                        if sid in not_to_end
                    ]
                    parts.append("do not lead to END: " + ", ".join(idx_types))
                errors.append(
                    "All steps must be connected (path from START to END through every step). "
                    + "; ".join(parts)
                    + "."
                )

    return errors
