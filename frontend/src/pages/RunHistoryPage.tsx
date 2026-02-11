import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useRunStore } from "@/stores/runStore";
import { RunDetailModal } from "@/components/history/RunDetailModal";
import type { Run } from "@/types/run";

export function RunHistoryPage() {
  const { runs, isLoading, error, fetchRuns, fetchRun, setError } = useRunStore();
  const [detailRun, setDetailRun] = useState<Run | null>(null);
  const [limit, setLimit] = useState(5);

  useEffect(() => {
    fetchRuns(limit);
  }, [fetchRuns, limit]);

  async function openRun(runId: string) {
    const run = await fetchRun(runId);
    setDetailRun(run ?? null);
  }

  function statusBadge(status: string) {
    const classes =
      status === "completed"
        ? "bg-emerald-900/50 text-emerald-300"
        : status === "failed"
          ? "bg-red-900/50 text-red-300"
          : status === "running"
            ? "bg-amber-900/50 text-amber-300"
            : "bg-zinc-700 text-zinc-400";
    return (
      <span className={`shrink-0 rounded px-2 py-0.5 text-xs ${classes}`}>
        {status}
      </span>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Run History</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Recent workflow runs. View details to see step-by-step outputs.
          </p>
        </div>
        <Link
          to="/"
          className="rounded-lg border border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800"
        >
          ← Back to Home
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-900/50 bg-red-950/30 p-4 text-red-200">
          {error}
          <button
            type="button"
            onClick={() => { setError(null); fetchRuns(limit); }}
            className="ml-2 text-sm underline"
          >
            Retry
          </button>
        </div>
      )}

      {isLoading ? (
        <p className="text-zinc-400">Loading runs…</p>
      ) : runs.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center text-zinc-400">
          No runs yet. Execute a workflow to see results here.
        </div>
      ) : (
        <div className="space-y-4">
          {runs.map((r) => (
            <div
              key={r.id}
              className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium text-white">
                  {r.workflow_name ?? "Workflow"}
                </span>
                {statusBadge(r.status)}
              </div>
              <p className="mt-1 text-sm text-zinc-500">
                Started: {new Date(r.started_at).toLocaleString()}
              </p>
              <p className="mt-2 line-clamp-2 text-sm text-zinc-400">
                Input: {r.input_text.length > 100 ? `${r.input_text.slice(0, 100)}…` : r.input_text}
              </p>
              <button
                type="button"
                onClick={() => openRun(r.id)}
                className="mt-3 rounded border border-zinc-600 px-3 py-1 text-sm text-zinc-300 hover:bg-zinc-800"
              >
                View Details
              </button>
            </div>
          ))}
          {limit <= runs.length && (
            <button
              type="button"
              onClick={() => setLimit((l) => l + 10)}
              className="rounded-lg border border-zinc-600 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
            >
              Load More
            </button>
          )}
        </div>
      )}

      <RunDetailModal
        run={detailRun}
        stepNames={{}}
        onClose={() => setDetailRun(null)}
      />
    </div>
  );
}
