import { memo } from "react";
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";

export type StepNodeData = {
  id: string;
  name: string;
  description: string;
  step_type: "START" | "NORMAL" | "END";
  onEdit?: (stepId: string) => void;
  onDelete?: (stepId: string) => void;
};

export type StepNodeType = Node<StepNodeData, "stepNode">;

const typeStyles: Record<StepNodeData["step_type"], string> = {
  START: "border-green-500 bg-green-950/50",
  NORMAL: "border-blue-500 bg-blue-950/50",
  END: "border-red-500 bg-red-950/50",
};

function StepNodeComponent({ data, selected }: NodeProps<StepNodeType>) {
  const { id, name, description, step_type, onEdit, onDelete } = data;
  const style = typeStyles[step_type] ?? typeStyles.NORMAL;

  return (
    <div
      className={`min-w-[180px] max-w-[240px] rounded-lg border-2 px-4 py-3 ${style} ${
        selected ? "ring-2 ring-sky-400" : ""
      }`}
    >
      <Handle type="target" position={Position.Left} className="!w-2 !h-2 !border-2 !border-zinc-400 !bg-zinc-800" />
      <Handle type="source" position={Position.Right} className="!w-2 !h-2 !border-2 !border-zinc-400 !bg-zinc-800" />

      <div className="flex items-center justify-between gap-2">
        <span
          className={`rounded px-2 py-0.5 text-xs font-medium ${
            step_type === "START"
              ? "bg-green-800/60 text-green-200"
              : step_type === "END"
                ? "bg-red-800/60 text-red-200"
                : "bg-blue-800/60 text-blue-200"
          }`}
        >
          {step_type}
        </span>
      </div>
      <h3 className="mt-1 font-semibold text-white truncate" title={name}>
        {name}
      </h3>
      {description ? (
        <p className="mt-0.5 line-clamp-2 text-xs text-zinc-400" title={description}>
          {description}
        </p>
      ) : null}
      <div className="mt-2 flex gap-1">
        {onEdit && (
          <button
            type="button"
            className="nodrag rounded border border-zinc-600 px-2 py-0.5 text-xs text-zinc-300 hover:bg-zinc-700"
            onClick={() => onEdit(id)}
            aria-label={`Edit ${name}`}
          >
            Edit
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            className="nodrag rounded border border-red-900/50 px-2 py-0.5 text-xs text-red-300 hover:bg-red-950/50"
            onClick={() => onDelete(id)}
            aria-label={`Delete ${name}`}
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

export const StepNode = memo(StepNodeComponent);
