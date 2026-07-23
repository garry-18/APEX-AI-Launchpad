import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { 
  Users, UserPlus, ShieldAlert, Sparkles, Calendar, BookOpen, Clock, Send, Trophy, Bell, Settings, 
  Search, SlidersHorizontal, ArrowUpDown, Play, Download, Mail, UserCheck, Eye, Terminal, Star, Clock4
} from "lucide-react";
import { AdminLayout, PageHeader, ContentContainer } from "@/components/AdminLayout";
import { InteractionActivityBadge, InterviewOutcomeBadge, ScheduleInterviewModal, CompleteInterviewModal } from "@/components/InteractionManagementUI";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/operations/interactions")({
  head: () => ({ meta: [{ title: "1-to-1 Interaction Management — APEX AI" }] }),
  component: AdminInteractionsManagement,
});

// Seed mock interactions list data
const MOCK_INTERACTIONS = [
  { id: "1", name: "Amar Singh", college: "IIT Bombay", problemStatement: "LLM Finetuning Engine", activityReview: "Approved", interviewStatus: "Waiting", interviewer: "Not Assigned", date: "--", time: "--", decision: "Pending" },
  { id: "2", name: "Bhavna Patel", college: "BITS Pilani", problemStatement: "AI Vector Database Sync", activityReview: "Skipped by Admin", interviewStatus: "Scheduled", interviewer: "Dr. Hemlata", date: "2026-07-24", time: "11:00 AM", decision: "Pending" },
  { id: "3", name: "Chirag Sharma", college: "VIT Vellore", problemStatement: "Serverless GPU Orchestrator", activityReview: "Approved", interviewStatus: "Completed", interviewer: "Prof. Satish", date: "2026-07-22", time: "02:30 PM", decision: "Selected" }
];

function AdminInteractionsManagement() {
  const [interactions, setInteractions] = useState(MOCK_INTERACTIONS);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  
  // Modals trigger states
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredInteractions = useMemo(() => {
    return interactions.filter(i => {
      const matchesSearch = 
        i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.college.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.problemStatement.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || i.interviewStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [interactions, searchQuery, statusFilter]);

  const handleOpenSchedule = (student: any) => {
    setSelectedStudent(student);
    setShowScheduleModal(true);
  };

  const handleConfirmSchedule = (scheduleData: any) => {
    setInteractions(prev => prev.map(item => {
      if (item.id === selectedStudent.id) {
        return {
          ...item,
          interviewStatus: "Scheduled",
          interviewer: scheduleData.interviewer,
          date: scheduleData.date,
          time: scheduleData.time
        };
      }
      return item;
    }));
    toast.success(`Interview scheduled successfully with ${scheduleData.interviewer} at ${scheduleData.time}!`);
    setShowScheduleModal(false);
    setSelectedStudent(null);
  };

  const handleOpenComplete = (student: any) => {
    setSelectedStudent(student);
    setShowCompleteModal(true);
  };

  const handleConfirmComplete = (evaluationData: any) => {
    setInteractions(prev => prev.map(item => {
      if (item.id === selectedStudent.id) {
        return {
          ...item,
          interviewStatus: "Completed",
          decision: evaluationData.decision
        };
      }
      return item;
    }));
    toast.success(`Evaluation recorded. Candidate final decision: ${evaluationData.decision}!`);
    setShowCompleteModal(false);
    setSelectedStudent(null);
  };

  const handleSkipReview = (student: any) => {
    setInteractions(prev => prev.map(item => {
      if (item.id === student.id) {
        return {
          ...item,
          activityReview: "Skipped by Admin"
        };
      }
      return item;
    }));
    toast.success("Activity review dossier marked as skipped. Ready for instant interview scheduling!");
  };

  return (
    <AdminLayout>
      <PageHeader 
        title="1-to-1 Interactions Control" 
        description="Schedule, evaluate, and manage 1-on-1 cohort enrollment screening interviews."
        path="/admin/operations/interactions"
      />

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-2">
        <button onClick={() => setStatusFilter("all")} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-left hover:-translate-y-0.5 transition-all">
          <span className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Total Interactions</span>
          <span className="text-xl font-black text-gray-900">{interactions.length}</span>
        </button>
        <button onClick={() => setStatusFilter("Scheduled")} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-left hover:-translate-y-0.5 transition-all">
          <span className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Scheduled</span>
          <span className="text-xl font-black text-cyan-600">{interactions.filter(i => i.interviewStatus === "Scheduled").length}</span>
        </button>
        <button onClick={() => setStatusFilter("Completed")} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-left hover:-translate-y-0.5 transition-all">
          <span className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Completed</span>
          <span className="text-xl font-black text-emerald-600">{interactions.filter(i => i.interviewStatus === "Completed").length}</span>
        </button>
        <button onClick={() => setStatusFilter("Waiting")} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-left hover:-translate-y-0.5 transition-all">
          <span className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Waiting Queue</span>
          <span className="text-xl font-black text-gray-450">{interactions.filter(i => i.interviewStatus === "Waiting").length}</span>
        </button>
      </div>

      {/* Toolbar / Search Filters */}
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
            <option value="all">All Outcomes</option>
            <option value="Waiting">Waiting</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Completed">Completed</option>
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
                <th className="py-3 px-4">Problem Statement</th>
                <th className="py-3 px-4">Activity Review</th>
                <th className="py-3 px-4">Interviewer</th>
                <th className="py-3 px-4">Date/Time</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Decision</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredInteractions.map((sub) => (
                <tr key={sub.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-3.5 px-4 font-black text-gray-900">
                    <div>{sub.name}</div>
                    <div className="text-[9px] text-gray-400 font-medium">{sub.college}</div>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-gray-750">{sub.problemStatement}</td>
                  <td className="py-3.5 px-4">
                    <InteractionActivityBadge status={sub.activityReview} />
                  </td>
                  <td className="py-3.5 px-4 font-medium text-gray-700">{sub.interviewer}</td>
                  <td className="py-3.5 px-4 text-gray-500 font-medium">
                    {sub.date} • {sub.time}
                  </td>
                  <td className="py-3.5 px-4">
                    <InterviewOutcomeBadge status={sub.interviewStatus} />
                  </td>
                  <td className="py-3.5 px-4 font-black text-gray-900">{sub.decision}</td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {sub.interviewStatus === "Waiting" && (
                        <>
                          <button 
                            onClick={() => handleSkipReview(sub)}
                            className="px-2.5 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg text-[9px] font-black text-gray-650"
                          >
                            Skip Review
                          </button>
                          <button 
                            onClick={() => handleOpenSchedule(sub)}
                            className="px-2.5 py-1.5 bg-[#FF7A00] hover:bg-orange-600 rounded-lg text-[9px] font-black text-white shadow-sm"
                          >
                            Schedule
                          </button>
                        </>
                      )}

                      {sub.interviewStatus === "Scheduled" && (
                        <button 
                          onClick={() => handleOpenComplete(sub)}
                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-[9px] font-black text-white"
                        >
                          Complete Interview
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ContentContainer>

      {/* Modals Injection */}
      {showScheduleModal && (
        <ScheduleInterviewModal 
          student={selectedStudent} 
          onClose={() => setShowScheduleModal(false)} 
          onSchedule={(data) => handleConfirmSchedule(data)} 
        />
      )}

      {showCompleteModal && (
        <CompleteInterviewModal 
          student={selectedStudent} 
          onClose={() => setShowCompleteModal(false)} 
          onComplete={(data) => handleConfirmComplete(data)} 
        />
      )}
    </AdminLayout>
  );
}
