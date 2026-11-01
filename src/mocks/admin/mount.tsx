import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MockAdmin } from "./MockAdminPanel";

export function mountMockAdmin() {
  const container = document.createElement("div");
  container.id = "mock-admin";
  document.body.append(container);
  createRoot(container).render(
    <StrictMode>
      <MockAdmin />
    </StrictMode>,
  );
}
