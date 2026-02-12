import { useState } from "react";
import toast from "react-hot-toast";
import { validateWorkflow } from "@/api/workflows";
import { createRun, fetchRun } from "@/api/runs";
import { useBrowserId } from "@/hooks/use-browser-id";
import { StepOutputList } from "./StepOutputList";
import type { Run } from "@/types/run";
import type { Workflow } from "@/types/workflow";

interface RunPanelProps {
  workflowId: string;
  workflow: Workflow | null;
}

export function RunPanel({ workflowId, workflow }: RunPanelProps) {
  const browserId = useBrowserId();
  const [inputText, setInputText] = useState("");
  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [lastRun, setLastRun] = useState<Run | null>(null);

  const stepNames = workflow
    ? Object.fromEntries(workflow.steps.map((s) => [s.id, s.name]))
    : {};

  async function handleRun() {
    if (!inputText.trim()) {
      toast.error("Enter some text to run the workflow.");
      return;
    }
    setRunError(null);
    setLastRun(null);

    try {
      const validation = await validateWorkflow(workflowId, browserId);
      if (!validation.valid) {
        const msg = validation.errors.length
          ? validation.errors.join(". ")
          : "Workflow is invalid.";
        toast.error(msg, { duration: 8000 });
        setRunError(msg);
        return;
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Validation failed");
      setRunError(e instanceof Error ? e.message : "Validation failed");
      return;
    }

    setRunning(true);
    try {
      const created = await createRun(workflowId, inputText.trim(), browserId);
      const run = await fetchRun(created.run_id, browserId);
      setLastRun(run ?? null);
      if (run?.status === "failed" && run.error_message) {
        toast.error(run.error_message, { duration: 8000 });
        setRunError(run.error_message);
      } else if (run?.status === "completed") {
        toast.success("Run completed");
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Run failed";
      toast.error(msg);
      setRunError(msg);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
      <h3 className="mb-3 text-sm font-semibold text-white">Run workflow</h3>
      <textarea
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder="Paste the text you want to process..."
        rows={4}
        className="w-full resize-y rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-sky-500 focus:outline-none"
      />
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={handleRun}
          disabled={running || !inputText.trim()}
          className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-50"
        >
          {running ? "Running…" : "▶ Run Workflow"}
        </button>
      </div>
      {running && (
        <p className="mt-2 text-xs text-zinc-400">
          Processing workflow... This may take 10–30 seconds.
        </p>
      )}
      {runError && !running && (
        <p className="mt-2 text-sm text-red-400">{runError}</p>
      )}
      {lastRun && (
        <div className="mt-4">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-sm font-medium text-zinc-300">Result</span>
            <span
              className={`rounded px-2 py-0.5 text-xs font-medium ${
                lastRun.status === "completed"
                  ? "bg-emerald-900/50 text-emerald-300"
                  : "bg-red-900/50 text-red-300"
              }`}
            >
              {lastRun.status}
            </span>
          </div>
          {lastRun.error_message && (
            <p className="mb-2 text-sm text-red-400">{lastRun.error_message}</p>
          )}
          <StepOutputList
            stepOutputs={lastRun.step_outputs}
            stepNames={stepNames}
          />
        </div>
      )}
    </div>
  );
}
