import { create } from "zustand";
import type { Workflow, WorkflowListItem } from "@/types/workflow";
import * as workflowService from "@/services/workflowService";

interface WorkflowState {
  workflows: WorkflowListItem[];
  currentWorkflow: Workflow | null;
  isLoading: boolean;
  error: string | null;
  fetchWorkflows: () => Promise<void>;
  fetchWorkflow: (id: string) => Promise<void>;
  createWorkflow: (data: { name: string; description?: string }) => Promise<Workflow>;
  updateWorkflow: (id: string, data: Parameters<typeof workflowService.updateWorkflow>[1]) => Promise<void>;
  deleteWorkflow: (id: string) => Promise<void>;
  validateWorkflow: (id: string) => Promise<{ valid: boolean; errors: string[] }>;
  clearCurrentWorkflow: () => void;
  setError: (error: string | null) => void;
}

export const useWorkflowStore = create<WorkflowState>((set) => ({
  workflows: [],
  currentWorkflow: null,
  isLoading: false,
  error: null,

  fetchWorkflows: async () => {
    set({ isLoading: true, error: null });
    try {
      const workflows = await workflowService.getWorkflows();
      set({ workflows, isLoading: false });
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : "Failed to fetch workflows",
        isLoading: false,
      });
    }
  },

  fetchWorkflow: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const currentWorkflow = await workflowService.getWorkflow(id);
      set({ currentWorkflow, isLoading: false });
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : "Failed to fetch workflow",
        isLoading: false,
      });
    }
  },

  createWorkflow: async (data) => {
    set({ error: null });
    const workflow = await workflowService.createWorkflow(data);
    set((s) => ({ workflows: [workflow, ...s.workflows] }));
    return workflow;
  },

  updateWorkflow: async (id, data) => {
    set({ error: null });
    const updated = await workflowService.updateWorkflow(id, data);
    set((s) => ({
      currentWorkflow: s.currentWorkflow?.id === id ? updated : s.currentWorkflow,
      workflows: s.workflows.map((w) =>
        w.id === id ? { ...w, name: updated.name, description: updated.description } : w
      ),
    }));
  },

  deleteWorkflow: async (id: string) => {
    set({ error: null });
    await workflowService.deleteWorkflow(id);
    set((s) => ({
      workflows: s.workflows.filter((w) => w.id !== id),
      currentWorkflow: s.currentWorkflow?.id === id ? null : s.currentWorkflow,
    }));
  },

  validateWorkflow: async (id: string) => {
    set({ error: null });
    return workflowService.validateWorkflow(id);
  },

  clearCurrentWorkflow: () => set({ currentWorkflow: null }),
  setError: (error) => set({ error }),
}));
