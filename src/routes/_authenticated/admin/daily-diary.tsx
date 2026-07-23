import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout, PageHeader, ContentContainer } from "@/components/AdminLayout";

export const Route = createFileRoute("/_authenticated/admin/daily-diary")({
  head: () => ({ meta: [{ title: "Daily Diary Logs — APEX AI" }] }),
  component: () => (
    <AdminLayout>
      <PageHeader 
        title="Daily Work Diary Logs" 
        description="Verify daily intern updates, problem-solving progress statements, and supervisor remarks."
        path="/admin/daily-diary"
      />
      <ContentContainer>
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Work Logs</h2>
          <p className="text-xs text-gray-500 leading-relaxed">
            This page will display dashboard analytics for daily diary submissions.
          </p>
        </div>
      </ContentContainer>
    </AdminLayout>
  ),
});
