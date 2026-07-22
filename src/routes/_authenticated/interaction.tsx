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
  Send,
  Loader2,
  Check,
  Building2,
  FileText,
  User,
  Phone,
  Briefcase,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { ApexLogo } from "@/components/ApexLogo";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/interaction")({
  head: () => ({ meta: [{ title: "Interview Status — APEX AI" }] }),
  component: InteractionPage,
});

export type InteractionMode = "offline" | "online";

// The 5 stages requested:
// Stage 1: "reviewing" (Activities Under Review)
// Stage 2: "waiting_schedule" (Approved, Waiting for Interview Schedule)
// Stage 3: "scheduled" (Interview Scheduled)
// Stage 4: "interview_completed" (Interview Completed, Waiting for Final Decision)
// Stage 5: "selected" | "waitlisted" | "rejected" (Final Result)
export type OnboardingStage =
  | "reviewing"
  | "waiting_schedule"
  | "scheduled"
  | "interview_completed"
  | "selected"
  | "waitlisted"
  | "rejected";

export interface InterviewTableData {
  student_id: string;
  activity_status: "pending" | "submitted" | "approved" | "rejected" | "skipped";
  review_status: "under_review" | "approved" | "changes_requested";
  interview_status: "waiting" | "scheduled" | "completed" | "cancelled" | "rescheduled";
  interview_mode: InteractionMode;
  interview_date: string;
  interview_time: string;
  meeting_link: string;
  venue: string;
  interviewer_name: string;
  duration: string;
  admin_notes: string;
  result_status: "pending" | "selected" | "waitlisted" | "rejected";
  created_at: string;
  updated_at: string;
}

function InteractionPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>("intern");

  // Scheduling and assignment overrides
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showAllocationModal, setShowAllocationModal] = useState(false);
  const [showRescheduleRequestModal, setShowRescheduleRequestModal] = useState(false);
  const [rescheduleReason, setRescheduleReason] = useState("");
  const [allocationProblem, setAllocationProblem] = useState("AI-Powered Financial Portfolio Optimizer");
  const [allocationAdmin, setAllocationAdmin] = useState("Sarah Jenkins");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [allocationSuccess, setAllocationSuccess] = useState(false);

  // Administrative scheduling fields
  const [formMode, setFormMode] = useState<InteractionMode>("online");
  const [formDate, setFormDate] = useState("2026-07-25");
  const [formTime, setFormTime] = useState("02:30 PM");
  const [formVenue, setFormVenue] = useState("APEX Innovation Hub, Floor 4, Suite 402");
  const [formLink, setFormLink] = useState("https://meet.google.com/apex-ai-launchpad");
  const [formInterviewer, setFormInterviewer] = useState("Sarah Jenkins");
  const [formDuration, setFormDuration] = useState("45 minutes");
  const [formNotes, setFormNotes] = useState("Initial 1-to-1 Technical Alignment & Problem Statement Briefing.");

  // Single unified state representation mapped to mock-supported database representation in Supabase profile column
  const [dbData, setDbData] = useState<InterviewTableData>({
    student_id: "",
    activity_status: "submitted",
    review_status: "under_review",
    interview_status: "waiting",
    interview_mode: "online",
    interview_date: "2026-07-25",
    interview_time: "02:30 PM",
    meeting_link: "https://meet.google.com/apex-ai-launchpad",
    venue: "APEX Innovation Hub, Suite 402",
    interviewer_name: "Sarah Jenkins",
    duration: "45 minutes",
    admin_notes: "Initial 1-to-1 Technical Alignment & Problem Statement Briefing.",
    result_status: "pending",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  // Calculate the active Stage
  const activeStage: OnboardingStage = useMemo(() => {
    if (dbData.result_status === "selected") return "selected";
    if (dbData.result_status === "waitlisted") return "waitlisted";
    if (dbData.result_status === "rejected") return "rejected";
    if (dbData.interview_status === "completed") return "interview_completed";
    if (dbData.interview_status === "scheduled" || dbData.interview_status === "rescheduled") return "scheduled";
    if (dbData.review_status === "approved" || dbData.activity_status === "approved" || dbData.activity_status === "skipped") {
      return "waiting_schedule";
    }
    return "reviewing";
  }, [dbData]);

  // Real-time Countdown timer for Stage 3
  const [countdownText, setCountdownText] = useState("");
  useEffect(() => {
    if (activeStage !== "scheduled") return;
    const interval = setInterval(() => {
      const interviewDateTime = new Date(`${dbData.interview_date} ${dbData.interview_time}`);
      const now = new Date();
      const diff = interviewDateTime.getTime() - now.getTime();

      if (diff <= 0) {
        setCountdownText("Interview has started!");
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);
        setCountdownText(`${hours}h ${mins}m ${secs}s remaining`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeStage, dbData.interview_date, dbData.interview_time]);

  // Load state from DB
  const loadData = async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    setUserId(auth.user.id);

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, onboarding_completed, problem_statement, assigned_admin, activity_submissions, interview_dossier")
      .eq("id", auth.user.id)
      .maybeSingle();

    if (profile) {
      setUserRole(profile.role || "intern");
      if (profile.onboarding_completed) {
        navigate({ to: "/dashboard", replace: true });
        return;
      }

      // Check if dossier data was stored previously
      if (profile.interview_dossier) {
        setDbData(profile.interview_dossier as any);
      } else {
        // Fallback or initialization based on activities status
        const submissions = profile.activity_submissions || {};
        const dossierRecord = submissions[7] || {};
        const isApproved = dossierRecord.status === "approved" || dossierRecord.status === "skipped";

        setDbData((prev) => ({
          ...prev,
          student_id: auth.user.id,
          activity_status: isApproved ? "approved" : "submitted",
          review_status: isApproved ? "approved" : "under_review",
        }));
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();

    // Listen to realtime updates on profiles table to keep status synced
    const channel = supabase
      .channel("interaction-realtime-sync")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles" }, (payload) => {
        if (payload.new && payload.new.id === userId) {
          if (payload.new.onboarding_completed) {
            navigate({ to: "/dashboard", replace: true });
          } else if (payload.new.interview_dossier) {
            setDbData(payload.new.interview_dossier as any);
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const updateDbDossier = async (updated: InterviewTableData) => {
    setDbData(updated);
    if (userId) {
      await supabase
        .from("profiles")
        .update({
          interview_dossier: updated as any,
        })
        .eq("id", userId);
    }
  };

  const handleCopyMeetingLink = () => {
    if (dbData.meeting_link) {
      navigator.clipboard.writeText(dbData.meeting_link);
      toast.success("Meeting link copied to clipboard!");
    }
  };

  const handleDownloadCalendar = () => {
    const icsData = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//APEX AI Launchpad//NONSGML v1.0//EN
BEGIN:VEVENT
SUMMARY:APEX AI 1-to-1 Onboarding Interaction
DESCRIPTION:${dbData.admin_notes || "1-to-1 Final Interaction"}
LOCATION:${dbData.interview_mode === "offline" ? dbData.venue : dbData.meeting_link}
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

  const handleRequestReschedule = async () => {
    if (!rescheduleReason.trim()) return toast.error("Please enter a reason for your reschedule request.");
    setShowRescheduleRequestModal(false);
    
    const updated: InterviewTableData = {
      ...dbData,
      interview_status: "rescheduled",
      admin_notes: `Reschedule request submitted: ${rescheduleReason}`,
    };
    await updateDbDossier(updated);
    toast.success("Reschedule request submitted to your assigned Admin!");
  };

  // Admin Controls
  const handleAdminScheduleInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowScheduleModal(false);

    const updated: InterviewTableData = {
      ...dbData,
      review_status: "approved",
      interview_status: "scheduled",
      interview_mode: formMode,
      interview_date: formDate,
      interview_time: formTime,
      venue: formVenue,
      meeting_link: formLink,
      interviewer_name: formInterviewer,
      duration: formDuration,
      admin_notes: formNotes,
      updated_at: new Date().toISOString(),
    };
    await updateDbDossier(updated);
    toast.success("Interview scheduled and invite details generated!");
  };

  const handleAdminMarkCompleted = async () => {
    const updated: InterviewTableData = {
      ...dbData,
      interview_status: "completed",
      updated_at: new Date().toISOString(),
    };
    await updateDbDossier(updated);
    toast.success("Interview marked as Completed!");
  };

  const handleAdminSetResult = async (result: "selected" | "waitlisted" | "rejected") => {
    const updated: InterviewTableData = {
      ...dbData,
      result_status: result,
      updated_at: new Date().toISOString(),
    };
    await updateDbDossier(updated);
    toast.success(`Result updated: Student marked as ${result.toUpperCase()}`);
  };

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
            onboarding_completed: true,
          })
          .eq("id", userId);
      }

      setAllocationSuccess(true);
      toast.success("Project Allocation Email successfully sent to student!");
      navigate({ to: "/project-allocation" });
    }, 1200);
  };

  const handleResetWorkflow = async () => {
    const updated: InterviewTableData = {
      student_id: userId || "",
      activity_status: "submitted",
      review_status: "under_review",
      interview_status: "waiting",
      interview_mode: "online",
      interview_date: "2026-07-25",
      interview_time: "02:30 PM",
      meeting_link: "https://meet.google.com/apex-ai-launchpad",
      venue: "APEX Innovation Hub, BKC, Floor 4",
      interviewer_name: "Sarah Jenkins",
      duration: "45 minutes",
      admin_notes: "Initial 1-to-1 Technical Alignment & Problem Statement Briefing.",
      result_status: "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await updateDbDossier(updated);
    toast.success("Interview progress status reset to Stage 1!");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] grid place-items-center">
        <Loader2 className="size-8 animate-spin text-[#FF6B00]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col justify-between p-4 sm:p-6 md:p-10 font-sans selection:bg-[#FF6B00]/10 selection:text-[#FF6B00]">
      <header className="max-w-5xl w-full mx-auto flex items-center justify-between py-2 mb-6">
        <ApexLogo size="md" />
        <span className="text-xs font-semibold uppercase tracking-wider bg-orange-50 text-[#FF6B00] px-3.5 py-1 rounded-full">
          Phase 7 • Interview & Assessment Dashboard
        </span>
      </header>

      <main className="max-w-5xl w-full mx-auto flex-1 flex flex-col justify-center relative space-y-6">
        {/* Onboarding Stage Track Indicator */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-3">
          <div className="text-xs font-bold text-gray-700 uppercase tracking-wider">
            Overall Interview Track Progress
          </div>
          <div className="grid grid-cols-5 gap-1.5 text-center text-[10px] font-bold text-gray-500">
            <div className={`p-2 rounded-xl border ${activeStage === "reviewing" ? "bg-orange-50 text-[#FF6B00] border-orange-200 ring-2 ring-[#FF6B00]/25 font-black" : "bg-emerald-50 text-emerald-600 border-emerald-100"}`}>
              1. Reviewing
            </div>
            <div className={`p-2 rounded-xl border ${activeStage === "waiting_schedule" ? "bg-orange-50 text-[#FF6B00] border-orange-200 ring-2 ring-[#FF6B00]/25 font-black" : activeStage !== "reviewing" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-gray-50 border-gray-200"}`}>
              2. Approved
            </div>
            <div className={`p-2 rounded-xl border ${activeStage === "scheduled" ? "bg-orange-50 text-[#FF6B00] border-orange-200 ring-2 ring-[#FF6B00]/25 font-black" : (activeStage !== "reviewing" && activeStage !== "waiting_schedule") ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-gray-50 border-gray-200"}`}>
              3. Scheduled
            </div>
            <div className={`p-2 rounded-xl border ${activeStage === "interview_completed" ? "bg-orange-50 text-[#FF6B00] border-orange-200 ring-2 ring-[#FF6B00]/25 font-black" : (activeStage === "selected" || activeStage === "waitlisted" || activeStage === "rejected") ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-gray-50 border-gray-200"}`}>
              4. Completed
            </div>
            <div className={`p-2 rounded-xl border ${(activeStage === "selected" || activeStage === "waitlisted" || activeStage === "rejected") ? "bg-[#FFF0E6] text-[#FF6B00] border-orange-200 ring-2 ring-[#FF6B00]/20 font-black" : "bg-gray-50 border-gray-200"}`}>
              5. Final Result
            </div>
          </div>
        </div>

        {/* Dynamic Card Container mapping to the 5 requested Stages */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-6">
          {activeStage === "reviewing" && (
            <div className="space-y-4 text-center py-6">
              <div className="size-16 rounded-full bg-orange-100 text-[#FF6B00] mx-auto flex items-center justify-center animate-pulse">
                <Clock className="size-8 animate-spin" />
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-gray-900">Stage 1 — Activities Under Review</h2>
                <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
                  Your submitted activities dossier is currently being reviewed by the Admin/Super Admin. Please check back later.
                </p>
              </div>
              <div className="text-xs text-gray-400 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 w-fit mx-auto">
                Estimated review time: 12-24 hours
              </div>
            </div>
          )}

          {activeStage === "waiting_schedule" && (
            <div className="space-y-4 text-center py-6">
              <div className="size-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="size-8" />
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-gray-900">Stage 2 — Review Completed</h2>
                <p className="text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
                  Congratulations! Your activities have been approved. We are waiting for the admin to schedule your 1-to-1 interview.
                </p>
              </div>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-extrabold bg-blue-50 text-blue-600 border border-blue-200">
                Waiting for Interview Schedule
              </span>
            </div>
          )}

          {activeStage === "scheduled" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-4 gap-3">
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Sparkles className="size-5 text-[#FF6B00]" /> Stage 3 — Interview Scheduled
                  </h2>
                  <p className="text-xs text-gray-500">Your final onboarding assessment meeting details:</p>
                </div>
                <div className="text-xs font-black text-white bg-[#FF6B00] px-4.5 py-2 rounded-2xl shadow-md animate-pulse">
                  {countdownText}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4 bg-gray-50 border border-gray-200 p-5 rounded-2xl text-xs">
                  <div>
                    <span className="text-gray-400 block">Interviewer</span>
                    <span className="font-extrabold text-gray-900 text-sm block mt-0.5">{dbData.interviewer_name}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-3">
                    <span className="text-gray-400 block">Duration</span>
                    <span className="font-bold text-gray-900">{dbData.duration}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-3">
                    <span className="text-gray-400 block">Date & Time</span>
                    <span className="font-bold text-gray-900">{dbData.interview_date} at {dbData.interview_time}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-3">
                    <span className="text-gray-400 block">Mode</span>
                    <span className="font-bold text-gray-900 capitalize">{dbData.interview_mode}</span>
                  </div>
                </div>

                <div className="md:col-span-2 space-y-4">
                  {dbData.interview_mode === "online" ? (
                    <div className="bg-blue-50/50 border border-blue-100 p-5 rounded-2xl space-y-3 text-xs">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-gray-500 block font-medium">Meeting URL</span>
                          <span className="font-bold text-blue-700 block mt-0.5">{dbData.meeting_link}</span>
                        </div>
                        <button
                          type="button"
                          onClick={handleCopyMeetingLink}
                          className="h-8 px-3 rounded-xl bg-white border border-blue-200 text-blue-700 font-semibold text-xs inline-flex items-center gap-1"
                        >
                          <Copy className="size-3" /> Copy
                        </button>
                      </div>

                      <div className="pt-3 border-t border-blue-100 flex gap-4">
                        <button
                          onClick={handleDownloadCalendar}
                          className="h-10 px-4 rounded-xl bg-white border border-gray-200 text-gray-700 font-bold hover:bg-gray-50"
                        >
                          Download Calendar File
                        </button>
                        <a
                          href={dbData.meeting_link}
                          target="_blank"
                          rel="noreferrer"
                          className="h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold inline-flex items-center gap-1.5 shadow-md shadow-blue-600/20"
                        >
                          <Video className="size-4" /> Join Google Meet
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-orange-50/30 border border-orange-100 p-5 rounded-2xl space-y-2 text-xs">
                      <span className="text-gray-400 block">Venue & Address</span>
                      <p className="font-bold text-gray-900">{dbData.venue}</p>
                      <p className="text-gray-600">Please report 15 mins prior with your credentials.</p>
                      <div className="pt-2">
                        <button
                          onClick={handleDownloadCalendar}
                          className="h-10 px-4 rounded-xl bg-white border border-gray-200 text-gray-700 font-bold hover:bg-gray-50"
                        >
                          Download Calendar File
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 text-xs">
                    <span className="font-bold text-gray-800">Admin Special Instructions:</span>
                    <p className="text-gray-600 mt-1">{dbData.admin_notes}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeStage === "interview_completed" && (
            <div className="space-y-4 text-center py-6">
              <div className="size-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="size-8" />
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-gray-900">Stage 4 — Interview Completed</h2>
                <p className="text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
                  Your interview has been completed successfully. We are waiting for the final evaluation decision from the Super Admin.
                </p>
              </div>
              <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                Waiting for Final Decision
              </span>
            </div>
          )}

          {(activeStage === "selected" || activeStage === "waitlisted" || activeStage === "rejected") && (
            <div className="space-y-5 text-center py-6">
              {activeStage === "selected" && (
                <>
                  <div className="size-20 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center animate-bounce">
                    <CheckCircle2 className="size-12" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-3xl font-extrabold text-gray-900">Result: SELECTED</h2>
                    <p className="text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
                      Congratulations! You have been selected for the APEX AI engineering cohort. Please click below to view your allocated project.
                    </p>
                  </div>
                  <div className="pt-3">
                    <button
                      onClick={() => setShowAllocationModal(true)}
                      className="h-12 px-8 rounded-2xl bg-[#FF6B00] hover:bg-[#e05e00] text-white font-bold text-sm inline-flex items-center gap-2 shadow-lg"
                    >
                      <span>Proceed to Project Allocation</span>
                      <ArrowRight className="size-4" />
                    </button>
                  </div>
                </>
              )}

              {activeStage === "waitlisted" && (
                <>
                  <div className="size-16 rounded-full bg-amber-100 text-amber-600 mx-auto flex items-center justify-center">
                    <AlertTriangle className="size-8" />
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-2xl font-bold text-gray-900">Result: WAITLISTED</h2>
                    <p className="text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
                      You are currently placed on the waitlist. We will notify you immediately if slot allocation expands or assignments change.
                    </p>
                  </div>
                </>
              )}

              {activeStage === "rejected" && (
                <>
                  <div className="size-16 rounded-full bg-red-100 text-red-600 mx-auto flex items-center justify-center">
                    <XCircle className="size-8" />
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-2xl font-bold text-gray-900">Result: NOT SELECTED</h2>
                    <p className="text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
                      Thank you for your time. Your application was reviewed, and we unfortunately cannot move forward with your allocation at this time.
                    </p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Admin and Super Admin Control Toolbar */}
        {(userRole === "admin" || userRole === "super_admin") && (
          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[#FF6B00] uppercase tracking-wider">
                <ShieldCheck className="size-4" /> Administrative Controls ({userRole.replace("_", " ")})
              </div>
              <button
                onClick={handleResetWorkflow}
                className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="size-3.5" /> Reset Onboarding Status
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {activeStage === "reviewing" && (
                <button
                  type="button"
                  onClick={async () => {
                    const updated: InterviewTableData = {
                      ...dbData,
                      review_status: "approved",
                      activity_status: "approved",
                    };
                    await updateDbDossier(updated);
                    toast.success("Student activities approved!");
                  }}
                  className="h-10 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  Approve Student Activities
                </button>
              )}

              {activeStage === "waiting_schedule" && (
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(true)}
                  className="h-10 px-5 rounded-2xl bg-[#FF6B00] hover:bg-[#e05e00] text-white font-bold text-xs shadow-md shadow-[#FF6B00]/20 cursor-pointer"
                >
                  Schedule Final 1-to-1 Interview
                </button>
              )}

              {activeStage === "scheduled" && (
                <button
                  type="button"
                  onClick={handleAdminMarkCompleted}
                  className="h-10 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Check className="size-3.5" /> Mark Interview Completed
                </button>
              )}

              {activeStage === "interview_completed" && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAdminSetResult("selected")}
                    className="h-10 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer"
                  >
                    Set Selected
                  </button>
                  <button
                    onClick={() => handleAdminSetResult("waitlisted")}
                    className="h-10 px-5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs cursor-pointer"
                  >
                    Set Waitlisted
                  </button>
                  <button
                    onClick={() => handleAdminSetResult("rejected")}
                    className="h-10 px-5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs cursor-pointer"
                  >
                    Set Rejected
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Schedule Interview Modal */}
        {showScheduleModal && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <form onSubmit={handleAdminScheduleInterview} className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-gray-100 space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <h3 className="text-xl font-bold text-gray-900">Schedule Interview</h3>
              <div className="space-y-3 text-xs">
                <label className="block space-y-1">
                  <span className="font-bold text-gray-700">Interview Mode</span>
                  <select
                    value={formMode}
                    onChange={(e) => setFormMode(e.target.value as any)}
                    className="w-full h-10 rounded-2xl bg-gray-50 border border-gray-200 px-3 focus:outline-none"
                  >
                    <option value="online">Online</option>
                    <option value="offline">Offline (In-Person)</option>
                  </select>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="block space-y-1">
                    <span className="font-bold text-gray-700">Date</span>
                    <input
                      type="date"
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="w-full h-10 rounded-2xl bg-gray-50 border border-gray-200 px-3 focus:outline-none"
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="font-bold text-gray-700">Time</span>
                    <input
                      type="text"
                      value={formTime}
                      onChange={(e) => setFormTime(e.target.value)}
                      className="w-full h-10 rounded-2xl bg-gray-50 border border-gray-200 px-3 focus:outline-none"
                    />
                  </label>
                </div>
                {formMode === "online" ? (
                  <label className="block space-y-1">
                    <span className="font-bold text-gray-700">Meeting Link</span>
                    <input
                      type="url"
                      value={formLink}
                      onChange={(e) => setFormLink(e.target.value)}
                      className="w-full h-10 rounded-2xl bg-gray-50 border border-gray-200 px-3 focus:outline-none"
                    />
                  </label>
                ) : (
                  <label className="block space-y-1">
                    <span className="font-bold text-gray-700">Venue / Location</span>
                    <input
                      type="text"
                      value={formVenue}
                      onChange={(e) => setFormVenue(e.target.value)}
                      className="w-full h-10 rounded-2xl bg-gray-50 border border-gray-200 px-3 focus:outline-none"
                    />
                  </label>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <label className="block space-y-1">
                    <span className="font-bold text-gray-700">Interviewer Name</span>
                    <input
                      type="text"
                      value={formInterviewer}
                      onChange={(e) => setFormInterviewer(e.target.value)}
                      className="w-full h-10 rounded-2xl bg-gray-50 border border-gray-200 px-3 focus:outline-none"
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="font-bold text-gray-700">Duration</span>
                    <input
                      type="text"
                      value={formDuration}
                      onChange={(e) => setFormDuration(e.target.value)}
                      className="w-full h-10 rounded-2xl bg-gray-50 border border-gray-200 px-3 focus:outline-none"
                    />
                  </label>
                </div>
                <label className="block space-y-1">
                  <span className="font-bold text-gray-700">Instructions / Notes</span>
                  <textarea
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    rows={2}
                    className="w-full rounded-2xl bg-gray-50 border border-gray-200 p-3 focus:outline-none"
                  />
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="h-10 px-4 rounded-2xl border border-gray-200 text-gray-600 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-10 px-5 rounded-2xl bg-[#FF6B00] text-white text-xs font-bold hover:bg-[#e05e00]"
                >
                  Schedule Interview
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Project Allocation Modal */}
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

      <footer className="max-w-5xl w-full mx-auto text-center py-4 text-xs text-gray-400 mt-6">
        © APEX AI Launchpad • 1-to-1 Interaction Module
      </footer>
    </div>
  );
}
