import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  BookOpen,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  AlertCircle,
  Loader2,
  ShieldCheck,
  RotateCcw,
  SkipForward,
} from "lucide-react";
import { toast } from "sonner";
import { ApexLogo } from "@/components/ApexLogo";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/lms-integration")({
  head: () => ({ meta: [{ title: "LMS Integration — APEX AI" }] }),
  component: LmsIntegrationPage,
});

export type LmsStatus = "not_started" | "in_progress" | "completed" | "skipped";

export interface LmsData {
  student_id: string;
  lms_status: LmsStatus;
  completion_pct: number;
  assigned_path: string;
  total_courses: number;
  completed_courses: number;
  remaining_courses: number;
  est_time_remaining: string;
  last_sync_time: string;
  connection_status: "connected" | "error";
  skipped_by_super_admin: boolean;
  completion_date?: string;
}

function LmsIntegrationPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showCompletedOverlay, setShowCompletedOverlay] = useState(false);
  const [userRole, setUserRole] = useState<string>("intern");
  const [userId, setUserId] = useState<string | null>(null);

  const [lmsData, setLmsData] = useState<LmsData>({
    student_id: "",
    lms_status: "in_progress",
    completion_pct: 75,
    assigned_path: "AI & Full-Stack Development Track",
    total_courses: 8,
    completed_courses: 6,
    remaining_courses: 2,
    est_time_remaining: "3 hours",
    last_sync_time: "Today, 11:45 AM",
    connection_status: "connected",
    skipped_by_super_admin: false,
  });

  useEffect(() => {
    async function loadData() {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      setUserId(auth.user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, lms_status, lms_completion_pct, lms_completed_courses, lms_skipped")
        .eq("id", auth.user.id)
        .maybeSingle();

      if (profile) {
        setUserRole(profile.role || "intern");
        if (profile.lms_status) {
          const status = profile.lms_skipped ? "skipped" : (profile.lms_status as LmsStatus);
          const completedCount = profile.lms_completed_courses ?? 6;
          const pct = profile.lms_completion_pct ?? (status === "completed" || status === "skipped" ? 100 : 75);

          setLmsData((prev) => ({
            ...prev,
            student_id: auth.user.id,
            lms_status: status,
            completion_pct: pct,
            completed_courses: completedCount,
            remaining_courses: Math.max(0, prev.total_courses - completedCount),
            skipped_by_super_admin: !!profile.lms_skipped,
          }));
        }
      }

      setLoading(false);
    }
    loadData();
  }, []);

  // Sync Progress from external LMS
  const handleSyncProgress = async () => {
    setSyncing(true);
    setLmsData((prev) => ({ ...prev, connection_status: "connected" }));

    setTimeout(async () => {
      // Simulate real-time progress advance to completion if nearly finished
      setLmsData((prev) => {
        const nextCompleted = Math.min(prev.total_courses, prev.completed_courses + 1);
        const nextPct = Math.round((nextCompleted / prev.total_courses) * 100);
        const isFinished = nextPct === 100;
        const newStatus: LmsStatus = isFinished ? "completed" : "in_progress";

        if (isFinished && userId) {
          supabase
            .from("profiles")
            .update({
              lms_status: "completed",
              lms_completion_pct: 100,
              updated_at: new Date().toISOString(),
            })
            .eq("id", userId)
            .then(() => {
              setShowCompletedOverlay(true);
            });
        }

        return {
          ...prev,
          completed_courses: nextCompleted,
          remaining_courses: prev.total_courses - nextCompleted,
          completion_pct: nextPct,
          lms_status: newStatus,
          last_sync_time: "Just now",
        };
      });

      setSyncing(false);
      toast.success("Progress synchronized successfully from external LMS.");
    }, 1200);
  };

  const handleLaunchLms = () => {
    window.open("https://lms.apexlaunchpad.ai", "_blank");
  };

  const handleProceedToActivities = () => {
    toast.success("Proceeding to 7 Onboarding Activities...");
    navigate({ to: "/activities" });
  };

  // Super Admin Actions
  const handleSuperAdminSkip = async () => {
    if (userRole !== "super_admin") return;
    setLmsData((prev) => ({
      ...prev,
      lms_status: "skipped",
      completion_pct: 100,
      skipped_by_super_admin: true,
    }));
    if (userId) {
      await supabase
        .from("profiles")
        .update({ lms_status: "skipped", lms_skipped: true })
        .eq("id", userId);
    }
    toast.success("LMS learning track skipped for student by Super Admin");
  };

  const handleSuperAdminReset = async () => {
    if (userRole !== "super_admin") return;
    setLmsData((prev) => ({
      ...prev,
      lms_status: "not_started",
      completion_pct: 0,
      completed_courses: 0,
      remaining_courses: prev.total_courses,
      skipped_by_super_admin: false,
    }));
    if (userId) {
      await supabase
        .from("profiles")
        .update({ lms_status: "not_started", lms_skipped: false, lms_completion_pct: 0 })
        .eq("id", userId);
    }
    toast.success("LMS progress reset by Super Admin");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] grid place-items-center">
        <Loader2 className="size-8 animate-spin text-[#FF6B00]" />
      </div>
    );
  }

  // Badge Status Styling Map
  const getBadgeStyle = (status: LmsStatus) => {
    switch (status) {
      case "not_started":
        return "bg-gray-100 text-gray-600 border-gray-200";
      case "in_progress":
        return "bg-orange-50 text-[#FF6B00] border-orange-200";
      case "completed":
        return "bg-emerald-50 text-emerald-600 border-emerald-200";
      case "skipped":
        return "bg-blue-50 text-blue-600 border-blue-200";
    }
  };

  const isCompletedOrSkipped = lmsData.lms_status === "completed" || lmsData.lms_status === "skipped";

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col justify-between p-4 sm:p-6 md:p-10 font-sans selection:bg-[#FF6B00]/10 selection:text-[#FF6B00]">
      {/* Top Header */}
      <header className="max-w-4xl w-full mx-auto flex items-center justify-between py-2 mb-6">
        <ApexLogo size="md" />
        <span className="text-xs font-semibold uppercase tracking-wider bg-orange-50 text-[#FF6B00] px-3 py-1 rounded-full">
          Phase 5 • LMS Integration
        </span>
      </header>

      {/* Main Container */}
      <main className="max-w-3xl w-full mx-auto flex-1 flex flex-col justify-center relative">
        {/* Completion Success Screen Overlay */}
        {showCompletedOverlay || (lmsData.lms_status === "completed" && !showCompletedOverlay) ? (
          <div className="bg-white rounded-3xl p-8 sm:p-10 border border-gray-100 shadow-sm text-center space-y-5 animate-in fade-in zoom-in-95 duration-300">
            <div className="size-20 rounded-full bg-emerald-50 text-emerald-500 mx-auto flex items-center justify-center animate-bounce">
              <CheckCircle2 className="size-12" />
            </div>
            <div className="space-y-1">
              <h2 className="text-3xl font-extrabold text-gray-900">Congratulations!</h2>
              <p className="text-sm text-gray-600 max-w-md mx-auto">
                You have successfully completed the assigned LMS learning modules.
              </p>
            </div>

            <div className="pt-4">
              <button
                type="button"
                onClick={handleProceedToActivities}
                className="h-13 px-8 rounded-2xl bg-[#FF6B00] hover:bg-[#e05e00] text-white font-bold text-sm inline-flex items-center gap-2 shadow-lg shadow-[#FF6B00]/25 transition-all cursor-pointer"
              >
                <span>Continue to 7 Onboarding Activities</span>
                <ArrowRight className="size-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Title Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                <div>
                  <div className="inline-flex items-center gap-2 text-xs font-bold text-[#FF6B00] uppercase tracking-wider mb-1">
                    <BookOpen className="size-3.5" /> External Learning Portal
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                    Learning Management System
                  </h1>
                  <p className="text-sm text-gray-500 mt-1">
                    Complete your assigned learning modules before proceeding to the onboarding activities.
                  </p>
                </div>

                {/* Status Badge */}
                <div
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs font-bold capitalize self-start sm:self-auto ${getBadgeStyle(
                    lmsData.lms_status
                  )}`}
                >
                  <span className="size-2 rounded-full bg-current" />
                  <span>{lmsData.lms_status.replace("_", " ")}</span>
                </div>
              </div>

              {/* Progress Summary Card Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                {/* Circular Progress Display */}
                <div className="bg-gray-50/70 border border-gray-200 p-4 rounded-2xl flex items-center gap-4 sm:col-span-1">
                  <div className="relative size-16 shrink-0 flex items-center justify-center">
                    <svg className="size-full transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-gray-200"
                        strokeWidth="3.5"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-[#FF6B00] transition-all duration-700"
                        strokeDasharray={`${lmsData.completion_pct}, 100`}
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <span className="absolute text-xs font-extrabold text-gray-900">
                      {lmsData.completion_pct}%
                    </span>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-900">Learning Progress</div>
                    <div className="text-[11px] text-gray-500 mt-0.5">{lmsData.assigned_path}</div>
                  </div>
                </div>

                {/* Course Metrics */}
                <div className="bg-gray-50/70 border border-gray-200 p-4 rounded-2xl flex flex-col justify-center space-y-1">
                  <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                    Completed Courses
                  </div>
                  <div className="text-xl font-extrabold text-gray-900">
                    {lmsData.completed_courses} <span className="text-xs font-medium text-gray-400">/ {lmsData.total_courses}</span>
                  </div>
                  <div className="text-[11px] text-gray-500">
                    {lmsData.remaining_courses} course{lmsData.remaining_courses === 1 ? "" : "s"} remaining
                  </div>
                </div>

                {/* Sync & Connection Info */}
                <div className="bg-gray-50/70 border border-gray-200 p-4 rounded-2xl flex flex-col justify-center space-y-1">
                  <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                    Sync Status
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                    <span className="size-2 rounded-full bg-emerald-500" />
                    <span>Connected</span>
                  </div>
                  <div className="text-[11px] text-gray-500 flex items-center gap-1">
                    <Clock className="size-3" /> Last Synced: {lmsData.last_sync_time}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="button"
                  onClick={handleLaunchLms}
                  className="w-full sm:w-auto h-12 px-7 rounded-2xl bg-[#FF6B00] hover:bg-[#e05e00] text-white font-bold text-sm inline-flex items-center justify-center gap-2 shadow-md shadow-[#FF6B00]/25 transition-all cursor-pointer"
                >
                  <ExternalLink className="size-4" /> Launch LMS
                </button>

                <button
                  type="button"
                  onClick={handleSyncProgress}
                  disabled={syncing}
                  className="w-full sm:w-auto h-12 px-6 rounded-2xl bg-white border border-gray-200 text-gray-700 font-semibold text-sm inline-flex items-center justify-center gap-2 hover:bg-gray-50 transition-all cursor-pointer"
                >
                  <RefreshCw className={`size-4 text-[#FF6B00] ${syncing ? "animate-spin" : ""}`} />
                  <span>Refresh Progress</span>
                </button>

                {isCompletedOrSkipped && (
                  <button
                    type="button"
                    onClick={handleProceedToActivities}
                    className="w-full sm:w-auto ml-auto h-12 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm inline-flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                  >
                    <span>Activities</span>
                    <ArrowRight className="size-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Super Admin Override Control Banner (Visible for Super Admin) */}
            {userRole === "super_admin" && (
              <div className="bg-orange-50/60 border border-orange-200 rounded-3xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#FF6B00] uppercase tracking-wider">
                  <ShieldCheck className="size-4" /> Super Admin Controls
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSuperAdminSkip}
                    className="h-9 px-4 rounded-xl bg-white border border-orange-200 text-xs font-bold text-[#FF6B00] hover:bg-orange-100 transition-all inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <SkipForward className="size-3.5" /> Skip LMS for Student
                  </button>

                  <button
                    type="button"
                    onClick={handleSuperAdminReset}
                    className="h-9 px-4 rounded-xl bg-white border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-all inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="size-3.5" /> Reset LMS Progress
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-4xl w-full mx-auto text-center py-4 text-xs text-gray-400 mt-6">
        © APEX AI Launchpad • LMS Integration Interface
      </footer>
    </div>
  );
}
