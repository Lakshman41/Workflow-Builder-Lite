import type { Run } from "@/types/run";
import { StepOutputList } from "@/components/run-panel/StepOutputList";

interface RunDetailModalProps {
  run: Run | null;
  stepNames?: Record<string, string>;
  onClose: () => void;
}

export function RunDetailModal({ run, stepNames = {}, onClose }: RunDetailModalProps) {
  if (!run) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Run details"
    >
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-auto rounded-xl border border-zinc-700 bg-zinc-900 p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Run details</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-zinc-400 hover:bg-zinc-700 hover:text-white"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="space-y-2 text-sm">
          <p>
            <span className="text-zinc-500">Status:</span>{" "}
            <span
              className={
                run.status === "completed"
                  ? "text-emerald-400"
                  : "text-red-400"
              }
            >
              {run.status}
            </span>
          </p>
          {run.error_message && (
            <p className="text-red-400">{run.error_message}</p>
          )}
          <p>
            <span className="text-zinc-500">Started:</span>{" "}
            {new Date(run.started_at).toLocaleString()}
          </p>
          {run.completed_at && (
            <p>
              <span className="text-zinc-500">Completed:</span>{" "}
              {new Date(run.completed_at).toLocaleString()}
            </p>
          )}
        </div>
        <div className="mt-4">
          <h4 className="mb-2 text-sm font-medium text-zinc-400">Step outputs</h4>
          <StepOutputList stepOutputs={run.step_outputs} stepNames={stepNames} />
        </div>
      </div>
    </div>
  );
}
