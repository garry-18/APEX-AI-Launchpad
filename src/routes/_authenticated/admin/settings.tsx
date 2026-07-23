import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout, PageHeader, ContentContainer } from "@/components/AdminLayout";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  head: () => ({ meta: [{ title: "Admin Settings — APEX AI" }] }),
  component: () => (
    <AdminLayout>
      <PageHeader 
        title="Admin Settings & Profile" 
        description="Configure admin profile, update email preferences, and settings."
        path="/admin/settings"
      />
      <ContentContainer>
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Admin Options Panel</h2>
          <p className="text-xs text-gray-500 leading-relaxed">
            This page will display dashboard analytics for configuration details.
          </p>
        </div>
      </ContentContainer>
    </AdminLayout>
  ),
});
