export interface StepOutputRead {
  id: string;
  run_id: string;
  step_id: string;
  input_text: string;
  output_text: string;
  duration_ms: number | null;
}

export interface Run {
  id: string;
  workflow_id: string;
  browser_id: string;
  input_text: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  error_message: string | null;
  step_outputs: StepOutputRead[];
}

export interface RunListItem {
  id: string;
  workflow_id: string;
  workflow_name: string | null;
  input_text: string;
  status: string;
  started_at: string;
}

export interface RunCreated {
  run_id: string;
  workflow_id: string;
  status: string;
}
