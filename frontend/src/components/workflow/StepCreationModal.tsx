import { useState, useEffect } from "react";

export type StepType = "START" | "NORMAL" | "END";

export interface StepFormData {
  name: string;
  description: string;
  step_type: StepType;
}

interface StepCreationModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: StepFormData) => void;
  initialData?: StepFormData | null;
  isSubmitting?: boolean;
}

const STEP_TYPES: StepType[] = ["START", "NORMAL", "END"];

export function StepCreationModal({
  open,
  onClose,
  onSubmit,
  initialData = null,
  isSubmitting = false,
}: StepCreationModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [step_type, setStepType] = useState<StepType>("NORMAL");

  const isEdit = !!initialData;

  useEffect(() => {
    if (open) {
      if (initialData) {
        setName(initialData.name);
        setDescription(initialData.description);
        setStepType(initialData.step_type);
      } else {
        setName("");
        setDescription("");
        setStepType("NORMAL");
      }
    }
  }, [open, initialData]);

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;
    onSubmit({
      name: trimmedName,
      description: description.trim(),
      step_type,
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={isEdit ? "Edit step" : "Add step"}
    >
      <div
        className="w-full max-w-lg rounded-xl border border-zinc-700 bg-zinc-900 p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-white">
          {isEdit ? "Edit Step" : "Add Step"}
        </h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="step-name" className="block text-sm font-medium text-zinc-300">
              Step Name
            </label>
            <input
              id="step-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Clean Text"
              maxLength={100}
              className="mt-1 w-full rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-white placeholder-zinc-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              required
            />
          </div>
          <div>
            <label htmlFor="step-desc" className="block text-sm font-medium text-zinc-300">
              Description
            </label>
            <textarea
              id="step-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this step should do in natural language..."
              rows={4}
              className="mt-1 w-full rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-white placeholder-zinc-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
            <p className="mt-1 text-xs text-zinc-500">
              e.g. &quot;Remove all email addresses&quot;, &quot;Translate to Spanish&quot;, &quot;Extract key points as bullets&quot;
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300">Step Type</label>
            <select
              value={step_type}
              onChange={(e) => setStepType(e.target.value as StepType)}
              className="mt-1 w-full rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-white focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            >
              {STEP_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || isSubmitting}
              className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-50"
            >
              {isSubmitting ? "Saving…" : isEdit ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
