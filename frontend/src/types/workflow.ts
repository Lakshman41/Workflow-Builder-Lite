export interface Step {
  id: string;
  workflow_id: string;
  name: string;
  description: string;
  step_type: "START" | "NORMAL" | "END";
  position: { x: number; y: number };
}

export interface Edge {
  id: string;
  workflow_id: string;
  source_step_id: string;
  target_step_id: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  browser_id: string;
  created_at: string;
  steps: Step[];
  edges: Edge[];
}

export interface WorkflowListItem {
  id: string;
  name: string;
  description: string;
  created_at: string;
}
