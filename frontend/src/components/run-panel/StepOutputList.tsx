import { useState } from "react";
import type { StepOutputRead } from "@/types/run";

interface StepOutputListProps {
  stepOutputs: StepOutputRead[];
  stepNames?: Record<string, string>;
}

export function StepOutputList({ stepOutputs, stepNames = {} }: StepOutputListProps) {
  const [openId, setOpenId] = useState<string | null>(
    stepOutputs[0]?.id ?? null
  );

  if (stepOutputs.length === 0) {
    return (
      <p className="text-sm text-zinc-500">No step outputs yet.</p>
    );
  }

  return (
    <ul className="space-y-2">
      {stepOutputs.map((so, i) => {
        const name = stepNames[so.step_id] ?? `Step ${i + 1}`;
        const isOpen = openId === so.id;
        return (
          <li
            key={so.id}
            className="rounded-lg border border-zinc-700 bg-zinc-800/50 overflow-hidden"
          >
            <button
              type="button"
              onClick={() => setOpenId(isOpen ? null : so.id)}
              className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left hover:bg-zinc-700/50"
              aria-expanded={isOpen}
            >
              <span className="text-sm font-medium text-zinc-300 truncate">
                {name}
              </span>
              <span className="flex items-center gap-2 shrink-0">
                {so.duration_ms != null && (
                  <span className="text-xs text-zinc-500">
                    {(so.duration_ms / 1000).toFixed(1)}s
                  </span>
                )}
                <span className="text-zinc-500">{isOpen ? "▼" : "▶"}</span>
              </span>
            </button>
            {isOpen && (
              <div className="border-t border-zinc-700 px-3 py-2 space-y-2 text-sm">
                <div>
                  <span className="text-zinc-500 text-xs">Input</span>
                  <pre className="mt-0.5 max-h-32 overflow-auto whitespace-pre-wrap break-words rounded bg-zinc-900/80 p-2 font-sans text-zinc-300 text-xs">
                    {so.input_text}
                  </pre>
                </div>
                <div>
                  <span className="text-zinc-500 text-xs">Output</span>
                  <pre className="mt-0.5 max-h-32 overflow-auto whitespace-pre-wrap break-words rounded bg-zinc-900/80 p-2 font-sans text-zinc-300 text-xs">
                    {so.output_text}
                  </pre>
                </div>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
