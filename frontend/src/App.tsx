import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { Layout } from "@/components/layout/Layout";
import { WorkflowsListPage } from "@/pages/WorkflowsListPage";
import { WorkflowEditorPage } from "@/pages/WorkflowEditorPage";
import { RunHistoryPage } from "@/pages/RunHistoryPage";
import { StatusPage } from "@/pages/StatusPage";
import "@/index.css";

/** Routes: / = workflows list, /workflow/:id = editor, /runs = history, /status = health. */
export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 5000 }} />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<WorkflowsListPage />} />
          <Route path="workflow/:workflowId" element={<WorkflowEditorPage />} />
          <Route path="runs" element={<RunHistoryPage />} />
          <Route path="status" element={<StatusPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
