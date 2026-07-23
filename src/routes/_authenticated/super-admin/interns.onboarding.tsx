import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { 
  Users, UserPlus, ShieldAlert, Sparkles, Calendar, BookOpen, Clock, Send, Trophy, Bell, Settings, 
  Search, SlidersHorizontal, ArrowUpDown, Play, Download, Mail, UserCheck, Eye, AlertTriangle
} from "lucide-react";
import { AdminLayout, PageHeader, ContentContainer } from "@/components/AdminLayout";
import { StatusBadge, ProgressCircle, InternDrawer } from "@/components/InternManagementUI";
import { dataStore } from "@/lib/data-store";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/super-admin/interns/onboarding")({
  head: () => ({ meta: [{ title: "Super Admin Onboarding Management — APEX AI" }] }),
  component: SuperAdminOnboardingInterns,
});

// Seed mock records matching columns
const MOCK_INTERNS = [
  { id: "1", name: "Amar Singh", email: "amar@gmail.com", college: "IIT Bombay", branch: "Computer Science", phase: "Activities Submitted", progress: 57, status: "Activities Submitted", registeredDate: "2026-07-20" },
  { id: "2", name: "Bhavna Patel", email: "bhavna@gmail.com", college: "BITS Pilani", branch: "Information Technology", phase: "LMS Completed", progress: 42, status: "LMS Completed", registeredDate: "2026-07-19" },
  { id: "3", name: "Chirag Sharma", email: "chirag@gmail.com", college: "VIT Vellore", branch: "Electronics Engineering", phase: "Questionnaire Completed", progress: 28, status: "Questionnaire Completed", registeredDate: "2026-07-18" },
  { id: "4", name: "Divya Rao", email: "divya@gmail.com", college: "IIT Madras", branch: "Data Science", phase: "Profile Completed", progress: 14, status: "Profile Completed", registeredDate: "2026-07-17" },
  { id: "5", name: "Eshwar Kumar", email: "eshwar@gmail.com", college: "DTU Delhi", branch: "Software Engineering", phase: "Waiting Review", progress: 71, status: "Waiting Review", registeredDate: "2026-07-16" }
];

function SuperAdminOnboardingInterns() {
  const [interns, setInterns] = useState(MOCK_INTERNS);
  const [selectedIntern, setSelectedIntern] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [phaseFilter, setPhaseFilter] = useState("all");
  
  // Selection for bulk actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);
  const [skipTargetId, setSkipTargetId] = useState<string | null>(null);

  const filteredInterns = useMemo(() => {
    return interns.filter(i => {
      const matchesSearch = 
        i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.college.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesPhase = phaseFilter === "all" || i.phase === phaseFilter;
      return matchesSearch && matchesPhase;
    });
  }, [interns, searchQuery, phaseFilter]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredInterns.map(i => i.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(item => item !== id));
    }
  };

  const handleSkipRequest = (id: string) => {
    setSkipTargetId(id);
    setShowSkipConfirm(true);
  };

  const confirmSkipReview = () => {
    if (!skipTargetId) return;
    setInterns(prev => prev.map(intern => {
      if (intern.id === skipTargetId) {
        return {
          ...intern,
          status: "Review Skipped",
          phase: "Interview Scheduled",
          progress: 85
        };
      }
      return intern;
    }));
    toast.success("Activity review skipped successfully. Intern promoted to Interview Scheduling!");
    setShowSkipConfirm(false);
    setSkipTargetId(null);
    setSelectedIntern(null);
  };

  const handleScheduleInterview = (id: string) => {
    setInterns(prev => prev.map(intern => {
      if (intern.id === id) {
        return {
          ...intern,
          status: "Interview Scheduled",
          phase: "Interview Scheduled",
          progress: 85
        };
      }
      return intern;
    }));
    toast.success("Interview scheduled successfully!");
    setSelectedIntern(null);
  };

  const handleBulkExport = () => {
    toast.success(`Exporting ${selectedIds.length || filteredInterns.length} interns records to CSV...`);
  };

  return (
    <AdminLayout>
      <PageHeader 
        title="Super Admin Intern Onboarding" 
        description="Monitor, audit, and coordinate onboarding steps completion metrics for registered interns."
        path="/super-admin/interns/onboarding"
      />

      {/* Onboarding Summary Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-2">
        <button onClick={() => setPhaseFilter("all")} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-left hover:-translate-y-0.5 transition-all">
          <span className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Total Onboarding</span>
          <span className="text-xl font-black text-gray-900">{interns.length}</span>
        </button>
        <button onClick={() => setPhaseFilter("Profile Completed")} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-left hover:-translate-y-0.5 transition-all">
          <span className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Profile Pending</span>
          <span className="text-xl font-black text-gray-900">{interns.filter(i => i.progress === 14).length}</span>
        </button>
        <button onClick={() => setPhaseFilter("Activities Submitted")} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-left hover:-translate-y-0.5 transition-all">
          <span className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Activities Submitted</span>
          <span className="text-xl font-black text-[#FF7A00]">{interns.filter(i => i.status === "Activities Submitted").length}</span>
        </button>
        <button onClick={() => setPhaseFilter("Waiting Review")} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-left hover:-translate-y-0.5 transition-all">
          <span className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Awaiting Review</span>
          <span className="text-xl font-black text-red-500">{interns.filter(i => i.status === "Waiting Review").length}</span>
        </button>
      </div>

      {/* Toolbar / Search Filters */}
      <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3 bg-gray-50 border border-gray-200 px-3.5 py-1.5 rounded-full max-w-md w-full">
          <Search className="size-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by name, email, college..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-xs w-full focus:outline-none placeholder-gray-450 text-gray-800 font-semibold"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select 
            value={phaseFilter}
            onChange={(e) => setPhaseFilter(e.target.value)}
            className="bg-gray-50 border border-gray-250 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none"
          >
            <option value="all">All Phases</option>
            <option value="Profile Completed">Profile Completed</option>
            <option value="LMS Completed">LMS Completed</option>
            <option value="Activities Submitted">Activities Submitted</option>
            <option value="Waiting Review">Waiting Review</option>
          </select>

          <button 
            onClick={handleBulkExport}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-white border border-gray-250 hover:border-gray-900 rounded-xl text-xs font-semibold text-gray-700 transition-colors"
          >
            <Download className="size-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Main Table Content */}
      <ContentContainer>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">
                  <input 
                    type="checkbox" 
                    onChange={handleSelectAll}
                    checked={selectedIds.length === filteredInterns.length && filteredInterns.length > 0}
                    className="rounded text-[#FF7A00] focus:ring-[#FF7A00] size-3.5"
                  />
                </th>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">College</th>
                <th className="py-3 px-4 text-center">Progress</th>
                <th className="py-3 px-4">Phase Status</th>
                <th className="py-3 px-4">Registered Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredInterns.map((intern) => (
                <tr key={intern.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-3.5 px-4">
                    <input 
                      type="checkbox" 
                      checked={selectedIds.includes(intern.id)}
                      onChange={(e) => handleSelectOne(intern.id, e.target.checked)}
                      className="rounded text-[#FF7A00] focus:ring-[#FF7A00] size-3.5"
                    />
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-black text-gray-900">{intern.name}</div>
                    <div className="text-[10px] text-gray-400 font-medium">{intern.email}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-gray-800">{intern.college}</div>
                    <div className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">{intern.branch}</div>
                  </td>
                  <td className="py-3.5 px-4 flex justify-center">
                    <ProgressCircle pct={intern.progress} size={36} />
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={intern.status} />
                  </td>
                  <td className="py-3.5 px-4 text-gray-500 font-medium">
                    {intern.registeredDate}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button 
                      onClick={() => setSelectedIntern(intern)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-50 hover:bg-orange-50 hover:text-[#FF7A00] rounded-xl text-[10px] font-bold text-gray-600 border border-transparent hover:border-orange-100 transition-all"
                    >
                      <Eye className="size-3.5" /> View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ContentContainer>

      {/* Intern Details Drawer */}
      <InternDrawer 
        intern={selectedIntern}
        onClose={() => setSelectedIntern(null)}
        onSkipReview={(id) => handleSkipRequest(id)}
        onScheduleInterview={(id) => handleScheduleInterview(id)}
      />

      {/* Skip Confirmation Dialog Box */}
      {showSkipConfirm && (
        <div className="fixed inset-0 bg-black/40 z-[60] grid place-items-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-gray-100 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex gap-3">
              <div className="size-10 rounded-xl bg-orange-50 text-[#FF7A00] flex items-center justify-center shrink-0">
                <AlertTriangle className="size-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-black text-gray-900">Skip Activity Review?</h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Skip activity review and allow this intern to proceed directly to interview scheduling?
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button 
                onClick={() => setShowSkipConfirm(false)}
                className="px-4 py-2 bg-white border border-gray-250 hover:border-gray-900 rounded-xl text-xs font-black text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmSkipReview}
                className="px-4 py-2 bg-[#FF7A00] hover:bg-orange-600 rounded-xl text-xs font-black text-white shadow-sm transition-all"
              >
                Skip Review
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
