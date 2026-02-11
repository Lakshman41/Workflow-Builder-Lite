import { API_BASE } from "@/lib/constants";

export function apiUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}/api${p}`;
}

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
