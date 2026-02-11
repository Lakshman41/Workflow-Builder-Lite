import { useEffect, useState } from "react";
import { useBrowserId } from "@/hooks/use-browser-id";
import { fetchRuns, fetchRun } from "@/api/runs";
import { RunDetailModal } from "./RunDetailModal";
import type { Run, RunListItem } from "@/types/run";

interface RunHistoryProps {
  workflowId: string | null;
  stepNames?: Record<string, string>;
}

export function RunHistory({ workflowId, stepNames = {} }: RunHistoryProps) {
  const browserId = useBrowserId();
  const [runs, setRuns] = useState<RunListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailRun, setDetailRun] = useState<Run | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchRuns(browserId, 20)
      .then((list) => {
        if (!cancelled) setRuns(list);
      })
      .catch(() => {
        if (!cancelled) setRuns([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [browserId]);

  const filtered = workflowId
    ? runs.filter((r) => r.workflow_id === workflowId)
    : runs;

  async function openRun(runId: string) {
    try {
      const run = await fetchRun(runId, browserId);
      setDetailRun(run ?? null);
    } catch {
      setDetailRun(null);
    }
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
      <h3 className="mb-3 text-sm font-semibold text-white">
        {workflowId ? "Runs for this workflow" : "Recent runs"}
      </h3>
      {loading ? (
        <p className="text-sm text-zinc-500">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-zinc-500">No runs yet.</p>
      ) : (
        <ul className="space-y-2">
          {filtered.slice(0, 10).map((r) => (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => openRun(r.id)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-left text-sm transition hover:bg-zinc-700/50"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-zinc-300">
                    {r.input_text.length > 40 ? `${r.input_text.slice(0, 40)}…` : r.input_text}
                  </span>
                  <span
                    className={`shrink-0 rounded px-2 py-0.5 text-xs ${
                      r.status === "completed"
                        ? "bg-emerald-900/50 text-emerald-300"
                        : r.status === "failed"
                          ? "bg-red-900/50 text-red-300"
                          : "bg-zinc-700 text-zinc-400"
                    }`}
                  >
                    {r.status}
                  </span>
                </div>
                <div className="mt-1 text-xs text-zinc-500">
                  {new Date(r.started_at).toLocaleString()}
                  {r.workflow_name && ` · ${r.workflow_name}`}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
      <RunDetailModal
        run={detailRun}
        stepNames={stepNames}
        onClose={() => setDetailRun(null)}
      />
    </div>
  );
}
