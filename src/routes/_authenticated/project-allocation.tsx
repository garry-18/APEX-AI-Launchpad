import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Clock,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  LogOut,
  ArrowRight,
  Briefcase,
  UserCheck,
  Mail,
  Phone,
  Calendar,
  Layers,
  Check,
  ShieldCheck,
  Search,
  SlidersHorizontal,
  Loader2,
  AlertCircle,
  PartyPopper,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { ApexLogo } from "@/components/ApexLogo";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/project-allocation")({
  head: () => ({ meta: [{ title: "Project Allocation — APEX AI" }] }),
  component: ProjectAllocationPage,
});

export interface AllocationDetails {
  allocated: boolean;
  problem_statement_id?: string;
  problem_statement_title?: string;
  problem_description?: string;
  domain?: string;
  assigned_admin_name?: string;
  assigned_admin_email?: string;
  assigned_admin_contact?: string;
  internship_start_date?: string;
  expected_duration?: string;
  allocation_date?: string;
}

export const SAMPLE_PROBLEM_STATEMENTS = [
  {
    id: "ps_01",
    title: "AI-Powered Financial Portfolio Optimizer",
    domain: "AI & Data Science",
    description: "Develop an automated portfolio rebalancing system using predictive AI algorithms, real-time stock feeds, and risk management heuristics.",
    assigned_admin_name: "Sarah Jenkins",
    assigned_admin_email: "sarah.jenkins@apexlaunchpad.ai",
    assigned_admin_contact: "+91 9876543210",
  },
  {
    id: "ps_02",
    title: "Automated Code Reviewer & Vulnerability Scanner",
    domain: "Full-Stack & Security",
    description: "Build a GitHub action integration that analyzes PR diffs, flags security flaws using static analysis, and suggests code refactoring via LLMs.",
    assigned_admin_name: "David Chen",
    assigned_admin_email: "david.chen@apexlaunchpad.ai",
    assigned_admin_contact: "+91 9876543211",
  },
  {
    id: "ps_03",
    title: "Generative AI Customer Personalization Engine",
    domain: "Web & AI Engineering",
    description: "Create an adaptive UI component library that personalizes marketing layouts dynamically based on visitor browsing history and embeddings.",
    assigned_admin_name: "Elena Rostova",
    assigned_admin_email: "elena.rostova@apexlaunchpad.ai",
    assigned_admin_contact: "+91 9876543212",
  },
];

function ProjectAllocationPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>("intern");

  // Allocation State
  const [allocation, setAllocation] = useState<AllocationDetails>({
    allocated: false,
    problem_statement_title: "AI-Powered Financial Portfolio Optimizer",
    problem_description: "Develop an automated portfolio rebalancing system using predictive AI algorithms, real-time stock feeds, and risk management heuristics.",
    domain: "AI & Data Science",
    assigned_admin_name: "Sarah Jenkins",
    assigned_admin_email: "sarah.jenkins@apexlaunchpad.ai",
    assigned_admin_contact: "+91 9876543210",
    internship_start_date: "August 1, 2026",
    expected_duration: "3 Months (Full-Time)",
    allocation_date: "Today",
  });

  // Super Admin Management Modal State
  const [showSuperAdminModal, setShowSuperAdminModal] = useState(false);
  const [selectedPsId, setSelectedPsId] = useState(SAMPLE_PROBLEM_STATEMENTS[0].id);
  const [processingAssign, setProcessingAssign] = useState(false);

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
          // If onboarding is already marked completed, bypass waiting screen and route to dashboard
          navigate({ to: "/dashboard", replace: true });
          return;
        }

        if (profile.problem_statement) {
          const matchingPs = SAMPLE_PROBLEM_STATEMENTS.find(
            (p) => p.title.toLowerCase() === profile.problem_statement?.toLowerCase()
          ) || SAMPLE_PROBLEM_STATEMENTS[0];

          setAllocation({
            allocated: true,
            problem_statement_id: matchingPs.id,
            problem_statement_title: profile.problem_statement,
            problem_description: matchingPs.description,
            domain: matchingPs.domain,
            assigned_admin_name: profile.assigned_admin || matchingPs.assigned_admin_name,
            assigned_admin_email: matchingPs.assigned_admin_email,
            assigned_admin_contact: matchingPs.assigned_admin_contact,
            internship_start_date: "August 1, 2026",
            expected_duration: "3 Months",
            allocation_date: "Today",
          });
        }
      }

      setLoading(false);
    }

    loadData();
  }, [navigate]);

  const handleRefreshStatus = async () => {
    setRefreshing(true);
    setTimeout(async () => {
      if (userId) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("problem_statement, assigned_admin")
          .eq("id", userId)
          .maybeSingle();

        if (profile?.problem_statement) {
          setAllocation((prev) => ({
            ...prev,
            allocated: true,
            problem_statement_title: profile.problem_statement,
            assigned_admin_name: profile.assigned_admin || prev.assigned_admin_name,
          }));
          toast.success("Congratulations! Your Problem Statement has been allocated.");
        } else {
          toast.info("Status Refreshed: Profile still under review by Super Admin.");
        }
      }
      setRefreshing(false);
    }, 800);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };

  // Final Action: Complete Onboarding & Enter Internship Dashboard
  const handleEnterInternshipDashboard = async () => {
    if (userId) {
      // Update permanent DB flags
      await supabase
        .from("profiles")
        .update({
          onboarding_completed: true,
          internship_started: true,
          first_login_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);
    }

    toast.success("Welcome to your APEX Internship Dashboard!");
    navigate({ to: "/dashboard", replace: true });
  };

  // Super Admin Action: Assign Problem Statement and auto-assign linked Admin
  const handleSuperAdminAssign = async () => {
    const ps = SAMPLE_PROBLEM_STATEMENTS.find((p) => p.id === selectedPsId) || SAMPLE_PROBLEM_STATEMENTS[0];
    setProcessingAssign(true);

    setTimeout(async () => {
      setProcessingAssign(false);
      setShowSuperAdminModal(false);

      setAllocation({
        allocated: true,
        problem_statement_id: ps.id,
        problem_statement_title: ps.title,
        problem_description: ps.description,
        domain: ps.domain,
        assigned_admin_name: ps.assigned_admin_name,
        assigned_admin_email: ps.assigned_admin_email,
        assigned_admin_contact: ps.assigned_admin_contact,
        internship_start_date: "August 1, 2026",
        expected_duration: "3 Months",
        allocation_date: "Today",
      });

      if (userId) {
        await supabase
          .from("profiles")
          .update({
            problem_statement: ps.title,
            assigned_admin: ps.assigned_admin_name,
          })
          .eq("id", userId);
      }

      toast.success(`Allocated '${ps.title}' & automatically assigned ${ps.assigned_admin_name}! Email sent.`);
    }, 1000);
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
      {/* Header */}
      <header className="max-w-5xl w-full mx-auto flex items-center justify-between py-2 mb-6">
        <ApexLogo size="md" />
        <span className="text-xs font-semibold uppercase tracking-wider bg-orange-50 text-[#FF6B00] px-3.5 py-1 rounded-full">
          Final Step • Project Allocation
        </span>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl w-full mx-auto flex-1 flex flex-col justify-center relative">
        {/* CASE A: ALLOCATED CONGRATULATIONS & DASHBOARD ENTRY */}
        {allocation.allocated ? (
          <div className="space-y-6">
            {/* Congratulations Banner Card */}
            <div className="bg-white rounded-3xl p-8 sm:p-10 border border-gray-100 shadow-sm text-center space-y-5 animate-in fade-in zoom-in-95 duration-300">
              <div className="size-20 rounded-full bg-emerald-50 text-emerald-500 mx-auto flex items-center justify-center animate-bounce">
                <PartyPopper className="size-10" />
              </div>
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600 px-3.5 py-1 rounded-md">
                  Selection Complete
                </span>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
                  Congratulations! You Have Been Selected
                </h1>
                <p className="text-sm text-gray-600 max-w-xl mx-auto leading-relaxed">
                  You have successfully completed the Apex AI Launchpad onboarding process. Your assigned Problem Statement and dedicated Admin details are below.
                </p>
              </div>

              {/* Assigned Project Details Card */}
              <div className="bg-gray-50/80 border border-gray-200 rounded-3xl p-6 text-left max-w-3xl mx-auto space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200 pb-3">
                  <div>
                    <span className="text-[11px] font-bold text-[#FF6B00] uppercase tracking-wider bg-orange-50 px-2.5 py-1 rounded-md">
                      {allocation.domain}
                    </span>
                    <h3 className="text-xl font-bold text-gray-900 mt-2">{allocation.problem_statement_title}</h3>
                  </div>
                </div>

                <p className="text-xs text-gray-600 leading-relaxed">{allocation.problem_description}</p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-gray-200 text-xs">
                  <div>
                    <span className="text-gray-400 font-medium block">Assigned Admin / Mentor</span>
                    <p className="font-bold text-gray-900 flex items-center gap-1.5 mt-0.5">
                      <UserCheck className="size-4 text-[#FF6B00]" /> {allocation.assigned_admin_name}
                    </p>
                    <p className="text-[11px] text-gray-500">{allocation.assigned_admin_email}</p>
                  </div>

                  <div>
                    <span className="text-gray-400 font-medium block">Internship Start Date</span>
                    <p className="font-bold text-gray-900 flex items-center gap-1.5 mt-0.5">
                      <Calendar className="size-4 text-[#FF6B00]" /> {allocation.internship_start_date}
                    </p>
                  </div>

                  <div>
                    <span className="text-gray-400 font-medium block">Expected Duration</span>
                    <p className="font-bold text-gray-900 flex items-center gap-1.5 mt-0.5">
                      <Clock className="size-4 text-[#FF6B00]" /> {allocation.expected_duration}
                    </p>
                  </div>
                </div>
              </div>

              {/* Enter Internship Dashboard CTA */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={handleEnterInternshipDashboard}
                  className="w-full sm:w-auto h-13 px-8 rounded-2xl bg-[#FF6B00] hover:bg-[#e05e00] active:bg-[#c95400] text-white font-bold text-sm inline-flex items-center justify-center gap-3 shadow-lg shadow-[#FF6B00]/25 hover:shadow-xl transition-all transform hover:-translate-y-0.5 cursor-pointer"
                >
                  <span>Go to Internship Dashboard</span>
                  <ArrowRight className="size-4" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* CASE B: WAITING FOR PROJECT ALLOCATION SCREEN */
          <div className="space-y-6">
            {/* Header & Status Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
                <div>
                  <div className="inline-flex items-center gap-2 text-xs font-bold text-[#FF6B00] uppercase tracking-wider mb-1">
                    <Clock className="size-3.5 animate-spin" /> Final Review In Progress
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                    Project Allocation
                  </h1>
                  <p className="text-sm text-gray-500 mt-1">
                    Your onboarding has been completed successfully. Your profile is currently under review by the Super Admin.
                  </p>
                </div>

                <div className="flex items-center gap-2 bg-amber-50 text-amber-700 border border-amber-200 px-4 py-2 rounded-2xl text-xs font-bold self-start sm:self-auto">
                  <span className="size-2 rounded-full bg-amber-500 animate-ping" />
                  <span>Waiting for Project Allocation</span>
                </div>
              </div>

              {/* Progress Timeline (100% Onboarding Finished) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                  <span>Onboarding Roadmap</span>
                  <span className="text-[#FF6B00]">100% Completed</span>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 text-center text-[10px] font-bold text-gray-500">
                  <div className="bg-emerald-50 text-emerald-600 p-2 rounded-xl border border-emerald-200">✓ Profile</div>
                  <div className="bg-emerald-50 text-emerald-600 p-2 rounded-xl border border-emerald-200">✓ Questionnaire</div>
                  <div className="bg-emerald-50 text-emerald-600 p-2 rounded-xl border border-emerald-200">✓ LMS</div>
                  <div className="bg-emerald-50 text-emerald-600 p-2 rounded-xl border border-emerald-200">✓ Activities</div>
                  <div className="bg-emerald-50 text-emerald-600 p-2 rounded-xl border border-emerald-200">✓ Interview</div>
                  <div className="bg-amber-50 text-amber-700 p-2 rounded-xl border border-amber-200 ring-2 ring-amber-500/20">● Allocation</div>
                  <div className="bg-gray-100 text-gray-400 p-2 rounded-xl border border-gray-200">○ Dashboard</div>
                </div>
              </div>
            </div>

            {/* Information Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <AlertCircle className="size-5 text-[#FF6B00]" /> What Happens Next?
              </h3>

              <div className="bg-orange-50/60 border border-orange-200 rounded-2xl p-5 space-y-2 text-xs text-gray-700 leading-relaxed">
                <p>• Your 1-to-1 interview and 7 onboarding activities have been verified.</p>
                <p>• The Super Admin is reviewing your profile to pair you with a matching Problem Statement and dedicated Admin.</p>
                <p>• You will receive a <strong>Project Allocation Email</strong> as soon as your assignment is finalized.</p>
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleRefreshStatus}
                  disabled={refreshing}
                  className="h-11 px-6 rounded-2xl bg-[#FF6B00] hover:bg-[#e05e00] text-white font-bold text-xs inline-flex items-center gap-2 shadow-md shadow-[#FF6B00]/25 transition-all cursor-pointer"
                >
                  <RefreshCw className={`size-3.5 ${refreshing ? "animate-spin" : ""}`} />
                  <span>Refresh Status</span>
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="h-11 px-5 rounded-2xl border border-gray-200 text-gray-600 font-semibold text-xs hover:bg-gray-50 transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  <LogOut className="size-3.5" /> Logout
                </button>
              </div>
            </div>

            {/* Super Admin Control Panel (Visible for Super Admin) */}
            {userRole === "super_admin" && (
              <div className="bg-white rounded-3xl p-6 border border-orange-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#FF6B00] uppercase tracking-wider">
                    <ShieldCheck className="size-4" /> Super Admin Allocation Controls
                  </div>
                </div>

                <p className="text-xs text-gray-600">
                  Select a Problem Statement to automatically assign the linked Admin and issue the Project Allocation Email.
                </p>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowSuperAdminModal(true)}
                    className="h-11 px-6 rounded-2xl bg-[#FF6B00] hover:bg-[#e05e00] text-white font-bold text-xs inline-flex items-center gap-2 shadow-md shadow-[#FF6B00]/25 transition-all cursor-pointer"
                  >
                    <Sparkles className="size-4" /> Assign Problem Statement & Admin
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Super Admin Assignment Modal */}
        {showSuperAdminModal && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-gray-100 space-y-5 animate-in fade-in zoom-in-95 duration-200">
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-gray-900">Assign Problem Statement</h3>
                <p className="text-xs text-gray-500">
                  Selecting a Problem Statement will automatically assign its linked Admin and issue the Project Allocation Email.
                </p>
              </div>

              <div className="space-y-3">
                {SAMPLE_PROBLEM_STATEMENTS.map((ps) => {
                  const isSelected = selectedPsId === ps.id;
                  return (
                    <button
                      key={ps.id}
                      type="button"
                      onClick={() => setSelectedPsId(ps.id)}
                      className={`w-full text-left p-4 rounded-2xl border text-xs transition-all space-y-1.5 cursor-pointer ${
                        isSelected
                          ? "bg-orange-50/70 border-[#FF6B00] ring-2 ring-[#FF6B00]/10"
                          : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold text-gray-900">
                        <span>{ps.title}</span>
                        <span className="text-[10px] text-[#FF6B00] uppercase font-bold bg-orange-100 px-2 py-0.5 rounded-md">
                          {ps.domain}
                        </span>
                      </div>
                      <p className="text-gray-600 leading-relaxed text-[11px]">{ps.description}</p>
                      <div className="text-[11px] font-semibold text-gray-700 pt-1 flex items-center gap-1">
                        <UserCheck className="size-3.5 text-[#FF6B00]" /> Linked Admin: <strong>{ps.assigned_admin_name}</strong>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowSuperAdminModal(false)}
                  className="h-11 px-5 rounded-2xl border border-gray-200 text-gray-700 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSuperAdminAssign}
                  disabled={processingAssign}
                  className="h-11 px-6 rounded-2xl bg-[#FF6B00] hover:bg-[#e05e00] text-white font-bold text-xs inline-flex items-center gap-2 shadow-md shadow-[#FF6B00]/25 transition-all cursor-pointer"
                >
                  {processingAssign ? <Loader2 className="size-4 animate-spin" /> : "Confirm & Send Email"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-5xl w-full mx-auto text-center py-4 text-xs text-gray-400 mt-6">
        © APEX AI Launchpad • Project Allocation Gateway
      </footer>
    </div>
  );
}
