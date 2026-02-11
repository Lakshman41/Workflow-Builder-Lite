import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchHealth, type HealthResponse } from "@/api/health";

export function HealthIndicator() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchHealth()
      .then((h) => {
        if (!cancelled) setHealth(h);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <Link
        to="/status"
        className="rounded px-2 py-1 text-xs font-medium text-red-400 hover:bg-red-900/30"
      >
        Backend offline
      </Link>
    );
  }
  if (!health) {
    return (
      <span className="text-xs text-zinc-500">Checking…</span>
    );
  }
  const ok = health.status === "ok" && health.database === "connected";
  return (
    <Link
      to="/status"
      className={`rounded px-2 py-1 text-xs font-medium ${
        ok
          ? "text-emerald-400 hover:bg-emerald-900/30"
          : "text-amber-400 hover:bg-amber-900/30"
      }`}
    >
      {ok ? "Backend OK" : "Degraded"}
    </Link>
  );
}
