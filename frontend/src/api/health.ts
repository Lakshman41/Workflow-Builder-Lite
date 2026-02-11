import { apiUrl } from "./client";

export interface HealthResponse {
  status: string;
  database: string;
  backend_response_time_ms: number;
  redis?: string;
  llm?: string;
}

export async function fetchHealth(): Promise<HealthResponse> {
  const res = await fetch(apiUrl("/health"));
  if (!res.ok) throw new Error("Health check failed");
  return res.json();
}
