import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { getBrowserId } from "@/utils/browserIdManager";
import App from "./App";

getBrowserId();
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
