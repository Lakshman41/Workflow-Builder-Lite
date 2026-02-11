import { Link, Outlet } from "react-router-dom";
import { HealthIndicator } from "@/components/status/HealthIndicator";

export function Layout() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 bg-zinc-900/80">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4">
          <Link
            to="/"
            className="text-lg font-semibold text-white hover:text-zinc-200"
          >
            Workflow Builder Lite
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              to="/"
              className="text-sm text-zinc-400 hover:text-zinc-200"
            >
              Workflows
            </Link>
            <Link
              to="/runs"
              className="text-sm text-zinc-400 hover:text-zinc-200"
            >
              Run History
            </Link>
            <Link
              to="/status"
              className="text-sm text-zinc-400 hover:text-zinc-200"
            >
              Status
            </Link>
            <HealthIndicator />
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
