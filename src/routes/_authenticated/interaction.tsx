import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import {
  Users,
  Calendar,
  Clock,
  MapPin,
  Video,
  Copy,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  XCircle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Mail,
  Edit2,
  Send,
  Loader2,
  Check,
  Building2,
  FileText,
  User,
  Phone,
  Briefcase,
} from "lucide-react";
import { toast } from "sonner";
import { ApexLogo } from "@/components/ApexLogo";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/interaction")({
  head: () => ({ meta: [{ title: "1-to-1 Interaction — APEX AI" }] }),
  component: InteractionPage,
});

export type InteractionMode = "offline" | "online";
export type InteractionStatus = "waiting" | "scheduled" | "completed" | "cancelled" | "rescheduled";

export interface InteractionData {
  id: string;
  student_id: string;
  admin_id: string;
  admin_name: string;
  admin_title: string;
  mode: InteractionMode;
  date: string;
  time: string;
  status: InteractionStatus;
  remarks?: string;
  venue?: string;
  address?: string;
  google_maps_url?: string;
  contact_person?: string;
  reporting_time?: string;
  meeting_link?: string;
  meeting_id?: string;
  meeting_password?: string;
  instructions: string[];
  interview_email_sent: boolean;
  project_allocation_email_sent: boolean;
  problem_statement_name?: string;
  assigned_admin_name?: string;
}

function InteractionPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>("intern");

  // Interaction State
  const [interaction, setInteraction] = useState<InteractionData>({
    id: "int_001",
    student_id: "",
    admin_id: "admin_01",
    admin_name: "Sarah Jenkins",
    admin_title: "Senior AI Engineer & Mentor",
    mode: "offline",
    date: "2026-07-25",
    time: "02:30 PM",
    status: "scheduled",
    remarks: "Initial 1-to-1 Technical Alignment & Problem Statement Briefing.",
    venue: "APEX Innovation Hub, Floor 4, Suite 402",
    address: "Tech Park Phase II, BKC, Mumbai 400051",
    google_maps_url: "https://maps.google.com",
    contact_person: "Sarah Jenkins (+91 9876543210)",
    reporting_time: "02:15 PM (15 mins prior)",
    meeting_link: "https://meet.google.com/apex-ai-launchpad",
    meeting_id: "849-201-492",
    meeting_password: "APEX-INTERN-AI",
    instructions: [
      "Bring your personal laptop with web environment pre-configured.",
      "Carry valid government ID card for Security check at building reception.",
      "Prepare a 2-minute oral summary of your 7 onboarding activities.",
    ],
    interview_email_sent: true,
    project_allocation_email_sent: false,
  });

  // Admin Scheduling & Allocation Form States
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showAllocationModal, setShowAllocationModal] = useState(false);
  const [showRescheduleRequestModal, setShowRescheduleRequestModal] = useState(false);
  const [rescheduleReason, setRescheduleReason] = useState("");
  const [allocationProblem, setAllocationProblem] = useState("AI-Powered Financial Portfolio Optimizer");
  const [allocationAdmin, setAllocationAdmin] = useState("Sarah Jenkins");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [allocationSuccess, setAllocationSuccess] = useState(false);

  useEffect(() => {
    async function loadData() {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      setUserId(auth.user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, onboarding_completed, problem_statement, assigned_admin")
        .eq("id", auth.user.id)
        .maybeSingle();

      if (profile) {
        setUserRole(profile.role || "intern");
        if (profile.onboarding_completed) {
          // If already fully allocated and completed onboarding, redirect directly to dashboard
          navigate({ to: "/dashboard", replace: true });
          return;
        }

        if (profile.problem_statement) {
          setInteraction((prev) => ({
            ...prev,
            status: "completed",
            problem_statement_name: profile.problem_statement,
            assigned_admin_name: profile.assigned_admin || "Sarah Jenkins",
            project_allocation_email_sent: true,
          }));
        }
      }

      setLoading(false);
    }

    loadData();
  }, [navigate]);

  // Handle Copy Meeting Link
  const handleCopyMeetingLink = () => {
    if (interaction.meeting_link) {
      navigator.clipboard.writeText(interaction.meeting_link);
      toast.success("Meeting link copied to clipboard!");
    }
  };

  // Handle Download Calendar File
  const handleDownloadCalendar = () => {
    const icsData = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//APEX AI Launchpad//NONSGML v1.0//EN
BEGIN:VEVENT
SUMMARY:APEX AI 1-to-1 Onboarding Interaction
DESCRIPTION:${interaction.remarks || "1-to-1 Final Interaction"}
LOCATION:${interaction.mode === "offline" ? interaction.venue : interaction.meeting_link}
DTSTART:20260725T143000Z
DTEND:20260725T153000Z
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsData], { type: "text/calendar;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Apex_Interaction_Invite.ics");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Calendar invite (.ics) downloaded!");
  };

  // Request Reschedule
  const handleRequestReschedule = () => {
    if (!rescheduleReason.trim()) return toast.error("Please enter a reason for your reschedule request.");
    setShowRescheduleRequestModal(false);
    setInteraction((prev) => ({ ...prev, status: "rescheduled" }));
    toast.success("Reschedule request submitted to your assigned Admin!");
  };

  // Admin Action: Send Interview Invitation Email
  const handleSendInterviewEmail = async () => {
    setSendingEmail(true);
    setTimeout(() => {
      setSendingEmail(false);
      setInteraction((prev) => ({ ...prev, interview_email_sent: true, status: "scheduled" }));
      toast.success(`Interview Invitation Email sent to student!`);
    }, 1000);
  };

  // Admin Action: Mark Interaction as Completed
  const handleAdminMarkCompleted = async () => {
    setInteraction((prev) => ({ ...prev, status: "completed" }));
    toast.success("1-to-1 Interaction marked as Completed!");
  };

  // Super Admin Action: Assign Problem Statement & Send Project Allocation Email
  const handleSuperAdminAllocateProject = async () => {
    setSendingEmail(true);
    setTimeout(async () => {
      setSendingEmail(false);
      setShowAllocationModal(false);

      if (userId) {
        await supabase
          .from("profiles")
          .update({
            problem_statement: allocationProblem,
            assigned_admin: allocationAdmin,
            onboarding_completed: true, // Permanent completion flag
          })
          .eq("id", userId);
      }

      setInteraction((prev) => ({
        ...prev,
        status: "completed",
        problem_statement_name: allocationProblem,
        assigned_admin_name: allocationAdmin,
        project_allocation_email_sent: true,
      }));

      setAllocationSuccess(true);
      toast.success("Project Allocation Email automatically sent to student!");
    }, 1200);
  };

  const handleGoToInternshipDashboard = () => {
    toast.success("Proceeding to Project Allocation Stage...");
    navigate({ to: "/project-allocation" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] grid place-items-center">
        <Loader2 className="size-8 animate-spin text-[#FF6B00]" />
      </div>
    );
  }

  const getStatusBadge = (status: InteractionStatus) => {
    switch (status) {
      case "waiting":
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200">Waiting Schedule</span>;
      case "scheduled":
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-50 text-[#FF6B00] border border-orange-200">Scheduled</span>;
      case "completed":
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">Completed</span>;
      case "rescheduled":
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-600 border border-amber-200">Reschedule Requested</span>;
      case "cancelled":
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-600 border border-red-200">Cancelled</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col justify-between p-4 sm:p-6 md:p-10 font-sans selection:bg-[#FF6B00]/10 selection:text-[#FF6B00]">
      {/* Header */}
      <header className="max-w-5xl w-full mx-auto flex items-center justify-between py-2 mb-6">
        <ApexLogo size="md" />
        <span className="text-xs font-semibold uppercase tracking-wider bg-orange-50 text-[#FF6B00] px-3.5 py-1 rounded-full">
          Phase 7 • 1-to-1 Interaction
        </span>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl w-full mx-auto flex-1 flex flex-col justify-center relative">
        {/* Project Allocation Success Screen */}
        {allocationSuccess || interaction.project_allocation_email_sent ? (
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-gray-100 shadow-sm text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="size-20 rounded-full bg-emerald-50 text-emerald-500 mx-auto flex items-center justify-center animate-bounce">
              <CheckCircle2 className="size-12" />
            </div>
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600 px-3 py-1 rounded-md">
                Onboarding Completed
              </span>
              <h2 className="text-3xl font-extrabold text-gray-900">Congratulations!</h2>
              <p className="text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
                You have successfully completed the Apex AI Launchpad onboarding process. You have been assigned a Problem Statement and Mentor.
              </p>
            </div>

            {/* Allocation Details Card */}
            <div className="bg-gray-50/80 border border-gray-200 rounded-2xl p-6 max-w-md mx-auto text-left space-y-3">
              <div>
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">Assigned Problem Statement</span>
                <span className="text-sm font-bold text-gray-900">{interaction.problem_statement_name || allocationProblem}</span>
              </div>
              <div className="border-t border-gray-200 pt-3">
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">Assigned Mentor / Admin</span>
                <span className="text-sm font-bold text-gray-900">{interaction.assigned_admin_name || allocationAdmin}</span>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="button"
                onClick={handleGoToInternshipDashboard}
                className="h-13 px-8 rounded-2xl bg-[#FF6B00] hover:bg-[#e05e00] text-white font-bold text-sm inline-flex items-center gap-2 shadow-lg shadow-[#FF6B00]/25 transition-all cursor-pointer"
              >
                <span>Go to Internship Dashboard</span>
                <ArrowRight className="size-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
                <div>
                  <div className="inline-flex items-center gap-2 text-xs font-bold text-[#FF6B00] uppercase tracking-wider mb-1">
                    <Sparkles className="size-3.5" /> Final Stage Assessment
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                    1-to-1 Interaction
                  </h1>
                  <p className="text-sm text-gray-500 mt-1">
                    Complete your final onboarding interaction before internship allocation.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {getStatusBadge(interaction.status)}
                </div>
              </div>

              {/* Onboarding Timeline Progress Bar */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Onboarding Progress Timeline
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 text-center text-[10px] font-bold text-gray-500 pt-1">
                  <div className="bg-emerald-50 text-emerald-600 p-2 rounded-xl border border-emerald-200">✓ Profile</div>
                  <div className="bg-emerald-50 text-emerald-600 p-2 rounded-xl border border-emerald-200">✓ Questionnaire</div>
                  <div className="bg-emerald-50 text-emerald-600 p-2 rounded-xl border border-emerald-200">✓ LMS</div>
                  <div className="bg-emerald-50 text-emerald-600 p-2 rounded-xl border border-emerald-200">✓ Activities</div>
                  <div className={`p-2 rounded-xl border ${interaction.status === "completed" ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-orange-50 text-[#FF6B00] border-orange-200 ring-2 ring-[#FF6B00]/20"}`}>● 1-to-1 Interview</div>
                  <div className="bg-gray-100 text-gray-400 p-2 rounded-xl border border-gray-200">○ Allocation</div>
                  <div className="bg-gray-100 text-gray-400 p-2 rounded-xl border border-gray-200">○ Internship</div>
                </div>
              </div>
            </div>

            {/* Interaction Details Layout */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left Column: Admin & Meeting Info Card */}
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-5 md:col-span-1">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2">
                  Assigned Mentor
                </div>

                <div className="flex items-center gap-3">
                  <div className="size-12 rounded-2xl bg-orange-100 text-[#FF6B00] font-bold flex items-center justify-center text-lg">
                    {interaction.admin_name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">{interaction.admin_name}</h3>
                    <p className="text-xs text-gray-500">{interaction.admin_title}</p>
                  </div>
                </div>

                <div className="space-y-3 pt-2 text-xs border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Interaction Mode:</span>
                    <span className="font-bold text-gray-900 capitalize inline-flex items-center gap-1">
                      {interaction.mode === "offline" ? <Building2 className="size-3.5 text-[#FF6B00]" /> : <Video className="size-3.5 text-blue-500" />}
                      {interaction.mode}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Date:</span>
                    <span className="font-bold text-gray-900">{interaction.date}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Time:</span>
                    <span className="font-bold text-gray-900">{interaction.time}</span>
                  </div>
                </div>

                {/* Actions for Student */}
                <div className="pt-2 space-y-2">
                  <button
                    type="button"
                    onClick={handleDownloadCalendar}
                    className="w-full h-10 rounded-2xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 font-semibold text-xs inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Calendar className="size-3.5" /> Download (.ics) Invite
                  </button>

                  {interaction.status !== "completed" && (
                    <button
                      type="button"
                      onClick={() => setShowRescheduleRequestModal(true)}
                      className="w-full h-10 rounded-2xl border border-gray-200 text-gray-600 font-semibold text-xs hover:bg-gray-50 transition-all cursor-pointer"
                    >
                      Request Reschedule
                    </button>
                  )}
                </div>
              </div>

              {/* Right Column: Mode-Specific Venue / Meeting Card */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-5 md:col-span-2">
                {interaction.mode === "offline" ? (
                  /* OFFLINE MODE DETAILS */
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                      <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                        <Building2 className="size-5 text-[#FF6B00]" /> Offline Interaction Venue
                      </h3>
                      <a
                        href={interaction.google_maps_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-semibold text-[#FF6B00] hover:underline flex items-center gap-1"
                      >
                        <MapPin className="size-3.5" /> Open Google Maps
                      </a>
                    </div>

                    <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-200 space-y-2 text-xs">
                      <div>
                        <span className="text-gray-400 block font-medium">Venue Address:</span>
                        <p className="font-bold text-gray-900">{interaction.venue}</p>
                        <p className="text-gray-600">{interaction.address}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200">
                        <div>
                          <span className="text-gray-400 block font-medium">Contact Person:</span>
                          <p className="font-bold text-gray-900">{interaction.contact_person}</p>
                        </div>
                        <div>
                          <span className="text-gray-400 block font-medium">Reporting Time:</span>
                          <p className="font-bold text-gray-900">{interaction.reporting_time}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* ONLINE MODE DETAILS */
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                      <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                        <Video className="size-5 text-blue-500" /> Online Video Meeting
                      </h3>
                    </div>

                    <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 space-y-3 text-xs">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-gray-500 block font-medium">Meeting Link:</span>
                          <p className="font-bold text-blue-700 truncate">{interaction.meeting_link}</p>
                        </div>
                        <button
                          type="button"
                          onClick={handleCopyMeetingLink}
                          className="h-8 px-3 rounded-xl bg-white border border-blue-200 text-blue-700 font-semibold text-xs inline-flex items-center gap-1 hover:bg-blue-50 transition-all cursor-pointer"
                        >
                          <Copy className="size-3" /> Copy
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-blue-100">
                        <div>
                          <span className="text-gray-500 block font-medium">Meeting ID:</span>
                          <p className="font-bold text-gray-900">{interaction.meeting_id}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 block font-medium">Passcode:</span>
                          <p className="font-bold text-gray-900">{interaction.meeting_password}</p>
                        </div>
                      </div>
                    </div>

                    <a
                      href={interaction.meeting_link}
                      target="_blank"
                      rel="noreferrer"
                      className="h-11 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs inline-flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                    >
                      <Video className="size-4" /> Join Online Meeting
                    </a>
                  </div>
                )}

                {/* Instructions & Remarks */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                    Meeting Instructions
                  </h4>
                  <ul className="list-disc pl-4 text-xs text-gray-600 space-y-1">
                    {interaction.instructions.map((inst, idx) => (
                      <li key={idx}>{inst}</li>
                    ))}
                  </ul>

                  {interaction.remarks && (
                    <div className="bg-orange-50/50 p-3 rounded-xl border border-orange-100 text-xs">
                      <span className="font-bold text-[#FF6B00]">Remarks:</span>{" "}
                      <span className="text-gray-700">{interaction.remarks}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Admin / Super Admin Control Toolbar */}
            {(userRole === "admin" || userRole === "super_admin") && (
              <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#FF6B00] uppercase tracking-wider">
                    <ShieldCheck className="size-4" /> Administrative Controls ({userRole.replace("_", " ")})
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Admin Action: Send Interview Invitation Email */}
                  <button
                    type="button"
                    onClick={handleSendInterviewEmail}
                    disabled={sendingEmail}
                    className="h-10 px-4 rounded-2xl bg-white border border-gray-200 text-gray-800 font-semibold text-xs hover:bg-gray-50 transition-all inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Mail className="size-3.5 text-[#FF6B00]" /> Send Interview Invitation Email
                  </button>

                  {/* Admin Action: Mark Completed */}
                  {interaction.status !== "completed" && (
                    <button
                      type="button"
                      onClick={handleAdminMarkCompleted}
                      className="h-10 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                    >
                      <Check className="size-3.5" /> Mark Interaction Completed
                    </button>
                  )}

                  {/* Super Admin Action: Assign Problem Statement & Allocation Email */}
                  {userRole === "super_admin" && (
                    <button
                      type="button"
                      onClick={() => setShowAllocationModal(true)}
                      className="h-10 px-5 rounded-2xl bg-[#FF6B00] hover:bg-[#e05e00] text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-md shadow-[#FF6B00]/25 transition-all cursor-pointer"
                    >
                      <Sparkles className="size-3.5" /> Assign Problem Statement & Allocate
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Reschedule Request Modal */}
        {showRescheduleRequestModal && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100 space-y-4 animate-in fade-in duration-200">
              <h3 className="text-lg font-bold text-gray-900">Request Reschedule</h3>
              <textarea
                value={rescheduleReason}
                onChange={(e) => setRescheduleReason(e.target.value)}
                placeholder="Reason for reschedule request..."
                rows={3}
                className="w-full rounded-2xl bg-gray-50 border border-gray-200 p-3 text-xs text-gray-900 focus:outline-none focus:border-[#FF6B00]"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRescheduleRequestModal(false)}
                  className="h-10 px-4 rounded-xl border border-gray-200 text-gray-600 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRequestReschedule}
                  className="h-10 px-5 rounded-xl bg-[#FF6B00] text-white text-xs font-bold"
                >
                  Submit Request
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Super Admin Project Allocation Modal */}
        {showAllocationModal && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-gray-100 space-y-5 animate-in fade-in zoom-in-95 duration-200">
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-gray-900">Project Allocation & Final Onboarding</h3>
                <p className="text-xs text-gray-500">
                  Assign Problem Statement and Mentor to generate Project Allocation Email.
                </p>
              </div>

              <div className="space-y-4 text-xs">
                <label className="block space-y-1">
                  <span className="font-bold text-gray-700">Problem Statement</span>
                  <select
                    value={allocationProblem}
                    onChange={(e) => setAllocationProblem(e.target.value)}
                    className="w-full h-11 rounded-2xl bg-gray-50 border border-gray-200 px-3 text-xs text-gray-900 focus:outline-none focus:border-[#FF6B00]"
                  >
                    <option value="AI-Powered Financial Portfolio Optimizer">AI-Powered Financial Portfolio Optimizer</option>
                    <option value="Automated Code Reviewer & Security Scanner">Automated Code Reviewer & Security Scanner</option>
                    <option value="Generative AI Content Personalization Engine">Generative AI Content Personalization Engine</option>
                  </select>
                </label>

                <label className="block space-y-1">
                  <span className="font-bold text-gray-700">Assigned Admin / Mentor</span>
                  <select
                    value={allocationAdmin}
                    onChange={(e) => setAllocationAdmin(e.target.value)}
                    className="w-full h-11 rounded-2xl bg-gray-50 border border-gray-200 px-3 text-xs text-gray-900 focus:outline-none focus:border-[#FF6B00]"
                  >
                    <option value="Sarah Jenkins">Sarah Jenkins (Senior AI Engineer)</option>
                    <option value="David Chen">David Chen (Lead Full-Stack Architect)</option>
                  </select>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAllocationModal(false)}
                  className="h-11 px-5 rounded-2xl border border-gray-200 text-gray-700 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSuperAdminAllocateProject}
                  disabled={sendingEmail}
                  className="h-11 px-6 rounded-2xl bg-[#FF6B00] hover:bg-[#e05e00] text-white font-bold text-xs shadow-md shadow-[#FF6B00]/25 transition-all cursor-pointer"
                >
                  {sendingEmail ? <Loader2 className="size-4 animate-spin" /> : "Confirm Allocation & Send Email"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-5xl w-full mx-auto text-center py-4 text-xs text-gray-400 mt-6">
        © APEX AI Launchpad • 1-to-1 Interaction Module
      </footer>
    </div>
  );
}
