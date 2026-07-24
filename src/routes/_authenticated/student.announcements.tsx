import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { 
  Plus, Trash2, ArrowRight, Share2, Sparkles, Copy, FileText, Check, Send, AlertCircle
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/student/announcements")({
  head: () => ({ meta: [{ title: "Cohort Announcements — APEX AI" }] }),
  component: StudentAnnouncementsView,
});

const MOCK_ANNOUNCEMENTS = [
  { id: "1", title: "Milestone 7 Dossier Submissions Deadline Extended", desc: "Please upload your source code zip packages to drive folder before July 25th 05:00 PM.", category: "Activities", priority: "High", date: "2026-07-22", isRead: false },
  { id: "2", title: "1-on-1 Technical Screening Alignment calls", desc: "Interview schedules have been released for selected candidates. Keep your calendars cleared.", category: "Interview", priority: "Medium", date: "2026-07-20", isRead: true }
];

function StudentAnnouncementsView() {
  const [announcements, setAnnouncements] = useState(MOCK_ANNOUNCEMENTS);

  const handleMarkAsRead = (id: string) => {
    setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, isRead: true } : a));
    toast.success("Notice marked as read!");
  };

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="space-y-1">
          <h2 className="text-xl font-black text-gray-900">Announcements Broadcast Board</h2>
          <p className="text-xs text-gray-500">Stay updated with official announcements and event dates.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {announcements.map((ann) => (
            <div 
              key={ann.id} 
              className={`bg-white border rounded-3xl p-5 shadow-sm space-y-4 flex flex-col justify-between hover:shadow-md transition-all duration-300 ${
                !ann.isRead ? "border-l-4 border-l-[#FF7A00] border-gray-150" : "border-gray-150"
              }`}
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border ${
                    ann.priority === "High" ? "bg-red-50 text-red-600 border-red-100 animate-pulse" : "bg-gray-100 text-gray-655"
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
                <span className="text-gray-450">Category: {ann.category}</span>
                {!ann.isRead ? (
                  <button 
                    onClick={() => handleMarkAsRead(ann.id)}
                    className="text-[#FF7A00] hover:underline font-black"
                  >
                    Mark as Read
                  </button>
                ) : (
                  <span className="text-emerald-600 font-bold">Read</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
