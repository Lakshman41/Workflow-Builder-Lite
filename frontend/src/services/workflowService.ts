import { getBrowserId } from "@/utils/browserIdManager";
import * as api from "@/api/workflows";
import type { Workflow, WorkflowListItem } from "@/types/workflow";
import type { AddStepBody, UpdateStepBody } from "@/api/workflows";

export async function getWorkflows(limit?: number): Promise<WorkflowListItem[]> {
  const id = getBrowserId();
  return api.fetchWorkflows(id, limit ?? 100);
}

export async function getWorkflow(id: string): Promise<Workflow | null> {
  return api.fetchWorkflow(id, getBrowserId());
}

export async function createWorkflow(data: {
  name: string;
  description?: string;
}): Promise<Workflow> {
  return api.createWorkflow(getBrowserId(), {
    name: data.name,
    description: data.description ?? "",
    steps: [],
    edges: [],
  });
}

export async function updateWorkflow(
  id: string,
  data: {
    name?: string;
    description?: string;
    steps?: Array<{
      name: string;
      description: string;
      step_type: string;
      position?: { x: number; y: number };
    }>;
    edges?: Array<{ source_index: number; target_index: number }>;
  }
): Promise<Workflow> {
  return api.updateWorkflow(id, getBrowserId(), data);
}

export async function deleteWorkflow(id: string): Promise<void> {
  return api.deleteWorkflow(id, getBrowserId());
}

export async function validateWorkflow(
  id: string
): Promise<{ valid: boolean; errors: string[] }> {
  return api.validateWorkflow(id, getBrowserId());
}

export async function addStep(
  workflowId: string,
  body: AddStepBody
): Promise<api.StepRead> {
  return api.addStep(workflowId, getBrowserId(), body);
}

export async function updateStep(
  workflowId: string,
  stepId: string,
  body: UpdateStepBody
): Promise<api.StepRead> {
  return api.updateStep(workflowId, stepId, getBrowserId(), body);
}

export async function deleteStep(
  workflowId: string,
  stepId: string
): Promise<void> {
  return api.deleteStep(workflowId, stepId, getBrowserId());
}

export async function deleteEdge(
  workflowId: string,
  edgeId: string
): Promise<void> {
  return api.deleteEdge(workflowId, edgeId, getBrowserId());
}
