import { createFileRoute } from "@tanstack/react-router";
import { InternDashboard } from "@/components/InternDashboard";

// /dashboard is the canonical intern home (ROLE_HOME.intern = "/dashboard").
// Imports from a non-route component file to satisfy TanStack Router code-splitting rules.
export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — APEX AI Launchpad" },
      {
        name: "description",
        content: "A snapshot of your daily progress, modules, and quick actions.",
      },
    ],
  }),
  component: InternDashboard,
});
