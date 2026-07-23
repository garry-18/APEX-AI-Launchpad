import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout, PageHeader, ContentContainer } from "@/components/AdminLayout";

export const Route = createFileRoute("/_authenticated/super-admin/announcements")({
  head: () => ({ meta: [{ title: "Super Announcements Panel — APEX AI" }] }),
  component: () => (
    <AdminLayout>
      <PageHeader 
        title="Super Admin Announcements Panel" 
        description="Publish announcements to student dashboards, update schedules, and release info."
        path="/super-admin/announcements"
      />
      <ContentContainer>
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Announcements Overview</h2>
          <p className="text-xs text-gray-500 leading-relaxed">
            This page will display dashboard analytics tracking updates.
          </p>
        </div>
      </ContentContainer>
    </AdminLayout>
  ),
});
