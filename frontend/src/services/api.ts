import { apiUrl } from "@/api/client";
import { getBrowserId } from "@/utils/browserIdManager";

export async function request(
  path: string,
  options: RequestInit & { headers?: Record<string, string> } = {}
): Promise<Response> {
  const url = apiUrl(path);
  const extra = options.headers && typeof options.headers === "object" && !("length" in options.headers)
    ? options.headers
    : {};
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Browser-ID": getBrowserId(),
    ...extra,
  };
  return fetch(url, { ...options, headers });
}

/** Health endpoint does not require X-Browser-ID */
export async function requestNoAuth(path: string): Promise<Response> {
  return fetch(apiUrl(path));
}
