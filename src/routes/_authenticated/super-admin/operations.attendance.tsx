import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { 
  Users, UserPlus, ShieldAlert, Sparkles, Calendar, BookOpen, Clock, Send, Trophy, Bell, Settings, 
  Search, SlidersHorizontal, ArrowUpDown, Play, Download, Mail, UserCheck, Eye, Terminal, Star, Clock4
} from "lucide-react";
import { AdminLayout, PageHeader, ContentContainer } from "@/components/AdminLayout";
import { AttendanceStateBadge, LeaveStatusBadge } from "@/components/AttendanceManagementUI";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/super-admin/operations/attendance")({
  head: () => ({ meta: [{ title: "Super Admin Attendance & Leave Management — APEX AI" }] }),
  component: SuperAdminAttendanceManagement,
});

// Seed mock attendance list data
const MOCK_ATTENDANCE = [
  { id: "1", name: "Amar Singh", college: "IIT Bombay", problemStatement: "LLM Finetuning Engine", checkIn: "09:00 AM", checkOut: "05:00 PM", hours: 8, status: "Present" },
  { id: "2", name: "Bhavna Patel", college: "BITS Pilani", problemStatement: "AI Vector Database Sync", checkIn: "09:45 AM", checkOut: "05:00 PM", hours: 7.25, status: "Late" },
  { id: "3", name: "Chirag Sharma", college: "VIT Vellore", problemStatement: "Serverless GPU Orchestrator", checkIn: "--", checkOut: "--", hours: 0, status: "Absent" }
];

// Seed mock leave requests data
const MOCK_LEAVES = [
  { id: "l1", name: "Divya Rao", type: "Sick Leave", duration: "2 Days", reason: "Viral Fever", appliedDate: "2026-07-22", status: "Pending" }
];

function SuperAdminAttendanceManagement() {
  const [activeTab, setActiveTab] = useState<"logs" | "leaves">("logs");
  const [attendance, setAttendance] = useState(MOCK_ATTENDANCE);
  const [leaves, setLeaves] = useState(MOCK_LEAVES);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredAttendance = useMemo(() => {
    return attendance.filter(a => {
      const matchesSearch = 
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.college.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.problemStatement.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || a.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [attendance, searchQuery, statusFilter]);

  const handleApproveLeave = (id: string) => {
    setLeaves(prev => prev.map(l => l.id === id ? { ...l, status: "Approved" } : l));
    toast.success("Leave request approved successfully!");
  };

  const handleRejectLeave = (id: string) => {
    setLeaves(prev => prev.map(l => l.id === id ? { ...l, status: "Rejected" } : l));
    toast.error("Leave request rejected!");
  };

  return (
    <AdminLayout>
      <PageHeader 
        title="Super Admin Attendance & Leave Logs" 
        description="Monitor daily intern shift logins checkins, active learning hours, and approve leave requests."
        path="/super-admin/operations/attendance"
      />

      {/* Internal Navigation Header Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button 
          onClick={() => setActiveTab("logs")}
          className={`px-6 py-3 text-xs font-black capitalize transition-all border-b-2 -mb-px ${
            activeTab === "logs" ? "border-[#FF7A00] text-[#FF7A00]" : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          Daily Logs ({attendance.length})
        </button>
        <button 
          onClick={() => setActiveTab("leaves")}
          className={`px-6 py-3 text-xs font-black capitalize transition-all border-b-2 -mb-px ${
            activeTab === "leaves" ? "border-[#FF7A00] text-[#FF7A00]" : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          Leave Requests ({leaves.filter(l => l.status === "Pending").length})
        </button>
      </div>

      {activeTab === "logs" && (
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
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
                <option value="Late">Late</option>
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
                    <th className="py-3 px-4 text-center">Check In</th>
                    <th className="py-3 px-4 text-center">Check Out</th>
                    <th className="py-3 px-4 text-center">Working Hours</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredAttendance.map((sub) => (
                    <tr key={sub.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-black text-gray-900">{sub.name}</div>
                        <div className="text-[10px] text-gray-400 font-medium">{sub.college}</div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-gray-755">{sub.problemStatement}</td>
                      <td className="py-3.5 px-4 text-center font-bold text-gray-800">{sub.checkIn}</td>
                      <td className="py-3.5 px-4 text-center font-bold text-gray-800">{sub.checkOut}</td>
                      <td className="py-3.5 px-4 text-center font-extrabold text-gray-900">{sub.hours} Hrs</td>
                      <td className="py-3.5 px-4">
                        <AttendanceStateBadge status={sub.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ContentContainer>
        </div>
      )}

      {activeTab === "leaves" && (
        <div className="space-y-6">
          <ContentContainer>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Duration</th>
                    <th className="py-3 px-4">Reason</th>
                    <th className="py-3 px-4">Applied Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {leaves.map((l) => (
                    <tr key={l.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-black text-gray-900">{l.name}</td>
                      <td className="py-3.5 px-4 font-bold text-[#FF7A00]">{l.type}</td>
                      <td className="py-3.5 px-4 font-semibold text-gray-800">{l.duration}</td>
                      <td className="py-3.5 px-4 text-gray-655 font-medium">{l.reason}</td>
                      <td className="py-3.5 px-4 text-gray-500 font-medium">{l.appliedDate}</td>
                      <td className="py-3.5 px-4">
                        <LeaveStatusBadge status={l.status} />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {l.status === "Pending" && (
                          <div className="flex justify-end gap-1.5">
                            <button 
                              onClick={() => handleRejectLeave(l.id)}
                              className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl"
                            >
                              Reject
                            </button>
                            <button 
                              onClick={() => handleApproveLeave(l.id)}
                              className="px-2.5 py-1.5 bg-[#FF7A00] hover:bg-orange-600 text-white font-black rounded-xl shadow-sm"
                            >
                              Approve
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ContentContainer>
        </div>
      )}
    </AdminLayout>
  );
}
