import { apiFetch } from "./client";
import type { Run, RunCreated, RunListItem } from "@/types/run";

export async function createRun(
  workflowId: string,
  inputText: string,
  browserId: string
): Promise<RunCreated> {
  const res = await apiFetch(`/runs/workflows/${workflowId}/run`, {
    method: "POST",
    body: JSON.stringify({ input_text: inputText }),
  }, browserId);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = Array.isArray(err.detail) ? err.detail.join(" ") : err.detail ?? "Failed to run workflow";
    throw new Error(msg);
  }
  return res.json();
}

export async function fetchRuns(
  browserId: string,
  limit = 20
): Promise<RunListItem[]> {
  const res = await apiFetch(`/runs?limit=${limit}`, {}, browserId);
  if (!res.ok) throw new Error("Failed to fetch runs");
  return res.json();
}

export async function fetchRun(
  runId: string,
  browserId: string
): Promise<Run | null> {
  const res = await apiFetch(`/runs/${runId}`, {}, browserId);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch run");
  return res.json();
}
