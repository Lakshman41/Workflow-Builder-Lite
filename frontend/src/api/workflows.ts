import { apiFetch } from "./client";
import type { Workflow, WorkflowListItem } from "@/types/workflow";

export interface CreateWorkflowBody {
  name: string;
  description?: string;
  steps?: unknown[];
  edges?: unknown[];
}

export interface WorkflowValidateResponse {
  valid: boolean;
  errors: string[];
}

export interface AddStepBody {
  name: string;
  description?: string;
  step_type: "START" | "NORMAL" | "END";
  position?: { x: number; y: number };
  insert_after_step_id?: string;
  insert_before_step_id?: string;
}

export interface UpdateStepBody {
  name?: string;
  description?: string;
  step_type?: "START" | "NORMAL" | "END";
  position?: { x: number; y: number };
}

export interface StepRead {
  id: string;
  workflow_id: string;
  name: string;
  description: string;
  step_type: string;
  position: { x: number; y: number } | null;
}

export async function createWorkflow(
  browserId: string,
  body: CreateWorkflowBody
): Promise<Workflow> {
  const res = await apiFetch(
    `/workflows`,
    {
      method: "POST",
      body: JSON.stringify({
        name: body.name,
        description: body.description ?? "",
        steps: body.steps ?? [],
        edges: body.edges ?? [],
      }),
    },
    browserId
  );
  if (!res.ok) throw new Error("Failed to create workflow");
  return res.json();
}

export async function fetchWorkflows(
  browserId: string,
  limit = 5
): Promise<WorkflowListItem[]> {
  const res = await apiFetch(`/workflows`, {}, browserId);
  if (!res.ok) throw new Error("Failed to fetch workflows");
  const list: WorkflowListItem[] = await res.json();
  return list.slice(0, limit);
}

export async function fetchWorkflow(
  id: string,
  browserId: string
): Promise<Workflow | null> {
  const res = await apiFetch(`/workflows/${id}`, {}, browserId);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch workflow");
  return res.json();
}

export async function updateWorkflow(
  workflowId: string,
  browserId: string,
  data: {
    name?: string;
    description?: string;
    steps?: Array<{ name: string; description: string; step_type: string; position?: { x: number; y: number } }>;
    edges?: Array<{ source_index: number; target_index: number }>;
  }
): Promise<Workflow> {
  const res = await apiFetch(`/workflows/${workflowId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  }, browserId);
  if (!res.ok) throw new Error("Failed to update workflow");
  return res.json();
}

export async function deleteWorkflow(
  workflowId: string,
  browserId: string
): Promise<void> {
  const res = await apiFetch(`/workflows/${workflowId}`, { method: "DELETE" }, browserId);
  if (!res.ok) throw new Error("Failed to delete workflow");
}

export async function validateWorkflow(
  workflowId: string,
  browserId: string
): Promise<WorkflowValidateResponse> {
  const res = await apiFetch(`/workflows/${workflowId}/validate`, {}, browserId);
  if (!res.ok) throw new Error("Failed to validate workflow");
  return res.json();
}

export async function addStep(
  workflowId: string,
  browserId: string,
  body: AddStepBody
): Promise<StepRead> {
  const res = await apiFetch(`/workflows/${workflowId}/steps`, {
    method: "POST",
    body: JSON.stringify(body),
  }, browserId);
  if (!res.ok) throw new Error("Failed to add step");
  return res.json();
}

export async function updateStep(
  workflowId: string,
  stepId: string,
  browserId: string,
  body: UpdateStepBody
): Promise<StepRead> {
  const res = await apiFetch(`/workflows/${workflowId}/steps/${stepId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  }, browserId);
  if (!res.ok) throw new Error("Failed to update step");
  return res.json();
}

export async function deleteStep(
  workflowId: string,
  stepId: string,
  browserId: string
): Promise<void> {
  const res = await apiFetch(`/workflows/${workflowId}/steps/${stepId}`, {
    method: "DELETE",
  }, browserId);
  if (!res.ok) throw new Error("Failed to delete step");
}

export async function deleteEdge(
  workflowId: string,
  edgeId: string,
  browserId: string
): Promise<void> {
  const res = await apiFetch(`/workflows/${workflowId}/edges/${edgeId}`, {
    method: "DELETE",
  }, browserId);
  if (!res.ok) throw new Error("Failed to delete edge");
}
