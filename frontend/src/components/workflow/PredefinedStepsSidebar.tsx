import { PREDEFINED_STEPS } from "@/constants/predefinedSteps";

interface PredefinedStepsSidebarProps {
  onAddStep: (name: string, description: string) => void;
  collapsed?: boolean;
  onToggle?: () => void;
}

export function PredefinedStepsSidebar({
  onAddStep,
  collapsed = false,
  onToggle,
}: PredefinedStepsSidebarProps) {
  if (collapsed) {
    return (
      <div className="flex flex-col items-center border-l border-zinc-800 bg-zinc-900/50 p-2">
        <button
          type="button"
          onClick={onToggle}
          className="rounded p-1 text-zinc-400 hover:bg-zinc-700 hover:text-white"
          aria-label="Open predefined steps"
        >
          →
        </button>
      </div>
    );
  }

  return (
    <div className="w-56 shrink-0 border-l border-zinc-800 bg-zinc-900/50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Predefined Steps</h3>
        {onToggle && (
          <button
            type="button"
            onClick={onToggle}
            className="rounded p-1 text-zinc-400 hover:bg-zinc-700 hover:text-white"
            aria-label="Collapse sidebar"
          >
            ←
          </button>
        )}
      </div>
      <ul className="space-y-2">
        {PREDEFINED_STEPS.map((step) => (
          <li
            key={step.name}
            className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-3"
          >
            <div className="flex items-center gap-2">
              {step.icon && <span className="text-lg">{step.icon}</span>}
              <span className="font-medium text-white">{step.name}</span>
            </div>
            <p className="mt-1 text-xs text-zinc-400 line-clamp-2">{step.description}</p>
            <button
              type="button"
              onClick={() => onAddStep(step.name, step.description)}
              className="mt-2 w-full rounded border border-zinc-600 py-1 text-xs font-medium text-zinc-300 hover:bg-zinc-700"
            >
              Add
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
