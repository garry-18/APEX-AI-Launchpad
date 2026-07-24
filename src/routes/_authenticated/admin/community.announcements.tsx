import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { 
  Plus, Trash2, ArrowRight, Share2, Sparkles, Copy, FileText, Check, Send, AlertCircle
} from "lucide-react";
import { AdminLayout, PageHeader, ContentContainer } from "@/components/AdminLayout";
import { AnnouncementModal } from "@/components/CommunityUI";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/community/announcements")({
  head: () => ({ meta: [{ title: "Cohort Announcements Broadcast — APEX AI" }] }),
  component: AdminAnnouncements,
});

// Seed mock announcements
const MOCK_ANNOUNCEMENTS = [
  { id: "1", title: "Milestone 7 Dossier Submissions Deadline Extended", desc: "Please upload your source code zip packages to drive folder before July 25th 05:00 PM.", category: "Activities", priority: "High", date: "2026-07-22" },
  { id: "2", name: "1-on-1 Technical Screening Alignment calls", desc: "Interview schedules have been released for selected candidates. Keep your calendars cleared.", category: "Interview", priority: "Medium", date: "2026-07-20" }
];

function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState<any[]>(MOCK_ANNOUNCEMENTS);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleCreateAnnouncement = (data: any) => {
    const newAnn = {
      id: `ann-${Date.now()}`,
      title: data.title,
      desc: data.desc,
      category: data.category,
      priority: data.priority,
      date: data.date
    };
    setAnnouncements(prev => [newAnn, ...prev]);
    toast.success("Broadcast Announcement published successfully!");
    setShowCreateModal(false);
  };

  const handleDelete = (id: string) => {
    setAnnouncements(prev => prev.filter(a => a.id !== id));
    toast.error("Announcement deleted!");
  };

  return (
    <AdminLayout>
      <PageHeader 
        title="Announcements Broadcast Board" 
        description="Broadcast daily news, notices, and system alerts to active cohort students."
        path="/admin/community/announcements"
      />

      <div className="space-y-6">
        <div className="flex justify-end">
          <button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#FF7A00] hover:bg-orange-600 rounded-xl text-xs font-black text-white shadow-sm transition-all"
          >
            <Plus className="size-4" /> Add Announcement
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {announcements.map((ann) => (
            <div key={ann.id} className="bg-white border border-gray-150 rounded-3xl p-5 shadow-sm space-y-4 flex flex-col justify-between hover:shadow-md transition-all duration-300">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border ${
                    ann.priority === "High" ? "bg-red-50 text-red-600 border-red-100 animate-pulse" : "bg-gray-100 text-gray-650"
                  }`}>
                    {ann.priority} Priority
                  </span>
                  <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">{ann.date}</span>
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-gray-900 leading-snug">{ann.title}</h4>
                  <p className="text-[10px] text-gray-550 leading-normal">{ann.desc}</p>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-3 flex justify-between items-center text-[10px] font-bold">
                <span className="text-gray-400">Category: {ann.category}</span>
                <button 
                  onClick={() => handleDelete(ann.id)}
                  className="text-red-500 hover:text-red-700 font-black flex items-center gap-1"
                >
                  <Trash2 className="size-3.5" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showCreateModal && (
        <AnnouncementModal 
          onClose={() => setShowCreateModal(false)} 
          onCreate={(data) => handleCreateAnnouncement(data)} 
        />
      )}
    </AdminLayout>
  );
}
