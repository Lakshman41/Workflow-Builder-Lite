import { getBrowserId } from "@/utils/browserIdManager";
import * as api from "@/api/runs";
import type { Run, RunListItem, RunCreated } from "@/types/run";

export async function getRuns(limit = 5): Promise<RunListItem[]> {
  return api.fetchRuns(getBrowserId(), limit);
}

export async function getRun(id: string): Promise<Run | null> {
  return api.fetchRun(id, getBrowserId());
}

export async function executeWorkflow(
  workflowId: string,
  inputText: string
): Promise<RunCreated> {
  return api.createRun(workflowId, inputText, getBrowserId());
}
