import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout, PageHeader, ContentContainer } from "@/components/AdminLayout";

export const Route = createFileRoute("/_authenticated/super-admin/pending-work")({
  head: () => ({ meta: [{ title: "Super Pending Work — APEX AI" }] }),
  component: () => (
    <AdminLayout>
      <PageHeader 
        title="Super Admin Pending Verifications Queue" 
        description="Verify remaining submissions awaiting evaluation or resubmission updates."
        path="/super-admin/pending-work"
      />
      <ContentContainer>
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Pending Actions</h2>
          <p className="text-xs text-gray-500 leading-relaxed">
            This page will display dashboard analytics tracking items in the evaluation queue.
          </p>
        </div>
      </ContentContainer>
    </AdminLayout>
  ),
});
