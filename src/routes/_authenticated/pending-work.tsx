import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Briefcase,
  Upload,
  Link as LinkIcon,
  FolderOpen,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  ChevronLeft,
  Search,
  Filter,
  Eye,
  Trash2,
  ArrowRight,
  ExternalLink,
  Plus,
  FileUp,
  X,
  Building,
  MapPin,
  Calendar,
  User as UserIcon,
  SlidersHorizontal,
  FolderDot,
  History,
  MessageSquare,
  Send,
  Loader2,
  Download,
  AlertTriangle,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useMyProfile } from "@/hooks/use-current-user";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { fetchUserRole, Role } from "@/lib/roles";

export const Route = createFileRoute("/_authenticated/pending-work")({
  head: () => ({
    meta: [
      { title: "Pending Work — APEX AI Launchpad" },
      {
        name: "description",
        content: "Submit work for problem statements or review submissions.",
      },
    ],
  }),
  component: PendingWorkPage,
});

// UI Constants matching database definitions
const PROBLEM_STATEMENTS = [
  { id: "asg-ecosystem", name: "ASG Ecosystem", category: "Core Platform", desc: "Build integration layers and telemetry for ASG cloud resources." },
  { id: "career-intelligence", name: "Career Intelligence Platform", category: "EdTech", desc: "Analyze student profiles and resume data to recommend tailored learning paths." },
  { id: "digital-economy", name: "Digital Economy", category: "Finance", desc: "Define transaction rules and token metrics for peer-to-peer micro-economies." },
  { id: "energy-distribution", name: "Energy as Distribution", category: "Infrastructure", desc: "Design load balancing algorithms for distributed off-grid solar grids." },
  { id: "events-industry", name: "Events Industry", category: "Media & Entertainment", desc: "Optimize virtual attendee engagement via hybrid matchmaking systems." },
  { id: "gaming", name: "Gaming", category: "Consumer", desc: "Implement real-time multiplayer lobbies and anti-cheat web hooks." },
  { id: "horeca", name: "HoReCa", category: "Services", desc: "Automate kitchen display routing and inventory prediction models." },
  { id: "kids-sector", name: "Kids Sector", category: "EdTech & Toys", desc: "Create child-safe interactive content streams and screen-time widgets." },
  { id: "mobility", name: "Mobility", category: "Transportation", desc: "Develop routing engines for multi-modal urban transit networks." },
  { id: "social-work-sustainability", name: "Social Work and Sustainability", category: "Non-profit", desc: "Track community impact metrics and carbon credit ledger entries." },
  { id: "sports-fitness", name: "Sports and Fitness", category: "Health", desc: "Design heart-rate zoning overlays and leaderboard systems." },
  { id: "temple-economy", name: "Temple Economy", category: "Culture", desc: "Digitize donation flows, prasad logistics, and queue trackers." }
];

interface DBActivity {
  id: string;
  student_id: string;
  problem_statement_id: string;
  assigned_admin_id: string | null;
  title: string;
  description: string;
  category: string;
  submission_type: string;
  file_url: string | null;
  external_link: string | null;
  remarks: string | null;
  status: 'Draft' | 'Pending' | 'Submitted' | 'Viewed' | 'Under Review' | 'Changes Requested' | 'Resubmitted' | 'Approved' | 'Rejected';
  is_draft: boolean;
  submitted_at: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  profiles?: {
    full_name: string;
    college: string | null;
    city: string | null;
  };
  problem_statements?: {
    name: string;
  };
}

interface DBHistory {
  id: string;
  activity_id: string;
  action: string;
  performed_by: string;
  previous_status: string | null;
  new_status: string | null;
  created_at: string;
  profiles?: {
    full_name: string;
    role: string;
  };
}

interface DBComment {
  id: string;
  activity_id: string;
  sender_id: string;
  message: string;
  attachment_url: string | null;
  created_at: string;
  profiles?: {
    full_name: string;
    role: string;
  };
}

function PendingWorkPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("intern");
  const { data: profile } = useMyProfile();

  // Navigation states
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<DBActivity | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        fetchUserRole(data.user.id).then((r) => setRole(r || "intern"));
      }
    });
  }, []);

  const activeWorkspace = useMemo(() => {
    return PROBLEM_STATEMENTS.find((p) => p.id === activeWorkspaceId);
  }, [activeWorkspaceId]);

  return (
    <AppShell>
      <div className="space-y-6 animate-in fade-in-50 duration-300">
        {role === "admin" || role === "super_admin" ? (
          selectedActivity ? (
            <ActivityDetailsView
              activity={selectedActivity}
              callerRole={role}
              userId={profile?.id ?? ""}
              onBack={() => setSelectedActivity(null)}
            />
          ) : (
            <AdminReviewSubmissionsView
              role={role}
              onSelectActivity={(act) => setSelectedActivity(act)}
            />
          )
        ) : activeWorkspace ? (
          selectedActivity ? (
            <ActivityDetailsView
              activity={selectedActivity}
              callerRole={role}
              userId={profile?.id ?? ""}
              onBack={() => {
                setSelectedActivity(null);
                setIsEditing(false);
              }}
              onEdit={() => setIsEditing(true)}
            />
          ) : isCreating || isEditing ? (
            <ActivityFormView
              workspace={activeWorkspace}
              activity={selectedActivity}
              userId={profile?.id ?? ""}
              onBack={() => {
                setIsCreating(false);
                setIsEditing(false);
              }}
            />
          ) : (
            <InternWorkspaceView
              workspace={activeWorkspace}
              onBack={() => setActiveWorkspaceId(null)}
              onCreateActivity={() => setIsCreating(true)}
              onSelectActivity={(act) => setSelectedActivity(act)}
            />
          )
        ) : (
          <InternDashboardView
            onOpenWorkspace={(id) => setActiveWorkspaceId(id)}
            onBack={() => window.history.back()}
          />
        )}
      </div>
    </AppShell>
  );
}

// -------------------------------------------------------------
// LANDING PAGE (INTERN)
// -------------------------------------------------------------
function InternDashboardView({
  onOpenWorkspace,
  onBack,
}: {
  onOpenWorkspace: (id: string) => void;
  onBack: () => void;
}) {
  return (
    <div className="space-y-8 animate-in fade-in-50 duration-300 font-sans">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-xl border border-border bg-surface text-xs font-semibold hover:bg-surface-2 transition flex items-center gap-1.5 cursor-pointer"
        >
          <ChevronLeft className="size-4" /> Back
        </button>
      </div>

      <header>
        <h2 className="text-3xl font-bold tracking-tight">Pending Work</h2>
        <p className="text-muted-foreground mt-2">
          Select a problem statement workspace to submit your research and deliverables.
        </p>
      </header>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3 font-sans">
        {PROBLEM_STATEMENTS.map((p, idx) => {
          return (
            <div
              key={p.id}
              className="card-surface p-6 flex flex-col justify-between group hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-brand-orange-gradient opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] uppercase tracking-wider font-semibold px-2.5 py-1 rounded-full bg-accent text-accent-foreground">
                    {p.category}
                  </span>
                  <span className="text-xs font-mono text-muted-foreground">
                    #{String(idx + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="text-lg font-bold tracking-tight text-foreground group-hover:text-primary transition-colors duration-200">
                  {p.name}
                </h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{p.desc}</p>
              </div>

              <div className="mt-8 pt-4 border-t border-border flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                  <Briefcase className="size-3.5 text-primary" /> Staged: Upload files
                </span>
                <button
                  onClick={() => onOpenWorkspace(p.id)}
                  className="px-4 py-2 text-xs font-semibold text-white bg-primary rounded-lg hover:bg-primary-hover active:bg-primary-active hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex items-center gap-1 shadow-sm"
                >
                  Open Workspace <ArrowRight className="size-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// INTERN WORKSPACE (LIST ACTIVITIES)
// -------------------------------------------------------------
function InternWorkspaceView({
  workspace,
  onBack,
  onCreateActivity,
  onSelectActivity,
}: {
  workspace: typeof PROBLEM_STATEMENTS[number];
  onBack: () => void;
  onCreateActivity: () => void;
  onSelectActivity: (act: DBActivity) => void;
}) {
  const queryClient = useQueryClient();

  // 1. Fetch exact database ID of the problem statement using its name/slug
  const problemQuery = useQuery({
    queryKey: ["problem-statement-id", workspace.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("problem_statements")
        .select("id")
        .eq("name", workspace.name)
        .maybeSingle();
      return data;
    }
  });

  const problemDbId = problemQuery.data?.id;

  // 2. Fetch student activities for this workspace
  const activitiesQuery = useQuery<DBActivity[]>({
    queryKey: ["student-activities", problemDbId],
    queryFn: async () => {
      if (!problemDbId) return [];
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("pending_work_activities")
        .select("*, profiles!student_id(full_name, college, city)")
        .eq("problem_statement_id", problemDbId)
        .eq("student_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data as DBActivity[]) ?? [];
    },
    enabled: !!problemDbId
  });

  return (
    <div className="space-y-6 font-sans">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer border-none bg-transparent p-0"
        >
          <ChevronLeft className="size-4" /> Back to Problem Statements
        </button>

        <button
          onClick={onCreateActivity}
          className="px-4 py-2 text-xs font-semibold text-white bg-primary rounded-lg hover:bg-primary-hover active:bg-primary-active transition-all duration-200 cursor-pointer flex items-center gap-1.5 shadow-sm border-none"
        >
          <Plus className="size-4" /> Create Activity
        </button>
      </div>

      <header className="card-surface p-6 bg-white border border-border rounded-xl">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-wider font-semibold px-2.5 py-1 rounded-full bg-accent text-accent-foreground">
              Workspace
            </span>
            <h2 className="text-2xl font-bold tracking-tight mt-2">{workspace.name}</h2>
            <p className="text-sm text-muted-foreground mt-1">{workspace.desc}</p>
          </div>
        </div>
      </header>

      {/* ACTIVITIES LIST */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold tracking-tight text-foreground">Workspace Activities</h3>
        {activitiesQuery.isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        ) : (activitiesQuery.data ?? []).length === 0 ? (
          <div className="card-surface p-12 text-center text-muted-foreground bg-white border border-border rounded-xl">
            <FolderDot className="size-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="font-semibold text-sm">No activities created yet</p>
            <p className="text-xs text-muted-foreground mt-1">Create your first activity deliverable to begin submission review.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {(activitiesQuery.data ?? []).map((act) => {
              const statusColors = {
                Draft: "bg-gray-100 text-gray-700 border-gray-200",
                Pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
                Submitted: "bg-blue-50 text-blue-700 border-blue-200",
                Viewed: "bg-indigo-50 text-indigo-700 border-indigo-200",
                "Under Review": "bg-purple-50 text-purple-700 border-purple-200",
                "Changes Requested": "bg-orange-50 text-orange-700 border-orange-200",
                Resubmitted: "bg-sky-50 text-sky-700 border-sky-200",
                Approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
                Rejected: "bg-red-50 text-red-700 border-red-200",
              };

              return (
                <div
                  key={act.id}
                  onClick={() => onSelectActivity(act)}
                  className="card-surface p-5 border border-border hover:border-primary/50 bg-white rounded-xl transition duration-200 cursor-pointer flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${statusColors[act.status]}`}>
                        {act.status}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-semibold uppercase">{act.category || "General"}</span>
                    </div>
                    <h4 className="font-bold text-base text-foreground group-hover:text-primary transition-colors line-clamp-1">{act.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{act.description}</p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Type: <strong className="text-foreground">{act.submission_type || "External Link"}</strong></span>
                    <span>Updated: {new Date(act.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// INTERN WORKSPACE: FORM VIEW (CREATE/EDIT)
// -------------------------------------------------------------
function ActivityFormView({
  workspace,
  activity,
  userId,
  onBack,
}: {
  workspace: typeof PROBLEM_STATEMENTS[number];
  activity: DBActivity | null;
  userId: string;
  onBack: () => void;
}) {
  const queryClient = useQueryClient();

  const [title, setTitle] = useState(activity?.title ?? "");
  const [description, setDescription] = useState(activity?.description ?? "");
  const [category, setCategory] = useState(activity?.category ?? "Research Report");
  const [subType, setSubType] = useState(activity?.submission_type ?? "PDF");
  const [extLink, setExtLink] = useState(activity?.external_link ?? "");
  const [remarks, setRemarks] = useState(activity?.remarks ?? "");

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Fetch db ID
  const problemQuery = useQuery({
    queryKey: ["problem-statement-id", workspace.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("problem_statements")
        .select("id")
        .eq("name", workspace.name)
        .single();
      return data;
    }
  });

  const saveMutation = useMutation({
    mutationFn: async ({ isDraft }: { isDraft: boolean }) => {
      const dbId = problemQuery.data?.id;
      if (!dbId) throw new Error("Problem Statement ID not loaded");

      let fileUrl = activity?.file_url ?? null;

      // Create a temporary ID if this is a new activity
      const activityId = activity?.id ?? Math.random().toString(36).substring(7);

      // Handle Storage Upload if file is chosen
      if (uploadFile) {
        setUploading(true);
        const fileExt = uploadFile.name.split(".").pop();
        const safeName = `${Math.random().toString(36).substring(2, 12)}.${fileExt}`;
        const folderPath = `${workspace.id}/${userId}/${activityId}`;
        const filePath = `${folderPath}/${safeName}`;

        const { data, error: uploadError } = await supabase.storage
          .from("pending-work-files")
          .upload(filePath, uploadFile);

        if (uploadError) {
          setUploading(false);
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from("pending-work-files")
          .getPublicUrl(filePath);

        fileUrl = publicUrl;
      }

      const payload = {
        student_id: userId,
        problem_statement_id: dbId,
        title,
        description,
        category,
        submission_type: subType,
        file_url: fileUrl,
        external_link: extLink || null,
        remarks: remarks || null,
        is_draft: isDraft,
        status: (isDraft ? "Draft" : (activity?.status === "Changes Requested" ? "Resubmitted" : "Submitted")) as any,
        submitted_at: isDraft ? null : new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (activity) {
        // Update
        const { error } = await supabase
          .from("pending_work_activities")
          .update(payload)
          .eq("id", activity.id);
        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from("pending_work_activities")
          .insert({
            id: activityId,
            ...payload,
            created_at: new Date().toISOString()
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-activities"] });
      queryClient.invalidateQueries({ queryKey: ["review-activities"] });
      toast.success(activity ? "Activity updated successfully!" : "Activity created successfully!");
      setUploading(false);
      onBack();
    },
    onError: (err: any) => {
      toast.error(err.message ?? "An error occurred");
      setUploading(false);
    }
  });

  const handleSubmit = (e: React.FormEvent, isDraft: boolean) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      return toast.error("Title and Description are required");
    }
    saveMutation.mutate({ isDraft });
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto font-sans">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer border-none bg-transparent p-0"
      >
        <ChevronLeft className="size-4" /> Cancel Workspace Creation
      </button>

      <header className="card-surface p-6 bg-white border border-border rounded-xl">
        <span className="text-[10px] uppercase tracking-wider font-semibold px-2.5 py-1 rounded-full bg-accent text-accent-foreground">
          {activity ? "Edit Deliverable" : "Create New Activity"}
        </span>
        <h2 className="text-2xl font-bold tracking-tight mt-2">{workspace.name}</h2>
      </header>

      <form onSubmit={(e) => handleSubmit(e, false)} className="card-surface p-6 space-y-5 bg-white border border-border rounded-xl">
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold text-muted-foreground">Activity Title *</span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Research Report Framework"
            className="w-full h-10 rounded-xl bg-surface-2/60 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all"
            required
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs font-semibold text-muted-foreground">Description *</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Explain the work delivered in this activity..."
            rows={4}
            className="w-full rounded-xl bg-surface-2/60 border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all"
            required
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-muted-foreground">Category</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-10 rounded-xl bg-surface-2/60 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              {["Research Report", "Market Analysis", "UI Design", "Backend Development", "Testing", "Presentation", "Documentation", "Demo Video"].map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-muted-foreground">Submission Type</span>
            <select
              value={subType}
              onChange={(e) => setSubType(e.target.value)}
              className="w-full h-10 rounded-xl bg-surface-2/60 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              {["PDF", "DOCX", "PPT", "ZIP", "Images", "GitHub Repository", "Google Drive", "Figma", "Website URL", "Video URL", "Folder Link"].map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-muted-foreground">External Link</span>
            <input
              type="url"
              value={extLink}
              onChange={(e) => setExtLink(e.target.value)}
              placeholder="e.https://github.com/project"
              className="w-full h-10 rounded-xl bg-surface-2/60 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-muted-foreground">Upload Document / Image File</span>
            <div className="relative">
              <input
                type="file"
                onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                className="w-full h-10 rounded-xl border border-border text-xs px-3 bg-surface-2/60 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </label>
        </div>

        <label className="block space-y-1.5">
          <span className="text-xs font-semibold text-muted-foreground">Remarks</span>
          <input
            type="text"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Add any side remarks for the reviewer..."
            className="w-full h-10 rounded-xl bg-surface-2/60 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all"
          />
        </label>

        <div className="flex justify-end gap-3 pt-3 border-t border-border">
          <button
            type="button"
            onClick={onBack}
            className="px-5 py-2.5 rounded-xl border border-border bg-surface text-sm font-semibold hover:bg-surface-2 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saveMutation.isPending || uploading}
            onClick={(e) => handleSubmit(e, true)}
            className="px-5 py-2.5 rounded-xl border border-primary/20 bg-primary/5 text-primary text-sm font-semibold hover:bg-primary/10 transition cursor-pointer"
          >
            Save as Draft
          </button>
          <button
            type="submit"
            disabled={saveMutation.isPending || uploading}
            className="px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-hover active:bg-primary-active transition shadow-sm cursor-pointer border-none flex items-center gap-1.5"
          >
            {(saveMutation.isPending || uploading) && <Loader2 className="size-4 animate-spin" />}
            {saveMutation.isPending || uploading ? "Submitting..." : "Submit to Admins"}
          </button>
        </div>
      </form>
    </div>
  );
}

// -------------------------------------------------------------
// WORKFLOW DETAILED VIEW: HISTORY TIMELINE + COMMENTS THREAD
// -------------------------------------------------------------
function ActivityDetailsView({
  activity,
  callerRole,
  userId,
  onBack,
  onEdit,
}: {
  activity: DBActivity;
  callerRole: Role;
  userId: string;
  onBack: () => void;
  onEdit?: () => void;
}) {
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState("");
  const [commentFile, setCommentFile] = useState<File | null>(null);
  const [submittingComment, setSubmittingComment] = useState(false);

  // Queries
  const historyQuery = useQuery<DBHistory[]>({
    queryKey: ["activity-history", activity.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activity_history")
        .select("*, profiles!performed_by(full_name, role)")
        .eq("activity_id", activity.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data as DBHistory[]) ?? [];
    }
  });

  const commentsQuery = useQuery<DBComment[]>({
    queryKey: ["activity-comments", activity.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activity_comments")
        .select("*, profiles!sender_id(full_name, role)")
        .eq("activity_id", activity.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data as DBComment[]) ?? [];
    }
  });

  // Mutate Comments
  const addCommentMutation = useMutation({
    mutationFn: async () => {
      let attachmentUrl = null;
      if (commentFile) {
        setSubmittingComment(true);
        const fileExt = commentFile.name.split(".").pop();
        const path = `comments/${activity.id}/${Math.random().toString(36).substring(7)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from("pending-work-files").upload(path, commentFile);
        if (uploadError) {
          setSubmittingComment(false);
          throw uploadError;
        }
        const { data: { publicUrl } } = supabase.storage.from("pending-work-files").getPublicUrl(path);
        attachmentUrl = publicUrl;
      }

      const { error } = await supabase
        .from("activity_comments")
        .insert({
          activity_id: activity.id,
          sender_id: userId,
          message: commentText.trim(),
          attachment_url: attachmentUrl
        });

      if (error) throw error;
    },
    onSuccess: () => {
      commentsQuery.refetch();
      historyQuery.refetch();
      setCommentText("");
      setCommentFile(null);
      setSubmittingComment(false);
      toast.success("Comment posted successfully!");
    },
    onError: (err: any) => {
      toast.error(err.message);
      setSubmittingComment(false);
    }
  });

  // Mutate Status
  const statusMutation = useMutation({
    mutationFn: async (newStatus: DBActivity["status"]) => {
      const updates: Partial<DBActivity> = {
        status: newStatus,
        updated_at: new Date().toISOString()
      };
      if (newStatus === "Approved") updates.approved_at = new Date().toISOString();
      if (newStatus === "Rejected") updates.rejected_at = new Date().toISOString();

      const { error } = await supabase
        .from("pending_work_activities")
        .update(updates)
        .eq("id", activity.id);

      if (error) throw error;
    },
    onSuccess: (_, newStatus) => {
      queryClient.invalidateQueries({ queryKey: ["student-activities"] });
      queryClient.invalidateQueries({ queryKey: ["review-activities"] });
      toast.success(`Activity status updated to ${newStatus}`);
      historyQuery.refetch();
      activity.status = newStatus; // Local sync
    },
    onError: (err: any) => {
      toast.error(err.message);
    }
  });

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addCommentMutation.mutate();
  };

  // If Admin reviews, automatically mark as 'Viewed' or 'Under Review' when they open it
  useEffect(() => {
    if ((callerRole === "admin" || callerRole === "super_admin") && (activity.status === "Submitted" || activity.status === "Pending" || activity.status === "Resubmitted")) {
      statusMutation.mutate("Under Review");
    }
  }, [callerRole]);

  return (
    <div className="grid gap-6 lg:grid-cols-3 font-sans items-start">
      <div className="lg:col-span-2 space-y-6">
        {/* TOP BAR */}
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer border-none bg-transparent p-0"
        >
          <ChevronLeft className="size-4" /> Back to Dashboard
        </button>

        {/* DETAILS */}
        <div className="card-surface p-6 bg-white border border-border rounded-xl space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-semibold px-2.5 py-1 rounded-full bg-accent text-accent-foreground">
                {activity.category || "General"}
              </span>
              <h2 className="text-xl font-bold tracking-tight mt-2 text-foreground">{activity.title}</h2>
              <p className="text-xs text-muted-foreground mt-1">Submitted by: <span className="font-semibold text-foreground">{activity.profiles?.full_name ?? "Intern"}</span></p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold px-2.5 py-1 rounded bg-primary/10 border border-primary/20 text-primary block">
                {activity.status}
              </span>
            </div>
          </div>

          <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
            {activity.description}
          </div>

          {activity.remarks && (
            <div className="p-3.5 bg-yellow-50/50 border border-yellow-100 rounded-xl text-xs text-yellow-800">
              <strong>Remarks: </strong> {activity.remarks}
            </div>
          )}

          {/* DELIVERABLES LINKS */}
          <div className="grid gap-3 pt-3 border-t border-border sm:grid-cols-2">
            {activity.file_url && (
              <a
                href={activity.file_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-3 border border-border rounded-xl bg-surface-2/20 hover:bg-surface-2/60 transition cursor-pointer text-xs font-semibold"
              >
                <span className="flex items-center gap-2 text-foreground truncate">
                  <FileText className="size-4 text-red-500 shrink-0" />
                  Attachment File
                </span>
                <Download className="size-3.5 text-muted-foreground" />
              </a>
            )}

            {activity.external_link && (
              <a
                href={activity.external_link}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-3 border border-border rounded-xl bg-surface-2/20 hover:bg-surface-2/60 transition cursor-pointer text-xs font-semibold"
              >
                <span className="flex items-center gap-2 text-foreground truncate">
                  <LinkIcon className="size-4 text-emerald-500 shrink-0" />
                  {activity.submission_type || "External Link"}
                </span>
                <ExternalLink className="size-3.5 text-muted-foreground" />
              </a>
            )}
          </div>

          {/* INTERN ACTIONS */}
          {callerRole === "intern" && activity.status !== "Approved" && onEdit && (
            <div className="flex justify-end pt-3">
              <button
                onClick={onEdit}
                className="px-4 py-2 text-xs font-semibold text-white bg-primary rounded-lg hover:bg-primary-hover active:bg-primary-active transition shadow-sm border-none cursor-pointer"
              >
                Edit Work Deliverables
              </button>
            </div>
          )}
        </div>

        {/* COMMENTS THREAD */}
        <div className="card-surface p-6 bg-white border border-border rounded-xl space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2 flex items-center gap-1.5">
            <MessageSquare className="size-4 text-primary" /> Conversation
          </h3>

          <div className="space-y-4 max-h-[340px] overflow-y-auto pr-1">
            {commentsQuery.data?.length === 0 ? (
              <p className="text-xs text-muted-foreground/60 text-center py-4">No comments posted yet. Ask questions or leave suggestions below.</p>
            ) : (
              (commentsQuery.data ?? []).map((comm) => {
                const isMe = comm.sender_id === userId;
                return (
                  <div key={comm.id} className={`flex flex-col gap-1 max-w-[85%] ${isMe ? "ml-auto items-end" : "mr-auto items-start"}`}>
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      <span className="font-semibold text-foreground">{comm.profiles?.full_name}</span>
                      <span className="uppercase text-[9px] bg-accent/60 px-1 rounded">{comm.profiles?.role}</span>
                      <span>{new Date(comm.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className={`p-3 rounded-2xl text-xs leading-relaxed ${isMe ? "bg-primary text-white rounded-tr-none" : "bg-surface-2 border border-border rounded-tl-none text-foreground"}`}>
                      {comm.message}
                      {comm.attachment_url && (
                        <a
                          href={comm.attachment_url}
                          target="_blank"
                          rel="noreferrer"
                          className={`mt-2 flex items-center gap-1 font-semibold text-[10px] underline ${isMe ? "text-white" : "text-primary"}`}
                        >
                          <FileText className="size-3" /> Attached File
                        </a>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <form onSubmit={handlePostComment} className="pt-3 border-t border-border flex flex-col gap-3">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Type comment message..."
              rows={2}
              className="w-full rounded-xl bg-surface-2/60 border border-border px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all"
              required
            />
            <div className="flex items-center justify-between gap-3">
              <input
                type="file"
                onChange={(e) => setCommentFile(e.target.files?.[0] ?? null)}
                className="text-[10px] text-muted-foreground max-w-[200px]"
              />
              <button
                type="submit"
                disabled={addCommentMutation.isPending || submittingComment}
                className="px-4 py-2 text-xs font-semibold text-white bg-primary rounded-lg hover:bg-primary-hover active:bg-primary-active transition border-none cursor-pointer flex items-center gap-1"
              >
                {(addCommentMutation.isPending || submittingComment) ? <Loader2 className="size-3 animate-spin" /> : <Send className="size-3" />}
                Post
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* TIMELINE LOG & REVIEW ACTIONS */}
      <div className="space-y-6">
        {/* REVIEW PANEL (ADMIN/SUPER ADMIN) */}
        {(callerRole === "admin" || callerRole === "super_admin") && (
          <div className="card-surface p-6 bg-white border border-border rounded-xl space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2 flex items-center gap-1.5">
              <CheckCircle2 className="size-4 text-primary" /> Review Submission
            </h3>
            <p className="text-xs text-muted-foreground">Perform workflow evaluation actions on this activity deliverable.</p>

            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => statusMutation.mutate("Approved")}
                disabled={statusMutation.isPending || activity.status === "Approved"}
                className="w-full py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition cursor-pointer border-none shadow-sm flex items-center justify-center gap-1"
              >
                Approve Submission
              </button>

              <button
                onClick={() => statusMutation.mutate("Changes Requested")}
                disabled={statusMutation.isPending || activity.status === "Changes Requested"}
                className="w-full py-2.5 text-xs font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-xl transition cursor-pointer flex items-center justify-center gap-1"
              >
                Request Changes
              </button>

              <button
                onClick={() => statusMutation.mutate("Rejected")}
                disabled={statusMutation.isPending || activity.status === "Rejected"}
                className="w-full py-2.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition cursor-pointer flex items-center justify-center gap-1"
              >
                Reject Activity
              </button>
            </div>
          </div>
        )}

        {/* TIMELINE LOG */}
        <div className="card-surface p-6 bg-white border border-border rounded-xl space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2 flex items-center gap-1.5">
            <History className="size-4 text-primary" /> Activity Timeline
          </h3>

          <div className="relative border-l border-border pl-4 ml-2 space-y-5 py-2">
            {historyQuery.isLoading ? (
              <Loader2 className="size-4 animate-spin text-primary" />
            ) : (historyQuery.data ?? []).map((h) => (
              <div key={h.id} className="relative text-xs">
                <div className="absolute size-2.5 rounded-full bg-primary border-2 border-white -left-[21.5px] top-1" />
                <div className="font-semibold text-foreground">{h.action}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  by {h.profiles?.full_name} • {new Date(h.created_at).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// ADMIN & SUPER ADMIN REVIEW DASHBOARDS
// -------------------------------------------------------------
function AdminReviewSubmissionsView({
  role,
  onSelectActivity,
}: {
  role: string;
  onSelectActivity: (act: DBActivity) => void;
}) {
  const [searchVal, setSearchVal] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedProblem, setSelectedProblem] = useState("All");
  const [selectedCity, setSelectedCity] = useState("All");

  const queryClient = useQueryClient();

  // Fetch activities
  const reviewActivitiesQuery = useQuery<DBActivity[]>({
    queryKey: ["review-activities"],
    queryFn: async () => {
      // Due to RLS:
      // Admins automatically get rows belonging to their assigned problem statements.
      // Super admins get all rows.
      const { data, error } = await supabase
        .from("pending_work_activities")
        .select("*, profiles!student_id(full_name, college, city), problem_statements(name)")
        .eq("is_draft", false)
        .order("submitted_at", { ascending: false });

      if (error) throw error;
      return (data as DBActivity[]) ?? [];
    }
  });

  const rawList = reviewActivitiesQuery.data ?? [];

  // Filter lists derived from data for filters
  const cities = Array.from(new Set(rawList.map((a) => a.profiles?.city).filter(Boolean)));
  const problemStatements = Array.from(new Set(rawList.map((a) => a.problem_statements?.name).filter(Boolean)));

  const filteredList = useMemo(() => {
    return rawList.filter((sub) => {
      // Search Box (Name, Title, College)
      if (searchVal.trim()) {
        const query = searchVal.toLowerCase();
        const nameMatch = sub.profiles?.full_name?.toLowerCase().includes(query);
        const titleMatch = sub.title?.toLowerCase().includes(query);
        const collegeMatch = sub.profiles?.college?.toLowerCase().includes(query);
        if (!nameMatch && !titleMatch && !collegeMatch) return false;
      }

      // Dropdown Filters
      if (selectedStatus !== "All" && sub.status !== selectedStatus) return false;
      if (selectedProblem !== "All" && sub.problem_statements?.name !== selectedProblem) return false;
      if (selectedCity !== "All" && sub.profiles?.city !== selectedCity) return false;

      return true;
    });
  }, [rawList, searchVal, selectedStatus, selectedProblem, selectedCity]);

  return (
    <div className="space-y-6 font-sans">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Pending Work</h2>
          <p className="text-muted-foreground mt-2">
            Review, verify, and filter intern deliverable submissions for problem statements.
          </p>
        </div>
        <span className="self-start md:self-auto text-xs font-semibold px-3 py-1 rounded-full bg-accent text-accent-foreground border border-primary/20">
          Role: {role === "super_admin" ? "Super Admin" : "Track Admin"}
        </span>
      </header>

      {/* FILTER PANEL */}
      <div className="card-surface p-5 space-y-4 bg-white border border-border rounded-xl">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="text-sm font-semibold flex items-center gap-1.5">
            <SlidersHorizontal className="size-4 text-primary" /> Filter Submissions
          </div>
          {(searchVal || selectedStatus !== "All" || selectedProblem !== "All" || selectedCity !== "All") && (
            <button
              onClick={() => {
                setSearchVal("");
                setSelectedStatus("All");
                setSelectedProblem("All");
                setSelectedCity("All");
              }}
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer border-none bg-transparent p-0"
            >
              Clear Filters
            </button>
          )}
        </div>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-muted-foreground">Search intern, college, title</span>
            <div className="relative">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                placeholder="Search..."
                className="w-full h-10 rounded-xl bg-surface-2/60 border border-border pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all"
              />
            </div>
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-muted-foreground">Workflow Status</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full h-10 rounded-xl bg-surface-2/60 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="All">All Statuses</option>
              {["Pending", "Submitted", "Viewed", "Under Review", "Changes Requested", "Resubmitted", "Approved", "Rejected"].map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-muted-foreground">Problem Statement</span>
            <select
              value={selectedProblem}
              onChange={(e) => setSelectedProblem(e.target.value)}
              className="w-full h-10 rounded-xl bg-surface-2/60 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="All">All Tracks</option>
              {problemStatements.map((prob) => (
                <option key={prob} value={prob}>{prob}</option>
              ))}
            </select>
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-muted-foreground">City</span>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full h-10 rounded-xl bg-surface-2/60 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="All">All Cities</option>
              {cities.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* ACTIVITIES SUBMISSIONS LIST */}
      <div className="card-surface overflow-hidden bg-white border border-border rounded-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-2/60 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <th className="py-4 px-6">Student Intern</th>
                <th className="py-4 px-6">College / City</th>
                <th className="py-4 px-6">Problem Statement</th>
                <th className="py-4 px-6">Deliverable Title</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6">Submitted Date</th>
                <th className="py-4 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {reviewActivitiesQuery.isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    <Loader2 className="size-6 animate-spin text-primary mx-auto mb-2" />
                    Loading submissions...
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    <FolderDot className="size-10 text-muted-foreground/30 mx-auto mb-2" />
                    No deliverables match criteria filters.
                  </td>
                </tr>
              ) : (
                filteredList.map((act) => {
                  const initial = act.profiles?.full_name ? act.profiles.full_name[0].toUpperCase() : "I";
                  const subDate = act.submitted_at ? new Date(act.submitted_at).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }) : "—";
                  
                  const statusColors = {
                    Draft: "bg-gray-100 text-gray-700 border-gray-200",
                    Pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
                    Submitted: "bg-blue-50 text-blue-700 border-blue-200",
                    Viewed: "bg-indigo-50 text-indigo-700 border-indigo-200",
                    "Under Review": "bg-purple-50 text-purple-700 border-purple-200",
                    "Changes Requested": "bg-orange-50 text-orange-700 border-orange-200",
                    Resubmitted: "bg-sky-50 text-sky-700 border-sky-200",
                    Approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
                    Rejected: "bg-red-50 text-red-700 border-red-200",
                  };

                  return (
                    <tr key={act.id} className="hover:bg-surface-2/30 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="size-8 rounded-full bg-brand-orange-gradient grid place-items-center text-xs font-semibold text-white shrink-0">
                            {initial}
                          </div>
                          <span className="font-semibold text-foreground">{act.profiles?.full_name ?? "Intern"}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-muted-foreground truncate max-w-[200px]">
                        {act.profiles?.college ?? "—"} ({act.profiles?.city ?? "—"})
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full bg-accent text-accent-foreground border border-primary/10">
                          {act.problem_statements?.name ?? "General"}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-medium text-foreground truncate max-w-[180px]">
                        {act.title}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${statusColors[act.status]}`}>
                          {act.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-muted-foreground">{subDate}</td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => onSelectActivity(act)}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-surface border border-border text-foreground hover:bg-surface-2 transition cursor-pointer inline-flex items-center gap-1"
                        >
                          <Eye className="size-3 text-primary" /> Review Submission
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// HELPER COMPONENT: ICON BADGE
// -------------------------------------------------------------
function IconBadge({
  icon: Icon,
  tone,
  size = "md",
}: {
  icon: any;
  tone: "warning" | "primary" | "info" | "success" | "danger";
  size?: "sm" | "md" | "lg";
}) {
  const toneClasses = {
    warning: "bg-warning/10 text-warning border-warning/20",
    primary: "bg-primary/10 text-primary border-primary/20",
    info: "bg-info/10 text-info border-info/20",
    success: "bg-success/10 text-success border-success/20",
    danger: "bg-danger/10 text-danger border-danger/20",
  };
  const sizeClasses = {
    sm: "p-1.5 rounded-lg",
    md: "p-2 rounded-xl",
    lg: "p-3.5 rounded-2xl",
  };
  return (
    <div className={`border flex items-center justify-center shrink-0 ${toneClasses[tone]} ${sizeClasses[size]}`}>
      <Icon className={size === "lg" ? "size-6" : size === "md" ? "size-4.5" : "size-3.5"} />
    </div>
  );
}
