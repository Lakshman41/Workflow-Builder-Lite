import { create } from "zustand";
import type { Run, RunListItem } from "@/types/run";
import * as runService from "@/services/runService";

interface RunState {
  runs: RunListItem[];
  currentRun: Run | null;
  isExecuting: boolean;
  isLoading: boolean;
  error: string | null;
  fetchRuns: (limit?: number) => Promise<void>;
  fetchRun: (id: string) => Promise<Run | null>;
  executeWorkflow: (workflowId: string, inputText: string) => Promise<Run | null>;
  clearCurrentRun: () => void;
  setError: (error: string | null) => void;
}

export const useRunStore = create<RunState>((set) => ({
  runs: [],
  currentRun: null,
  isExecuting: false,
  isLoading: false,
  error: null,

  fetchRuns: async (limit = 5) => {
    set({ error: null, isLoading: true });
    try {
      const runs = await runService.getRuns(limit);
      set({ runs, isLoading: false });
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : "Failed to fetch runs",
        isLoading: false,
      });
    }
  },

  fetchRun: async (id: string) => {
    set({ error: null });
    try {
      const currentRun = await runService.getRun(id);
      set({ currentRun });
      return currentRun;
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : "Failed to fetch run",
      });
      return null;
    }
  },

  executeWorkflow: async (workflowId: string, inputText: string) => {
    set({ isExecuting: true, error: null });
    try {
      const created = await runService.executeWorkflow(workflowId, inputText);
      const run = await runService.getRun(created.run_id);
      set((s) => ({
        runs: run ? [{ id: run.id, workflow_id: run.workflow_id, workflow_name: null, input_text: run.input_text, status: run.status, started_at: run.started_at }, ...s.runs] : s.runs,
        currentRun: run ?? null,
        isExecuting: false,
      }));
      return run ?? null;
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : "Execution failed",
        isExecuting: false,
      });
      return null;
    }
  },

  clearCurrentRun: () => set({ currentRun: null }),
  setError: (error) => set({ error }),
}));
