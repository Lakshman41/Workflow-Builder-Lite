import { API_BASE } from "@/lib/constants";

/** Build full API URL (e.g. /api/workflows or https://backend.run.app/api/workflows). */
export function apiUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}/api${p}`;
}

/** Fetch with JSON and X-Browser-ID. Used by all workflow/run API calls. */
export async function apiFetch(
  path: string,
  options: RequestInit & { headers?: Record<string, string> } = {},
  browserId: string
): Promise<Response> {
  const url = apiUrl(path);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Browser-ID": browserId,
    ...(options.headers as Record<string, string>),
  };
  return fetch(url, { ...options, headers });
}
