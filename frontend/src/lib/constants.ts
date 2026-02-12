/** Empty = same origin (dev proxy or single host). Set in build for separate frontend (e.g. VITE_API_BASE). */
export const API_BASE =
  typeof import.meta.env.VITE_API_BASE === "string"
    ? import.meta.env.VITE_API_BASE.replace(/\/$/, "")
    : "";

export const BROWSER_ID_KEY = "workflow-builder-browser-id";
