import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { 
  Users, UserPlus, ShieldAlert, Sparkles, Calendar, BookOpen, Clock, Send, Trophy, Bell, Settings, 
  Search, SlidersHorizontal, ArrowUpDown, Play, Download, Mail, UserCheck, Eye, Terminal, Star
} from "lucide-react";
import { AdminLayout, PageHeader, ContentContainer } from "@/components/AdminLayout";
import { ActiveStatusBadge, ActiveInternDrawer } from "@/components/ActiveInternsManagementUI";
import { ProgressCircle } from "@/components/InternManagementUI";
import { dataStore } from "@/lib/data-store";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/super-admin/interns/active")({
  head: () => ({ meta: [{ title: "Super Admin Active Interns Management — APEX AI" }] }),
  component: SuperAdminActiveInterns,
});

// Seed mock records for active interns
const MOCK_ACTIVE_INTERNS = [
  { id: "1", name: "Ananya Iyer", email: "ananya@gmail.com", college: "IIT Delhi", problemStatement: "LLM Finetuning Engine", mentor: "Dr. Hemlata", performanceScore: 94, attendance: 98, status: "Working", joinedDate: "2026-06-01" },
  { id: "2", name: "Baldev Singh", email: "baldev@gmail.com", college: "IIT Kharagpur", problemStatement: "AI Vector Database Sync", mentor: "Prof. Satish", performanceScore: 88, attendance: 95, status: "Working", joinedDate: "2026-06-05" },
  { id: "3", name: "Chetan Bhagat", email: "chetan@gmail.com", college: "BITS Pilani", problemStatement: "Serverless GPU Orchestrator", mentor: "Amit Kumar", performanceScore: 82, attendance: 91, status: "Available", joinedDate: "2026-06-10" },
  { id: "4", name: "Deepa Nair", email: "deepa@gmail.com", college: "VIT Vellore", problemStatement: "LLM Finetuning Engine", mentor: "Dr. Hemlata", performanceScore: 96, attendance: 100, status: "Working", joinedDate: "2026-06-02" },
  { id: "5", name: "Eknath Shinde", email: "eknath@gmail.com", college: "COEP Pune", problemStatement: "AI Vector Database Sync", mentor: "Prof. Satish", performanceScore: 78, attendance: 85, status: "On Leave", joinedDate: "2026-06-12" }
];

function SuperAdminActiveInterns() {
  const [interns, setInterns] = useState(MOCK_ACTIVE_INTERNS);
  const [selectedIntern, setSelectedIntern] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Selection for bulk actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const filteredInterns = useMemo(() => {
    return interns.filter(i => {
      const matchesSearch = 
        i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.college.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (i.problemStatement && i.problemStatement.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesStatus = statusFilter === "all" || i.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [interns, searchQuery, statusFilter]);

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

  const handleAssignProject = (id: string, projectData: any) => {
    setInterns(prev => prev.map(intern => {
      if (intern.id === id) {
        return {
          ...intern,
          problemStatement: projectData.problemStatement,
          mentor: projectData.mentor,
          status: "Working"
        };
      }
      return intern;
    }));
    toast.success("Project and Mentor assignment updated successfully!");
    setSelectedIntern(null);
  };

  const handleBulkExport = () => {
    toast.success(`Exporting ${selectedIds.length || filteredInterns.length} active interns records to CSV...`);
  };

  return (
    <AdminLayout>
      <PageHeader 
        title="Super Admin Active Interns" 
        description="Monitor, evaluate, and manage active cohort interns working on curriculum projects."
        path="/super-admin/interns/active"
      />

      {/* Onboarding Summary Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-2">
        <button onClick={() => setStatusFilter("all")} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-left hover:-translate-y-0.5 transition-all">
          <span className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Total Active</span>
          <span className="text-xl font-black text-gray-900">{interns.length}</span>
        </button>
        <button onClick={() => setStatusFilter("Working")} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-left hover:-translate-y-0.5 transition-all">
          <span className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Working</span>
          <span className="text-xl font-black text-blue-600">{interns.filter(i => i.status === "Working").length}</span>
        </button>
        <button onClick={() => setStatusFilter("Available")} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-left hover:-translate-y-0.5 transition-all">
          <span className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Available</span>
          <span className="text-xl font-black text-emerald-600">{interns.filter(i => i.status === "Available").length}</span>
        </button>
        <button className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-left hover:-translate-y-0.5 transition-all">
          <span className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Top Performers</span>
          <span className="text-xl font-black text-[#FF7A00]">{interns.filter(i => i.performanceScore >= 90).length}</span>
        </button>
      </div>

      {/* Toolbar / Search Filters */}
      <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3 bg-gray-50 border border-gray-200 px-3.5 py-1.5 rounded-full max-w-md w-full">
          <Search className="size-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by name, email, college, problem statement..." 
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
            <option value="Working">Working</option>
            <option value="Available">Available</option>
            <option value="On Leave">On Leave</option>
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
                <th className="py-3 px-4">Intern Name</th>
                <th className="py-3 px-4">Problem Statement</th>
                <th className="py-3 px-4">Assigned Mentor</th>
                <th className="py-3 px-4 text-center">Performance</th>
                <th className="py-3 px-4 text-center">Attendance</th>
                <th className="py-3 px-4">Status</th>
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
                    <div className="text-[10px] text-gray-400 font-medium">{intern.college}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-gray-800">{intern.problemStatement || "Not Assigned"}</div>
                  </td>
                  <td className="py-3.5 px-4 text-gray-700 font-medium">
                    {intern.mentor || "Not Assigned"}
                  </td>
                  <td className="py-3.5 px-4 flex justify-center">
                    <ProgressCircle pct={intern.performanceScore} size={36} />
                  </td>
                  <td className="py-3.5 px-4 text-center font-extrabold text-gray-900">
                    {intern.attendance}%
                  </td>
                  <td className="py-3.5 px-4">
                    <ActiveStatusBadge status={intern.status} />
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
      <ActiveInternDrawer 
        intern={selectedIntern}
        onClose={() => setSelectedIntern(null)}
        onAssignProject={(id, projectData) => handleAssignProject(id, projectData)}
      />
    </AdminLayout>
  );
}
