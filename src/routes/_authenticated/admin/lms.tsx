import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { 
  Users, UserPlus, ShieldAlert, Sparkles, Calendar, BookOpen, Clock, Send, Trophy, Bell, Settings, 
  Search, SlidersHorizontal, ArrowUpDown, Play, Download, Mail, UserCheck, Eye
} from "lucide-react";
import { AdminLayout, PageHeader, ContentContainer } from "@/components/AdminLayout";
import { LMSStatusBadge, LMSDrawer } from "@/components/LMSMonitoringUI";
import { ProgressCircle } from "@/components/InternManagementUI";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/lms")({
  head: () => ({ meta: [{ title: "LMS Learning Analytics — APEX AI" }] }),
  component: AdminLMSMonitoring,
});

// Seed mock records for LMS course tracking
const MOCK_LMS_STUDENTS = [
  { id: "1", name: "Amar Singh", college: "IIT Bombay", course: "Advanced PyTorch Pipeline Engineering", progress: 68, learningHours: 34, lastActivity: "2 hours ago", status: "In Progress" },
  { id: "2", name: "Bhavna Patel", college: "BITS Pilani", course: "Transformer Architecture & LLM Finetuning", progress: 100, learningHours: 48, lastActivity: "1 day ago", status: "Certificate Earned" },
  { id: "3", name: "Chirag Sharma", college: "VIT Vellore", course: "Vector Databases & Semantic Embeddings Integration", progress: 40, learningHours: 18, lastActivity: "Just now", status: "In Progress" },
  { id: "4", name: "Divya Rao", college: "IIT Madras", course: "Transformer Architecture & LLM Finetuning", progress: 12, learningHours: 6, lastActivity: "3 days ago", status: "Not Started" }
];

function AdminLMSMonitoring() {
  const [students, setStudents] = useState(MOCK_LMS_STUDENTS);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchesSearch = 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.college.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.course.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || s.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [students, searchQuery, statusFilter]);

  const handleSendReminder = (type: string) => {
    toast.success(`Reminder "${type}" sent to ${selectedStudent?.name} successfully!`);
    setSelectedStudent(null);
  };

  return (
    <AdminLayout>
      <PageHeader 
        title="LMS Monitoring" 
        description="Verify syllabus progression percentage, average session login hours, and milestone certificate awards."
        path="/admin/lms"
      />

      {/* LMS Summary Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-2">
        <button onClick={() => setStatusFilter("all")} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-left hover:-translate-y-0.5 transition-all">
          <span className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Total Learners</span>
          <span className="text-xl font-black text-gray-900">{students.length}</span>
        </button>
        <button onClick={() => setStatusFilter("In Progress")} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-left hover:-translate-y-0.5 transition-all">
          <span className="text-[9px] font-bold text-gray-400 uppercase block mb-1">In Progress</span>
          <span className="text-xl font-black text-blue-600">{students.filter(s => s.status === "In Progress").length}</span>
        </button>
        <button onClick={() => setStatusFilter("Certificate Earned")} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-left hover:-translate-y-0.5 transition-all">
          <span className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Certificates Earned</span>
          <span className="text-xl font-black text-emerald-600">{students.filter(s => s.status === "Certificate Earned").length}</span>
        </button>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-left">
          <span className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Avg. Completion Rate</span>
          <span className="text-xl font-black text-[#FF7A00]">55%</span>
        </div>
      </div>

      {/* Toolbar / Search Filters */}
      <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3 bg-gray-50 border border-gray-200 px-3.5 py-1.5 rounded-full max-w-md w-full">
          <Search className="size-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by student name, college, course..." 
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
            <option value="In Progress">In Progress</option>
            <option value="Certificate Earned">Certificate Earned</option>
            <option value="Not Started">Not Started</option>
          </select>
        </div>
      </div>

      {/* Main Table Content */}
      <ContentContainer>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">College</th>
                <th className="py-3 px-4">Assigned Course</th>
                <th className="py-3 px-4 text-center">Progress</th>
                <th className="py-3 px-4 text-center">Hours Spent</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredStudents.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-3.5 px-4 font-black text-gray-900">{s.name}</td>
                  <td className="py-3.5 px-4 font-semibold text-gray-850">{s.college}</td>
                  <td className="py-3.5 px-4 font-bold text-gray-800">{s.course}</td>
                  <td className="py-3.5 px-4 flex justify-center">
                    <ProgressCircle pct={s.progress} size={36} />
                  </td>
                  <td className="py-3.5 px-4 text-center font-extrabold text-gray-900">{s.learningHours} Hrs</td>
                  <td className="py-3.5 px-4">
                    <LMSStatusBadge status={s.status} />
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button 
                      onClick={() => setSelectedStudent(s)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-50 hover:bg-orange-50 hover:text-[#FF7A00] rounded-xl text-[10px] font-bold text-gray-600 border border-transparent hover:border-orange-100 transition-all"
                    >
                      <Eye className="size-3.5" /> View Progress
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ContentContainer>

      {/* LMS Progress details drawer */}
      <LMSDrawer 
        student={selectedStudent} 
        onClose={() => setSelectedStudent(null)} 
        onSendReminder={(type) => handleSendReminder(type)} 
      />
    </AdminLayout>
  );
}
