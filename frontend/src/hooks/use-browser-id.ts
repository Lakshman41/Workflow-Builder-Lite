import { useCallback, useMemo } from "react";
import { getBrowserId } from "@/utils/browserIdManager";

export function useBrowserId(): string {
  return useMemo(getBrowserId, []);
}

export function useApiHeaders(): Record<string, string> {
  const browserId = useBrowserId();
  return useMemo(
    () => ({
      "Content-Type": "application/json",
      "X-Browser-ID": browserId,
    }),
    [browserId]
  );
}

export function useFetchWithAuth() {
  const headers = useApiHeaders();
  return useCallback(
    async (url: string, options: RequestInit = {}) => {
      const res = await fetch(url, {
        ...options,
        headers: { ...headers, ...options.headers },
      });
      return res;
    },
    [headers]
  );
}
