/**
 * Workflow editor: canvas (ReactFlow), step/edge CRUD, save, validate, run panel.
 * Loads workflow from API, syncs to nodes/edges. Connections are one-in one-out per step (linear chain).
 */
import { useCallback, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
  type Node,
  type Edge,
  type EdgeChange,
  type Connection,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import toast from "react-hot-toast";
import { useWorkflowStore } from "@/stores/workflowStore";
import { addStep as apiAddStep, updateStep as apiUpdateStep, deleteStep as apiDeleteStep } from "@/api/workflows";
import * as workflowService from "@/services/workflowService";
import { getBrowserId } from "@/utils/browserIdManager";
import { StepNode, type StepNodeData } from "@/components/workflow/StepNode";
import { StepCreationModal, type StepFormData } from "@/components/workflow/StepCreationModal";
import { PredefinedStepsSidebar } from "@/components/workflow/PredefinedStepsSidebar";
import { ConfirmDialog } from "@/components/workflow/ConfirmDialog";
import { RunPanel } from "@/components/run-panel/RunPanel";
import { RunHistory } from "@/components/history/RunHistory";
import type { Workflow } from "@/types/workflow";

const nodeTypes = { stepNode: StepNode };

/** Map API workflow (steps + edges) to ReactFlow nodes and edges. */
function workflowToFlow(
  workflow: Workflow,
  onEdit: (stepId: string) => void,
  onDelete: (stepId: string) => void
): { nodes: Node<StepNodeData, "stepNode">[]; edges: Edge[] } {
  const nodes: Node<StepNodeData, "stepNode">[] = workflow.steps.map((s) => ({
    id: s.id,
    type: "stepNode",
    position: {
      x: typeof s.position?.x === "number" ? s.position.x : 0,
      y: typeof s.position?.y === "number" ? s.position.y : 0,
    },
    data: {
      id: s.id,
      name: s.name,
      description: s.description,
      step_type: s.step_type as StepNodeData["step_type"],
      onEdit,
      onDelete,
    },
  }));
  const edges: Edge[] = workflow.edges.map((e) => ({
    id: e.id,
    source: e.source_step_id,
    target: e.target_step_id,
    markerEnd: { type: MarkerType.ArrowClosed },
  }));
  return { nodes, edges };
}

export function WorkflowEditorPage() {
  const { workflowId } = useParams<{ workflowId: string }>();
  const {
    currentWorkflow: workflow,
    isLoading: loading,
    error,
    fetchWorkflow,
    updateWorkflow,
    validateWorkflow,
    clearCurrentWorkflow,
  } = useWorkflowStore();

  const [nodes, setNodes, onNodesChange] = useNodesState<Node<StepNodeData, "stepNode">>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [stepModalOpen, setStepModalOpen] = useState(false);
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [addingStep, setAddingStep] = useState(false);
  const [deleteStepId, setDeleteStepId] = useState<string | null>(null);
  const [deletingStep, setDeletingStep] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [workflowNameEditOpen, setWorkflowNameEditOpen] = useState(false);
  const [workflowNameValue, setWorkflowNameValue] = useState("");
  const [savingName, setSavingName] = useState(false);

  const onEditStep = useCallback((stepId: string) => {
    setEditingStepId(stepId);
    setStepModalOpen(true);
  }, []);
  const onDeleteStep = useCallback((stepId: string) => setDeleteStepId(stepId), []);

  useEffect(() => {
    if (!workflowId) return;
    fetchWorkflow(workflowId);
    return () => clearCurrentWorkflow();
  }, [workflowId, fetchWorkflow, clearCurrentWorkflow]);

  useEffect(() => {
    if (!workflow) return;
    const { nodes: n, edges: e } = workflowToFlow(workflow, onEditStep, onDeleteStep);
    setNodes(n);
    setEdges(e);
  }, [workflow]); // sync when workflow loads or is refetched (e.g. after Save)

  const handleConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  // At most one outgoing edge per step, one incoming per step (linear chain).
  const isValidConnection = useCallback(
    (params: Connection | Edge) => {
      const source = "source" in params ? params.source : null;
      const target = "target" in params ? params.target : null;
      if (source == null || target == null) return false;
      const sourceHasOut = edges.some((e) => e.source === source);
      const targetHasIn = edges.some((e) => e.target === target);
      return !sourceHasOut && !targetHasIn;
    },
    [edges]
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      for (const c of changes) {
        if (c.type === "remove" && "id" in c && workflowId) {
          workflowService.deleteEdge(workflowId, c.id).catch((e) => {
            toast.error(e instanceof Error ? e.message : "Failed to remove connection");
            fetchWorkflow(workflowId);
          });
        }
      }
      onEdgesChange(changes);
    },
    [workflowId, onEdgesChange, fetchWorkflow]
  );

  const handleSaveWorkflowName = useCallback(async () => {
    if (!workflowId || !workflowNameValue.trim()) return;
    setSavingName(true);
    try {
      await updateWorkflow(workflowId, { name: workflowNameValue.trim() });
      await fetchWorkflow(workflowId);
      setWorkflowNameEditOpen(false);
      toast.success("Workflow name updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update name");
    } finally {
      setSavingName(false);
    }
  }, [workflowId, workflowNameValue, updateWorkflow, fetchWorkflow]);

  const handleSave = useCallback(async () => {
    if (!workflowId || !workflow) return;
    setSaving(true);
    try {
      const steps = nodes.map((n) => ({
        name: n.data.name,
        description: n.data.description,
        step_type: n.data.step_type,
        position: n.position,
      }));
      const edgesByIndex = edges
        .map((e) => {
          const si = nodes.findIndex((n) => n.id === e.source);
          const ti = nodes.findIndex((n) => n.id === e.target);
          if (si === -1 || ti === -1) return null;
          return { source_index: si, target_index: ti };
        })
        .filter((e): e is { source_index: number; target_index: number } => e !== null);
      await updateWorkflow(workflowId, { steps, edges: edgesByIndex });
      await fetchWorkflow(workflowId);
      toast.success("Workflow saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }, [workflowId, workflow, nodes, edges, updateWorkflow, fetchWorkflow]);

  const handleValidate = useCallback(async () => {
    if (!workflowId) return;
    try {
      const result = await validateWorkflow(workflowId);
      if (result.valid) toast.success("Workflow is valid ✓");
      else toast.error(`Validation failed:\n${result.errors.map((e) => `• ${e}`).join("\n")}`, { duration: 8000 });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Validation failed");
    }
  }, [workflowId, validateWorkflow]);

  const handleAddStep = useCallback(
    async (data: StepFormData) => {
      if (!workflowId) return;
      setAddingStep(true);
      try {
        const pos = nodes.length > 0
          ? { x: 250 * nodes.length, y: 100 }
          : { x: 100, y: 100 };
        const created = await apiAddStep(workflowId, getBrowserId(), {
          name: data.name,
          description: data.description,
          step_type: data.step_type,
          position: pos,
        });
        const newNode: Node<StepNodeData, "stepNode"> = {
          id: created.id,
          type: "stepNode",
          position: { x: pos.x, y: pos.y },
          data: {
            id: created.id,
            name: created.name,
            description: created.description,
            step_type: created.step_type as StepNodeData["step_type"],
            onEdit: onEditStep,
            onDelete: onDeleteStep,
          },
        };
        setNodes((nds) => [...nds, newNode]);
        setStepModalOpen(false);
        toast.success("Step added");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to add step");
      } finally {
        setAddingStep(false);
      }
    },
    [workflowId, nodes.length, onEditStep, onDeleteStep, setNodes]
  );

  const handleUpdateStep = useCallback(
    async (data: StepFormData) => {
      if (!workflowId || !editingStepId) return;
      try {
        await apiUpdateStep(workflowId, editingStepId, getBrowserId(), {
          name: data.name,
          description: data.description,
          step_type: data.step_type,
        });
        setNodes((nds) =>
          nds.map((n) =>
            n.id === editingStepId
              ? { ...n, data: { ...n.data, name: data.name, description: data.description, step_type: data.step_type } }
              : n
          )
        );
        setStepModalOpen(false);
        setEditingStepId(null);
        toast.success("Step updated");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to update step");
      }
    },
    [workflowId, editingStepId, setNodes]
  );

  const handleStepModalSubmit = useCallback(
    (data: StepFormData) => {
      if (editingStepId) handleUpdateStep(data);
      else handleAddStep(data);
    },
    [editingStepId, handleUpdateStep, handleAddStep]
  );

  const handlePredefinedAdd = useCallback(
    (name: string, description: string) => {
      const pos = nodes.length > 0 ? { x: 250 * nodes.length, y: 100 } : { x: 100, y: 100 };
      apiAddStep(workflowId!, getBrowserId(), {
        name,
        description,
        step_type: "NORMAL",
        position: pos,
      })
        .then((created) => {
          const newNode: Node<StepNodeData, "stepNode"> = {
            id: created.id,
            type: "stepNode",
            position: { x: pos.x, y: pos.y },
            data: {
              id: created.id,
              name: created.name,
              description: created.description,
              step_type: "NORMAL",
              onEdit: onEditStep,
              onDelete: onDeleteStep,
            },
          };
          setNodes((nds) => [...nds, newNode]);
          toast.success("Step added");
        })
        .catch((e) => toast.error(e instanceof Error ? e.message : "Failed to add step"));
    },
    [workflowId, nodes.length, onEditStep, onDeleteStep, setNodes]
  );

  const handleConfirmDeleteStep = useCallback(async () => {
    if (!workflowId || !deleteStepId) return;
    setDeletingStep(true);
    try {
      await apiDeleteStep(workflowId, deleteStepId, getBrowserId());
      setNodes((nds) => nds.filter((n) => n.id !== deleteStepId));
      setEdges((eds) => eds.filter((e) => e.source !== deleteStepId && e.target !== deleteStepId));
      setDeleteStepId(null);
      toast.success("Step removed");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete step");
    } finally {
      setDeletingStep(false);
    }
  }, [workflowId, deleteStepId, setNodes, setEdges]);

  if (!workflowId) {
    return (
      <div className="text-zinc-400">
        <Link to="/" className="text-sky-400 hover:underline">← Back</Link>
        <p className="mt-4">Missing workflow ID.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-zinc-400">Loading workflow…</p>
      </div>
    );
  }

  if (error || !workflow) {
    return (
      <div>
        <Link to="/" className="text-sky-400 hover:underline">← Back</Link>
        <div className="mt-4 rounded-lg border border-red-900/50 bg-red-950/30 p-4 text-red-200">
          {error ?? "Workflow not found."}
        </div>
      </div>
    );
  }

  const stepNames = Object.fromEntries(workflow.steps.map((s) => [s.id, s.name]));
  const editingStep = editingStepId ? nodes.find((n) => n.id === editingStepId) : null;
  const initialStepForm: StepFormData | null = editingStep
    ? {
        name: editingStep.data.name,
        description: editingStep.data.description,
        step_type: editingStep.data.step_type,
      }
    : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-sky-400 hover:underline">← Back</Link>
          <h1 className="text-xl font-semibold text-white">{workflow.name}</h1>
          <button
            type="button"
            onClick={() => {
              setWorkflowNameValue(workflow.name);
              setWorkflowNameEditOpen(true);
            }}
            className="rounded border border-zinc-600 px-2 py-1 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            aria-label="Edit workflow name"
          >
            Edit name
          </button>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleValidate}
            className="rounded-lg border border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800"
          >
            Validate
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={() => { setEditingStepId(null); setStepModalOpen(true); }}
            className="rounded-lg border border-emerald-600 px-4 py-2 text-sm font-medium text-emerald-300 hover:bg-emerald-950/50"
          >
            + New Step
          </button>
        </div>
      </div>

      <div className="flex gap-0">
        <div className="min-h-[500px] flex-1 rounded-xl border border-zinc-800 bg-zinc-900/30">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={handleConnect}
            isValidConnection={isValidConnection}
            nodeTypes={nodeTypes}
            defaultEdgeOptions={{ markerEnd: { type: MarkerType.ArrowClosed } }}
            fitView
            className="h-[500px] bg-zinc-900"
          >
            <Background color="#3f3f46" gap={16} />
            <Controls className="!border-zinc-700 !bg-zinc-800" />
            <MiniMap
              nodeColor="#3b82f6"
              maskColor="rgb(24 24 27 / 0.8)"
              className="!bg-zinc-800"
            />
          </ReactFlow>
        </div>
        <PredefinedStepsSidebar
          onAddStep={handlePredefinedAdd}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((c) => !c)}
        />
        <div className="w-80 shrink-0 flex flex-col gap-4 pl-4">
          <RunPanel workflowId={workflowId} workflow={workflow} />
          <RunHistory workflowId={workflowId} stepNames={stepNames} />
        </div>
      </div>

      <StepCreationModal
        open={stepModalOpen}
        onClose={() => { setStepModalOpen(false); setEditingStepId(null); }}
        onSubmit={handleStepModalSubmit}
        initialData={initialStepForm}
        isSubmitting={addingStep}
      />
      <ConfirmDialog
        open={!!deleteStepId}
        title="Remove step"
        message="Remove this step from the workflow?"
        confirmLabel="Remove"
        variant="danger"
        onConfirm={handleConfirmDeleteStep}
        onCancel={() => setDeleteStepId(null)}
        isLoading={deletingStep}
      />

      {workflowNameEditOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setWorkflowNameEditOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Edit workflow name"
        >
          <div
            className="w-full max-w-md rounded-xl border border-zinc-700 bg-zinc-900 p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-white">Edit workflow name</h2>
            <input
              type="text"
              value={workflowNameValue}
              onChange={(e) => setWorkflowNameValue(e.target.value)}
              placeholder="Workflow name"
              maxLength={255}
              className="mt-4 w-full rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-white placeholder-zinc-500 focus:border-sky-500 focus:outline-none"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setWorkflowNameEditOpen(false)}
                className="rounded-lg border border-zinc-600 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveWorkflowName}
                disabled={!workflowNameValue.trim() || savingName}
                className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-50"
              >
                {savingName ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
