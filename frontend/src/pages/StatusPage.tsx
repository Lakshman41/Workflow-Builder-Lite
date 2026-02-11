import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getHealth } from "@/services/healthService";
import type { HealthResponse } from "@/api/health";

type ServiceStatus = "ok" | "degraded" | "error" | "not_implemented";

function StatusCard({
  serviceName,
  status,
  details,
}: {
  serviceName: string;
  status: ServiceStatus;
  details: Record<string, string | number>;
}) {
  const dotClass =
    status === "ok"
      ? "bg-emerald-500"
      : status === "error"
        ? "bg-red-500"
        : status === "degraded"
          ? "bg-amber-500"
          : "bg-zinc-500";
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 shrink-0 rounded-full ${dotClass}`} aria-hidden />
        <h2 className="text-lg font-medium text-white">{serviceName}</h2>
      </div>
      <dl className="mt-3 space-y-1 text-sm">
        {Object.entries(details).map(([key, value]) => (
          <div key={key} className="flex justify-between gap-2">
            <dt className="text-zinc-500">{key}</dt>
            <dd className="font-medium text-zinc-300">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function StatusPage() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  async function refresh() {
    setError(null);
    setLoading(true);
    try {
      const h = await getHealth();
      setHealth(h);
      setLastCheck(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to reach backend API");
      setHealth(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    const interval = setInterval(refresh, 10_000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !health) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-zinc-400">Loading status…</p>
      </div>
    );
  }

  const backendStatus: ServiceStatus =
    error || !health ? "error" : health.status === "ok" ? "ok" : "degraded";
  const dbStatus: ServiceStatus =
    !health ? "error" : health.database === "connected" ? "ok" : "error";
  const llmStatus: ServiceStatus = !health
    ? "error"
    : health.llm
      ? "ok"
      : "not_implemented";
  const redisStatus: ServiceStatus = !health
    ? "error"
    : health.redis === "not_implemented" || health.redis === "not_configured"
      ? "not_implemented"
      : health.redis === "connected"
        ? "ok"
        : "degraded";

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">System Status</h1>
          {lastCheck && (
            <p className="mt-1 text-sm text-zinc-500">
              Last check: {lastCheck.toLocaleTimeString()}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/"
            className="rounded-lg border border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800"
          >
            ← Back to Home
          </Link>
          <button
            type="button"
            onClick={() => refresh()}
            disabled={loading}
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-50"
          >
            {loading ? "Refreshing…" : "Refresh Status"}
          </button>
        </div>
      </div>

      {error && !health && (
        <div className="mb-4 rounded-lg border border-red-900/50 bg-red-950/30 p-4 text-red-200">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <StatusCard
          serviceName="Backend API"
          status={backendStatus}
          details={{
            Status: health?.status ?? "—",
            "Response time": health ? `${health.backend_response_time_ms} ms` : "—",
            "Last check": lastCheck ? "just now" : "—",
          }}
        />
        <StatusCard
          serviceName="Database (PostgreSQL)"
          status={dbStatus}
          details={{
            Status: health?.database ?? "—",
            "Last check": lastCheck ? "just now" : "—",
          }}
        />
        <StatusCard
          serviceName="LLM (Gemini)"
          status={llmStatus}
          details={{
            Status: health?.llm ?? "—",
            ...(health?.llm ? { Model: "gemini-2.5-flash" } : {}),
          }}
        />
        <StatusCard
          serviceName="Redis"
          status={redisStatus}
          details={{
            Status: health?.redis ?? "—",
          }}
        />
      </div>
    </div>
  );
}
