import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout, PageHeader, ContentContainer } from "@/components/AdminLayout";

export const Route = createFileRoute("/_authenticated/super-admin/settings")({
  head: () => ({ meta: [{ title: "Super Settings — APEX AI" }] }),
  component: () => (
    <AdminLayout>
      <PageHeader 
        title="Super Admin Settings & Profile" 
        description="Configure super admin profile, update email preferences, and settings."
        path="/super-admin/settings"
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
