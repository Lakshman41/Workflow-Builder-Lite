import * as api from "@/api/health";

export type { HealthResponse } from "@/api/health";

export async function getHealth(): Promise<api.HealthResponse> {
  return api.fetchHealth();
}
