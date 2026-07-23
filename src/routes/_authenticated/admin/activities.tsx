import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { 
  Users, UserPlus, ShieldAlert, Sparkles, Calendar, BookOpen, Clock, Send, Trophy, Bell, Settings, 
  Search, SlidersHorizontal, ArrowUpDown, Play, Download, Mail, UserCheck, Eye, Plus, Trash2
} from "lucide-react";
import { AdminLayout, PageHeader, ContentContainer } from "@/components/AdminLayout";
import { ActivityReviewBadge, ActivityDrawer } from "@/components/ActivitiesManagementUI";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/activities")({
  head: () => ({ meta: [{ title: "Activities Management & Audit — APEX AI" }] }),
  component: AdminActivitiesManagement,
});

// Seed mock activity templates
const MOCK_TEMPLATES = [
  { id: "t1", number: 1, title: "Onboarding Dossier Setup", problemStatement: "Core Systems", dueDays: 3, status: "Active" },
  { id: "t2", number: 2, title: "PyTorch Basics & Neural Blocks", problemStatement: "LLM Finetuning Engine", dueDays: 5, status: "Active" },
  { id: "t3", number: 3, title: "Vector Embeddings Schema Sync", problemStatement: "AI Vector Database Sync", dueDays: 7, status: "Active" }
];

// Seed mock student submissions
const MOCK_SUBMISSIONS = [
  { id: "s1", name: "Amar Singh", college: "IIT Bombay", problemStatement: "LLM Finetuning Engine", completedCount: 6, currentActivity: "Activity 7 Review", date: "2026-07-22", status: "Pending Review", reviewer: "Dr. Hemlata" },
  { id: "s2", name: "Bhavna Patel", college: "BITS Pilani", problemStatement: "AI Vector Database Sync", completedCount: 7, currentActivity: "Milestone Completed", date: "2026-07-21", status: "Approved", reviewer: "Amit Kumar" },
  { id: "s3", name: "Chirag Sharma", college: "VIT Vellore", problemStatement: "Serverless GPU Orchestrator", completedCount: 3, currentActivity: "Activity 4 Checkin", date: "2026-07-20", status: "Resubmission Required", reviewer: "Prof. Satish" }
];

function AdminActivitiesManagement() {
  const [activeTab, setActiveTab] = useState<"templates" | "submissions">("templates");
  const [templates, setTemplates] = useState(MOCK_TEMPLATES);
  const [submissions, setSubmissions] = useState(MOCK_SUBMISSIONS);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  // Search/Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredSubmissions = useMemo(() => {
    return submissions.filter(s => {
      const matchesSearch = 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.college.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.problemStatement.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || s.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [submissions, searchQuery, statusFilter]);

  const handleApprove = (id: string, notes: string) => {
    setSubmissions(prev => prev.map(s => {
      if (s.id === id) {
        return { ...s, status: "Approved", currentActivity: "Milestone Completed", completedCount: 7 };
      }
      return s;
    }));
    toast.success(`Submission approved. Notes logged: ${notes || "None"}`);
    setSelectedStudent(null);
  };

  const handleReject = (id: string, notes: string) => {
    setSubmissions(prev => prev.map(s => {
      if (s.id === id) {
        return { ...s, status: "Resubmission Required" };
      }
      return s;
    }));
    toast.error(`Resubmission requested. Notes logged: ${notes || "None"}`);
    setSelectedStudent(null);
  };

  const handleSkipReview = (id: string) => {
    setSubmissions(prev => prev.map(s => {
      if (s.id === id) {
        return { ...s, status: "Skipped", currentActivity: "Interview Scheduled", completedCount: 7 };
      }
      return s;
    }));
    toast.success("Milestone review skipped. Intern promoted directly to Interview Scheduling!");
    setSelectedStudent(null);
  };

  const handleCreateActivity = () => {
    const newNum = templates.length + 1;
    const newT = {
      id: `t-${Date.now()}`,
      number: newNum,
      title: `New Curriculum Activity ${newNum}`,
      problemStatement: "Advanced AI",
      dueDays: 5,
      status: "Active"
    };
    setTemplates(prev => [...prev, newT]);
    toast.success("New Activity Template added successfully!");
  };

  return (
    <AdminLayout>
      <PageHeader 
        title="Activities Management" 
        description="Configure cohort activity milestone requirements templates and review submitted student dossiers."
        path="/admin/activities"
      />

      {/* Internal Navigation Header Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button 
          onClick={() => setActiveTab("templates")}
          className={`px-6 py-3 text-xs font-black capitalize transition-all border-b-2 -mb-px ${
            activeTab === "templates" ? "border-[#FF7A00] text-[#FF7A00]" : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          Activity Templates ({templates.length})
        </button>
        <button 
          onClick={() => setActiveTab("submissions")}
          className={`px-6 py-3 text-xs font-black capitalize transition-all border-b-2 -mb-px ${
            activeTab === "submissions" ? "border-[#FF7A00] text-[#FF7A00]" : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          Student Submissions ({submissions.length})
        </button>
      </div>

      {activeTab === "templates" && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button 
              onClick={handleCreateActivity}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#FF7A00] hover:bg-orange-600 rounded-xl text-xs font-black text-white shadow-sm transition-all"
            >
              <Plus className="size-4" /> Create Activity Template
            </button>
          </div>

          <ContentContainer>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4 w-16">No.</th>
                    <th className="py-3 px-4">Title</th>
                    <th className="py-3 px-4">Problem Statement Area</th>
                    <th className="py-3 px-4">Due Days</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {templates.map((temp) => (
                    <tr key={temp.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-black text-gray-900">Act {temp.number}</td>
                      <td className="py-3.5 px-4 font-bold text-gray-800">{temp.title}</td>
                      <td className="py-3.5 px-4 font-semibold text-gray-650">{temp.problemStatement}</td>
                      <td className="py-3.5 px-4 text-gray-500 font-medium">{temp.dueDays} Days</td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex px-2.5 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full text-[9px] font-black uppercase tracking-wider">
                          {temp.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button className="px-3 py-1.5 bg-gray-50 hover:bg-orange-50 hover:text-[#FF7A00] rounded-xl text-[10px] font-bold text-gray-600 border border-transparent hover:border-orange-100 transition-all">
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ContentContainer>
        </div>
      )}

      {activeTab === "submissions" && (
        <div className="space-y-6">
          {/* Toolbar Search Filters */}
          <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-1 items-center gap-3 bg-gray-50 border border-gray-200 px-3.5 py-1.5 rounded-full max-w-md w-full">
              <Search className="size-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search by student name, college, problem statement..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-xs w-full focus:outline-none placeholder-gray-450 text-gray-800 font-semibold"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-gray-50 border border-gray-250 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none"
              >
                <option value="all">All Status</option>
                <option value="Pending Review">Pending Review</option>
                <option value="Approved">Approved</option>
                <option value="Resubmission Required">Resubmission Required</option>
              </select>
            </div>
          </div>

          <ContentContainer>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Problem Statement</th>
                    <th className="py-3 px-4 text-center">Completed</th>
                    <th className="py-3 px-4">Current Milestone</th>
                    <th className="py-3 px-4">Upload Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredSubmissions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-black text-gray-900">{sub.name}</div>
                        <div className="text-[10px] text-gray-400 font-medium">{sub.college}</div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-gray-750">{sub.problemStatement}</td>
                      <td className="py-3.5 px-4 text-center font-bold text-gray-800">{sub.completedCount} / 7</td>
                      <td className="py-3.5 px-4 font-medium text-gray-700">{sub.currentActivity}</td>
                      <td className="py-3.5 px-4 text-gray-500 font-medium">{sub.date}</td>
                      <td className="py-3.5 px-4">
                        <ActivityReviewBadge status={sub.status} />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button 
                          onClick={() => setSelectedStudent(sub)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-50 hover:bg-orange-50 hover:text-[#FF7A00] rounded-xl text-[10px] font-bold text-gray-600 border border-transparent hover:border-orange-100 transition-all"
                        >
                          <Eye className="size-3.5" /> Audit Dossier
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ContentContainer>
        </div>
      )}

      {/* Activities Review Details Drawer */}
      <ActivityDrawer 
        student={selectedStudent}
        onClose={() => setSelectedStudent(null)}
        onApprove={(id, notes) => handleApprove(id, notes)}
        onReject={(id, notes) => handleReject(id, notes)}
        onSkipReview={(id) => handleSkipReview(id)}
      />
    </AdminLayout>
  );
}
