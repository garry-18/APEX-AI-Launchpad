import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout, PageHeader, ContentContainer } from "@/components/AdminLayout";

export const Route = createFileRoute("/_authenticated/super-admin/problem-statements")({
  head: () => ({ meta: [{ title: "Problem Statements Management — APEX AI" }] }),
  component: () => (
    <AdminLayout>
      <PageHeader 
        title="Problem Statements Management" 
        description="Add, modify, and delete curriculum problem statement categories for cohort interns."
        path="/super-admin/problem-statements"
      />
      <ContentContainer>
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Problem Statements Overview</h2>
          <p className="text-xs text-gray-500 leading-relaxed">
            This page will display dashboard analytics tracking registered topics.
          </p>
        </div>
      </ContentContainer>
    </AdminLayout>
  ),
});
