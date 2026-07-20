import { createFileRoute } from "@tanstack/react-router";
import { InternDashboard } from "@/components/InternDashboard";

export const Route = createFileRoute("/_authenticated/")({
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
