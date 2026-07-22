import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import {
  Sparkles,
  CheckCircle2,
  Clock,
  ExternalLink,
  Send,
  AlertCircle,
  XCircle,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  Loader2,
  Check,
  X,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { ApexLogo } from "@/components/ApexLogo";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/activities")({
  head: () => ({ meta: [{ title: "Onboarding Activities — APEX AI" }] }),
  component: ActivitiesPage,
});

export type ActivityStatus =
  | "pending"
  | "submitted"
  | "approved"
  | "rejected"
  | "skipped";

export interface ActivityDefinition {
  id: number;
  title: string;
  description: string;
  objective: string;
  instructions: string[];
}

export const MANDATORY_ACTIVITIES: ActivityDefinition[] = [
  {
    id: 1,
    title: "1. LinkedIn Profile Optimization",
    description: "Optimize your LinkedIn profile using online resources and best practices.",
    objective: "Craft a professional headline, summary, featured items, and banner that showcase your tech focus.",
    instructions: [
      "Update your professional headline to specify your primary stack/domain.",
      "Write a compelling 'About' section featuring your skills and career aspirations.",
      "Add featured project links, GitHub profiles, and certifications."
    ],
  },
  {
    id: 2,
    title: "2. Research using NotebookLM",
    description: "Choose a topic and conduct research using NotebookLM.",
    objective: "Leverage NotebookLM to synthesize key insights, generate FAQs, and extract structured notes.",
    instructions: [
      "Select a technical or domain-specific research topic.",
      "Upload source documents, PDFs, or tech articles into NotebookLM.",
      "Generate an audio overview or structured briefing doc."
    ],
  },
  {
    id: 3,
    title: "3. AI Blog",
    description: "Create a humanized AI-assisted blog based on your research topic.",
    objective: "Draft an engaging technical article using AI assistants, ensuring human tone and clarity.",
    instructions: [
      "Draft a 600+ word blog based on your NotebookLM research.",
      "Refine prompts to ensure humanized tone, avoiding generic AI clichés.",
      "Include code snippets, diagrams, or key takeaways."
    ],
  },
  {
    id: 4,
    title: "4. Mind Map",
    description: "Create a visual mind map of your research topic using AI tools.",
    objective: "Use visualization platforms (e.g. GitMind, Whimsical, Edraw) to structure your research nodes.",
    instructions: [
      "Map out primary, secondary, and tertiary concepts visually.",
      "Identify connections between tech nodes.",
      "Export mind map as PNG/SVG and save it."
    ],
  },
  {
    id: 5,
    title: "5. Infographic",
    description: "Build a structured technical infographic outlining your key research.",
    objective: "Develop a summary visual highlighting key metrics and flow steps.",
    instructions: [
      "Use design templates (Canva, Visme, Adobe Express).",
      "Structure sections with headers, metrics, icons, and summaries.",
      "Export visual and store it in your dossier."
    ],
  },
  {
    id: 6,
    title: "6. AI Presentation",
    description: "Create an AI-assisted presentation deck on your topic.",
    objective: "Generate a clean, structured pitch deck using AI tools (Gamma App, Tome, PowerPoint).",
    instructions: [
      "Format a 5-8 slide technical presentation.",
      "Synthesize highlights from your research blog and infographics.",
      "Export slide deck to PDF/PPT."
    ],
  },
  {
    id: 7,
    title: "7. Technical Documentation Dossier",
    description: "Compile all the above deliverables into a structured repository or folder.",
    objective: "Organize your optimized LinkedIn profile snapshot, research notes, technical blog, mind map, infographic, and presentation slide deck.",
    instructions: [
      "Create a public Google Drive folder containing all 7 deliverables.",
      "Set general folder access permission to 'Anyone with the link can view'.",
      "Submit this single folder link below."
    ],
  },
];

function ActivitiesPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>("intern");

  // Single Dossier Submission States
  const [dossierLink, setDossierLink] = useState("");
  const [dossierStatus, setDossierStatus] = useState<ActivityStatus>("pending");
  const [adminFeedback, setAdminFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<ActivityDefinition | null>(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  useEffect(() => {
    async function loadData() {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      setUserId(auth.user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, activity_submissions, onboarding_completed")
        .eq("id", auth.user.id)
        .maybeSingle();

      if (profile) {
        setUserRole(profile.role || "intern");
        const submissions = profile.activity_submissions || {};
        // Retrieve dossier link from activity_id 7 (Dossier Submission)
        const dossierRecord = submissions[7];
        if (dossierRecord) {
          setDossierLink(dossierRecord.drive_link || "");
          setDossierStatus(dossierRecord.status || "pending");
          setAdminFeedback(dossierRecord.feedback || "");

          if (dossierRecord.status === "approved" || dossierRecord.status === "skipped") {
            setShowCompletionModal(true);
          }
        }
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const isValidDriveUrl = (url: string) => {
    if (!url || !url.trim()) return false;
    const trimmed = url.trim().toLowerCase();
    return (
      trimmed.startsWith("https://drive.google.com/") ||
      trimmed.startsWith("http://drive.google.com/") ||
      trimmed.startsWith("https://docs.google.com/")
    );
  };

  const handleSaveDraft = async () => {
    if (!userId) return;
    // Save dossier link to activity_id 7 as draft
    const newRecords = {
      7: {
        activity_id: 7,
        drive_link: dossierLink.trim(),
        status: dossierStatus === "submitted" ? "submitted" : "in_progress",
      }
    };

    await supabase
      .from("profiles")
      .update({ activity_submissions: newRecords })
      .eq("id", userId);

    toast.success("Dossier draft saved successfully!");
  };

  const handleSubmitDossier = async () => {
    if (!isValidDriveUrl(dossierLink)) {
      return toast.error("Please enter a valid, public Google Drive link (https://drive.google.com/...)");
    }

    setSubmitting(true);
    try {
      // Map dossier submission to all activities internally
      const newRecords: Record<number, any> = {};
      MANDATORY_ACTIVITIES.forEach((act) => {
        newRecords[act.id] = {
          activity_id: act.id,
          drive_link: dossierLink.trim(),
          status: "submitted",
          submitted_at: new Date().toISOString(),
        };
      });

      setDossierStatus("submitted");

      if (userId) {
        await supabase
          .from("profiles")
          .update({ activity_submissions: newRecords })
          .eq("id", userId);
      }

      toast.success("Dossier submitted successfully for review!");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit dossier");
    } finally {
      setSubmitting(false);
    }
  };

  // Super Admin Overrides
  const handleSuperAdminApproveAll = async () => {
    if (userRole !== "super_admin") return;
    const newRecords: Record<number, any> = {};
    MANDATORY_ACTIVITIES.forEach((act) => {
      newRecords[act.id] = {
        activity_id: act.id,
        drive_link: dossierLink || "https://drive.google.com/file/d/sample-dossier",
        status: "approved",
        approved_at: new Date().toISOString(),
      };
    });
    setDossierStatus("approved");

    if (userId) {
      await supabase
        .from("profiles")
        .update({
          activity_submissions: newRecords,
        })
        .eq("id", userId);
    }
    toast.success("All activities approved by Super Admin!");
    setShowCompletionModal(true);
  };

  const handleSuperAdminSkipAll = async () => {
    if (userRole !== "super_admin") return;
    const newRecords: Record<number, any> = {};
    MANDATORY_ACTIVITIES.forEach((act) => {
      newRecords[act.id] = {
        activity_id: act.id,
        drive_link: dossierLink || "",
        status: "skipped",
      };
    });
    setDossierStatus("skipped");

    if (userId) {
      await supabase
        .from("profiles")
        .update({
          activity_submissions: newRecords,
        })
        .eq("id", userId);
    }
    toast.success("Activities skipped by Super Admin!");
    setShowCompletionModal(true);
  };

  const handleProceedToInterview = () => {
    toast.success("Proceeding to 1-to-1 Interaction Stage...");
    navigate({ to: "/interaction" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] grid place-items-center">
        <Loader2 className="size-8 animate-spin text-[#FF6B00]" />
      </div>
    );
  }

  const getStatusBadge = (status: ActivityStatus) => {
    switch (status) {
      case "pending":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200">Pending Submission</span>;
      case "submitted":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-600 border border-blue-200">Dossier Submitted</span>;
      case "approved":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">Approved</span>;
      case "rejected":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-600 border border-red-200">Rejected / Action Needed</span>;
      case "skipped":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-600 border border-purple-200">Skipped</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col justify-between p-4 sm:p-6 md:p-10 font-sans selection:bg-[#FF6B00]/10 selection:text-[#FF6B00]">
      <header className="max-w-5xl w-full mx-auto flex items-center justify-between py-2 mb-6">
        <ApexLogo size="md" />
        <span className="text-xs font-semibold uppercase tracking-wider bg-orange-50 text-[#FF6B00] px-3.5 py-1 rounded-full">
          Phase 6 • Onboarding Activities
        </span>
      </header>

      <main className="max-w-5xl w-full mx-auto flex-1 flex flex-col justify-center relative">
        {showCompletionModal && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl border border-gray-100 text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
              <div className="size-20 rounded-full bg-emerald-50 text-emerald-500 mx-auto flex items-center justify-center animate-bounce">
                <CheckCircle2 className="size-12" />
              </div>
              <div className="space-y-1">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Congratulations!</h2>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Your onboarding activities dossier has been approved. You are ready for the 1-to-1 Interaction.
                </p>
              </div>
              <div className="pt-4">
                <button
                  type="button"
                  onClick={handleProceedToInterview}
                  className="h-13 px-8 rounded-2xl bg-[#FF6B00] hover:bg-[#e05e00] text-white font-bold text-sm inline-flex items-center gap-2 shadow-lg shadow-[#FF6B00]/25 transition-all cursor-pointer"
                >
                  <span>Proceed to 1-to-1 Interaction</span>
                  <ArrowRight className="size-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {selectedActivity && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 space-y-5 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <h3 className="text-xl font-bold text-gray-900">{selectedActivity.title}</h3>
                <button
                  onClick={() => setSelectedActivity(null)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                >
                  <X className="size-5" />
                </button>
              </div>
              <div className="space-y-4 text-xs text-gray-700">
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">Objective</h4>
                  <p className="text-gray-600 leading-relaxed">{selectedActivity.objective}</p>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">Instructions</h4>
                  <ul className="list-disc pl-4 space-y-1 text-gray-600">
                    {selectedActivity.instructions.map((inst, idx) => (
                      <li key={idx}>{inst}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="pt-4 border-t border-gray-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedActivity(null)}
                  className="h-11 px-6 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold text-xs transition-all cursor-pointer"
                >
                  Close Instructions
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-bold text-[#FF6B00] uppercase tracking-wider mb-1">
                  <Sparkles className="size-3.5" /> Practical Onboarding Roadmap
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                  7 Onboarding Activities
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Complete all 7 mandatory activities externally, save your work in a single Google Drive folder, and submit the folder link below.
                </p>
              </div>
              <div className="shrink-0">{getStatusBadge(dossierStatus)}</div>
            </div>

            {dossierStatus === "rejected" && adminFeedback && (
              <div className="bg-red-50/70 border border-red-200 rounded-2xl p-4 text-xs space-y-1">
                <div className="font-bold text-red-700">Admin Rejection Feedback:</div>
                <p className="text-red-600 leading-relaxed">{adminFeedback}</p>
              </div>
            )}

            {/* Central Dossier Submission Box */}
            <div className="bg-orange-50/20 border border-orange-100 rounded-3xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-gray-900">Submit Onboarding Dossier Google Drive Link</h3>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <input
                  type="url"
                  value={dossierLink}
                  disabled={dossierStatus === "approved" || dossierStatus === "skipped"}
                  onChange={(e) => setDossierLink(e.target.value)}
                  placeholder="Paste shared public Google Drive Folder URL containing all 7 deliverables..."
                  className="w-full h-11 rounded-2xl bg-white border border-gray-200 px-4 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#FF6B00] focus:ring-4 focus:ring-[#FF6B00]/10 transition-all disabled:opacity-60"
                />
                <div className="flex items-center gap-2 shrink-0">
                  {dossierLink && isValidDriveUrl(dossierLink) && (
                    <a
                      href={dossierLink}
                      target="_blank"
                      rel="noreferrer"
                      className="h-11 px-4 rounded-2xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold text-xs inline-flex items-center gap-1.5 transition-all"
                    >
                      <ExternalLink className="size-3.5" /> Open Folder
                    </a>
                  )}
                  {dossierStatus !== "approved" && dossierStatus !== "skipped" && (
                    <>
                      <button
                        type="button"
                        onClick={handleSaveDraft}
                        className="h-11 px-4 rounded-2xl bg-white border border-gray-200 text-gray-600 font-semibold text-xs hover:bg-gray-50 transition-all cursor-pointer"
                      >
                        Save Draft
                      </button>
                      <button
                        type="button"
                        onClick={handleSubmitDossier}
                        disabled={submitting}
                        className="h-11 px-5 rounded-2xl bg-[#FF6B00] hover:bg-[#e05e00] text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-md shadow-[#FF6B00]/20 transition-all cursor-pointer"
                      >
                        {submitting ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Send className="size-3.5" />
                        )}
                        <span>{dossierStatus === "rejected" ? "Resubmit Dossier" : "Submit Dossier"}</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
              {dossierLink && !isValidDriveUrl(dossierLink) && (
                <p className="text-[11px] text-red-500 flex items-center gap-1">
                  <AlertCircle className="size-3" /> Folder URL must begin with https://drive.google.com/ or https://docs.google.com/
                </p>
              )}
            </div>
          </div>

          {/* Activities Checklist List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {MANDATORY_ACTIVITIES.map((act) => (
              <div key={act.id} className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-gray-900">{act.title}</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">{act.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedActivity(act)}
                  className="h-9 px-4 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold text-xs inline-flex items-center gap-1.5 border border-gray-200 transition-all self-start cursor-pointer"
                >
                  <Info className="size-3.5" /> View Instructions
                </button>
              </div>
            ))}
          </div>

          {userRole === "super_admin" && (
            <div className="bg-orange-50/60 border border-orange-200 rounded-3xl p-6 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[#FF6B00] uppercase tracking-wider">
                <ShieldCheck className="size-4" /> Super Admin Override Panel
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleSuperAdminApproveAll}
                  className="h-10 px-5 rounded-2xl bg-[#FF6B00] text-white font-bold text-xs shadow-md shadow-[#FF6B00]/20 hover:bg-[#e05e00] transition-all inline-flex items-center gap-1.5 cursor-pointer"
                >
                  Approve Dossier
                </button>
                <button
                  type="button"
                  onClick={handleSuperAdminSkipAll}
                  className="h-10 px-5 rounded-2xl bg-white border border-orange-200 text-xs font-bold text-[#FF6B00] hover:bg-orange-100 transition-all inline-flex items-center gap-1.5 cursor-pointer"
                >
                  Skip Activities Stage
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="max-w-5xl w-full mx-auto text-center py-4 text-xs text-gray-400 mt-6">
        © APEX AI Launchpad • Onboarding Activities Module
      </footer>
    </div>
  );
}
