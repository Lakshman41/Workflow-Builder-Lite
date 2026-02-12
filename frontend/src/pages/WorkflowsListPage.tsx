import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useWorkflowStore } from "@/stores/workflowStore";
import { NewWorkflowModal } from "@/components/workflow/NewWorkflowModal";
import { ConfirmDialog } from "@/components/workflow/ConfirmDialog";

export function WorkflowsListPage() {
  const navigate = useNavigate();
  const {
    workflows,
    isLoading,
    error,
    fetchWorkflows,
    createWorkflow,
    deleteWorkflow,
    setError,
  } = useWorkflowStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  async function handleCreate(data: { name: string; description: string }) {
    setCreating(true);
    try {
      const w = await createWorkflow({ name: data.name, description: data.description || undefined });
      setModalOpen(false);
      toast.success("Workflow created");
      navigate(`/workflow/${w.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create workflow");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    setDeleting(true);
    try {
      await deleteWorkflow(id);
      setDeleteId(null);
      toast.success("Workflow deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete workflow");
    } finally {
      setDeleting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-zinc-400">Loading workflows…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-900/50 bg-red-950/30 p-4 text-red-200">
        <p>{error}</p>
        <p className="mt-2 text-sm text-zinc-400">
          Ensure the backend is running and CORS is allowed.
        </p>
        <button
          type="button"
          onClick={() => { setError(null); fetchWorkflows(); }}
          className="mt-3 rounded bg-red-800/50 px-3 py-1 text-sm hover:bg-red-800"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Workflow Builder Lite</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Create and run workflows. Open a workflow to edit on the canvas.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-500"
          aria-label="New workflow"
        >
          + New Workflow
        </button>
      </div>

      <div className="mb-6 rounded-lg border border-zinc-800 bg-zinc-900/30 px-4 py-3 text-sm text-zinc-400">
        <p className="font-medium text-zinc-300">How to get started</p>
        <ol className="mt-2 list-inside list-decimal space-y-1">
          <li>Create a workflow (button above).</li>
          <li>Add steps (e.g. Clean text, Summarize, Extract key points) and set one as START and one as END.</li>
          <li>Connect steps by dragging from one node to the next, then Save.</li>
          <li>Paste input text in the Run panel and click Run to see each step’s output.</li>
          <li>View <Link to="/runs" className="text-sky-400 hover:underline">Run History</Link> and <Link to="/status" className="text-sky-400 hover:underline">Status</Link> (backend, database, LLM health).</li>
        </ol>
      </div>

      {workflows.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center text-zinc-400">
          <p>No workflows yet.</p>
          <p className="mt-2 text-sm">
            Create your first one to get started!
          </p>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="mt-4 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500"
          >
            + New Workflow
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workflows.map((w) => (
            <div
              key={w.id}
              className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 transition hover:border-zinc-600 hover:bg-zinc-800/50"
            >
              <Link to={`/workflow/${w.id}`} className="block">
                <h2 className="font-medium text-white">{w.name}</h2>
                {w.description ? (
                  <p className="mt-1 line-clamp-2 text-sm text-zinc-400">
                    {w.description}
                  </p>
                ) : null}
                <p className="mt-3 text-xs text-zinc-500">
                  {new Date(w.created_at).toLocaleDateString()}
                </p>
              </Link>
              <div className="mt-3 flex gap-2">
                <Link
                  to={`/workflow/${w.id}`}
                  className="rounded border border-zinc-600 px-3 py-1 text-sm text-zinc-300 hover:bg-zinc-800"
                >
                  Edit
                </Link>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setDeleteId(w.id);
                  }}
                  className="rounded border border-red-900/50 px-3 py-1 text-sm text-red-300 hover:bg-red-950/50"
                  aria-label={`Delete ${w.name}`}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 flex gap-4 text-sm">
        <Link to="/runs" className="text-sky-400 hover:text-sky-300">
          View All Runs
        </Link>
        <Link to="/status" className="text-sky-400 hover:text-sky-300">
          Status Page
        </Link>
      </div>

      <NewWorkflowModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreate}
        isSubmitting={creating}
      />
      <ConfirmDialog
        open={!!deleteId}
        title="Delete workflow"
        message="Are you sure you want to delete this workflow? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={() => deleteId && handleDelete(deleteId)}
        onCancel={() => setDeleteId(null)}
        isLoading={deleting}
      />
    </div>
  );
}
