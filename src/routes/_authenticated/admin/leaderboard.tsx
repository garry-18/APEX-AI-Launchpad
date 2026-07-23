import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout, PageHeader, ContentContainer } from "@/components/AdminLayout";

export const Route = createFileRoute("/_authenticated/admin/leaderboard")({
  head: () => ({ meta: [{ title: "Intern Leaderboard — APEX AI" }] }),
  component: () => (
    <AdminLayout>
      <PageHeader 
        title="Performance Leaderboards" 
        description="Verify highest achieving students, points details, and engagement statistics."
        path="/admin/leaderboard"
      />
      <ContentContainer>
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Leaderboard Overview</h2>
          <p className="text-xs text-gray-500 leading-relaxed">
            This page will display dashboard analytics tracking cohort top scores.
          </p>
        </div>
      </ContentContainer>
    </AdminLayout>
  ),
});
