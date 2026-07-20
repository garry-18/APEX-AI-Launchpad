import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  MessageSquarePlus,
  Upload,
  Link as LinkIcon,
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
  SlidersHorizontal,
  X,
  Building,
  MapPin,
  Calendar,
  User as UserIcon,
  FolderDot,
  GraduationCap,
  Sparkles,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useMyProfile } from "@/hooks/use-current-user";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { fetchUserRole, Role } from "@/lib/roles";
import { dataStore } from "@/lib/data-store";

export const Route = createFileRoute("/_authenticated/feedback-suggestions")({
  head: () => ({
    meta: [
      { title: "Feedback & Suggestions — APEX AI Launchpad" },
      {
        name: "description",
        content: "Submit feedback or review suggestions from interns.",
      },
    ],
  }),
  component: FeedbackSuggestionsPage,
});

// 12 Problem Statements
const PROBLEM_STATEMENTS = [
  "ASG Ecosystem",
  "Career Intelligence Platform",
  "Digital Economy",
  "Energy as Distribution",
  "Events Industry",
  "Gaming",
  "HoReCa",
  "Kids Sector",
  "Mobility",
  "Social Work and Sustainability",
  "Sports and Fitness",
  "Temple Economy",
];

// Assigned Admin Heads
const ADMIN_HEADS = [
  { name: "Aarav Singhal", role: "Head of Systems" },
  { name: "Bhavna Patel", role: "Head of Education" },
  { name: "Chaitanya Rao", role: "Head of Finance" },
  { name: "Divya Menon", role: "Head of Infrastructure" },
  { name: "Eshwar Sharma", role: "Head of Media" },
  { name: "Farhan Khan", role: "Head of Gaming" },
  { name: "Gitanjali Sen", role: "Head of Services" },
  { name: "Himanshu Verma", role: "Head of EdTech" },
  { name: "Ishita Reddy", role: "Head of Transportation" },
  { name: "Jayesh Joshi", role: "Head of Sustainability" },
  { name: "Kavita Nair", role: "Head of Health" },
  { name: "Lakshman Prasad", role: "Head of Culture" },
];

// Problem Statement -> Admin Head Mapping
const PROBLEM_ADMIN_MAP: Record<string, (typeof ADMIN_HEADS)[number]> = {
  "ASG Ecosystem": ADMIN_HEADS[0],
  "Career Intelligence Platform": ADMIN_HEADS[1],
  "Digital Economy": ADMIN_HEADS[2],
  "Energy as Distribution": ADMIN_HEADS[3],
  "Events Industry": ADMIN_HEADS[4],
  Gaming: ADMIN_HEADS[5],
  HoReCa: ADMIN_HEADS[6],
  "Kids Sector": ADMIN_HEADS[7],
  Mobility: ADMIN_HEADS[8],
  "Social Work and Sustainability": ADMIN_HEADS[9],
  "Sports and Fitness": ADMIN_HEADS[10],
  "Temple Economy": ADMIN_HEADS[11],
};

// Mock Initial Feedbacks
const MOCK_FEEDBACKS = [
  {
    id: "fb-1",
    internName: "Aditya Sharma",
    city: "Mumbai",
    college: "IIT Bombay",
    problemStatement: "ASG Ecosystem",
    subject: "API Rate limits on cloud resources",
    content:
      "The API rate limits for the sandbox environments are too restrictive for automated performance testing. Can we increase it to 100 req/min?",
    attachment: "rate_limit_spec.pdf",
    attachmentType: "pdf",
    adminHead: "Aarav Singhal",
    submittedTo: "Selected Admin Head",
    submissionDate: "2026-07-08T11:00:00Z",
  },
  {
    id: "fb-2",
    internName: "Priya Patel",
    city: "Ahmedabad",
    college: "Nirma University",
    problemStatement: "Career Intelligence Platform",
    subject: "Resume parsing model accuracy",
    content:
      "We should integrate a secondary OCR library (like Tesseract or LayoutLM) to improve parser accuracy on two-column resume templates.",
    attachment: "secondary_ocr_proposal.pdf",
    attachmentType: "pdf",
    adminHead: "Bhavna Patel",
    submittedTo: "Selected Admin Head",
    submissionDate: "2026-07-08T15:30:00Z",
  },
  {
    id: "fb-3",
    internName: "Rohan Das",
    city: "Pune",
    college: "COEP Pune",
    problemStatement: "Digital Economy",
    subject: "Suggesting gas-fee optimization",
    content:
      "Deploying the smart contracts on Arbitrum instead of mainnet will save more than 90% of gas fees during tests. Please check the contract benchmarks link.",
    attachment: "https://github.com/rohan/gas-benchmarks",
    attachmentType: "link",
    adminHead: "Chaitanya Rao",
    submittedTo: "Super Admin",
    submissionDate: "2026-07-07T10:15:00Z",
  },
  {
    id: "fb-4",
    internName: "Ananya Iyer",
    city: "Chennai",
    college: "Anna University",
    problemStatement: "Energy as Distribution",
    subject: "Solar microgrid telemetry issue",
    content:
      "Some remote nodes are experiencing connectivity dropouts every 15 minutes. It might be due to buffer overflows. Staging log screenshot attached.",
    attachment: "microgrid_telemetry.png",
    attachmentType: "image",
    adminHead: "Divya Menon",
    submittedTo: "Selected Admin Head",
    submissionDate: "2026-07-07T17:20:00Z",
  },
  {
    id: "fb-5",
    internName: "Vikram Malhotra",
    city: "Delhi",
    college: "DTU Delhi",
    problemStatement: "Events Industry",
    subject: "Hybrid matchmaking recommendations",
    content:
      "Adding interest tagging during onboarding will increase engagement by matchmaking attendees with similar project topics. I suggest using a simple cosine similarity algorithm.",
    attachment: "matchmaking_flow.pdf",
    attachmentType: "pdf",
    adminHead: "Eshwar Sharma",
    submittedTo: "Super Admin",
    submissionDate: "2026-07-06T12:00:00Z",
  },
  {
    id: "fb-6",
    internName: "Kabir Mehta",
    city: "Bangalore",
    college: "RVCE Bangalore",
    problemStatement: "Gaming",
    subject: "Lobby matchmaking lag spikes",
    content:
      "We need an edge server in Mumbai to mitigate 200ms+ latency spikes for users in Central India. Latency charts are linked below.",
    attachment: "https://charts.gaming-telemetry.io",
    attachmentType: "link",
    adminHead: "Farhan Khan",
    submittedTo: "Selected Admin Head",
    submissionDate: "2026-07-06T16:10:00Z",
  },
  {
    id: "fb-7",
    internName: "Sneha Reddy",
    city: "Hyderabad",
    college: "CBIT Hyderabad",
    problemStatement: "HoReCa",
    subject: "Kitchen display print margins",
    content:
      "The receipt prints are clipped on standard thermal printers. I've designed a CSS print stylesheet with custom margins to solve this.",
    attachment: "kitchen_print_styles.pdf",
    attachmentType: "pdf",
    adminHead: "Gitanjali Sen",
    submittedTo: "Selected Admin Head",
    submissionDate: "2026-07-05T14:40:00Z",
  },
  {
    id: "fb-8",
    internName: "Aarav Gupta",
    city: "Mumbai",
    college: "VJTI Mumbai",
    problemStatement: "Kids Sector",
    subject: "Parental lock dashboard ideas",
    content:
      "Adding a quick statistics widget to the parental lock page showing screen-time breakdowns will make the app more transparent and parents feel secure.",
    attachment: "lock_dashboard_mock.png",
    attachmentType: "image",
    adminHead: "Himanshu Verma",
    submittedTo: "Super Admin",
    submissionDate: "2026-07-05T19:00:00Z",
  },
  {
    id: "fb-9",
    internName: "Meera Nair",
    city: "Trivandrum",
    college: "CET Trivandrum",
    problemStatement: "Mobility",
    subject: "Routing algorithm optimization suggestions",
    content:
      "Using a bidirectional Dijkstra search will speed up routing queries on high-density nodes by nearly 40%. Benchmark numbers are detailed in the proposal.",
    attachment: "bidirectional_proposal.pdf",
    attachmentType: "pdf",
    adminHead: "Ishita Reddy",
    submittedTo: "Selected Admin Head",
    submissionDate: "2026-07-04T11:25:00Z",
  },
  {
    id: "fb-10",
    internName: "Tushar Sen",
    city: "Kolkata",
    college: "Jadavpur University",
    problemStatement: "Social Work and Sustainability",
    subject: "Carbon calculator suggestion",
    content:
      "Please consider adding the API reference of the UNFCCC carbon offset database so our calculators reflect the official standards.",
    attachment: "https://unfccc.int/offsets-api",
    attachmentType: "link",
    adminHead: "Jayesh Joshi",
    submittedTo: "Super Admin",
    submissionDate: "2026-07-03T15:10:00Z",
  },
];

function FeedbackSuggestionsPage() {
  const [role, setRole] = useState<Role>("intern");
  const { data: profile } = useMyProfile();

  // Feedback State
  const [feedbacks, setFeedbacks] = useState<any[]>([]);

  useEffect(() => {
    // Check role
    const tempRole = localStorage.getItem("temp_role");
    if (tempRole) {
      setRole(tempRole as Role);
    } else {
      supabase.auth.getUser().then(({ data }) => {
        if (data.user) {
          fetchUserRole(data.user.id).then((r) => setRole(r || "intern"));
        }
      });
    }

    // Load feedbacks
    const saved = localStorage.getItem("apex.feedbacks");
    if (saved) {
      try {
        setFeedbacks(JSON.parse(saved));
      } catch (e) {
        setFeedbacks(MOCK_FEEDBACKS);
      }
    } else {
      setFeedbacks(MOCK_FEEDBACKS);
      localStorage.setItem("apex.feedbacks", JSON.stringify(MOCK_FEEDBACKS));
    }
  }, []);

  const handleAddFeedback = (newFb: any) => {
    const updated = [newFb, ...feedbacks];
    setFeedbacks(updated);
    localStorage.setItem("apex.feedbacks", JSON.stringify(updated));
  };

  return (
    <AppShell>
      {role === "admin" || role === "super_admin" ? (
        <AdminFeedbackView role={role} feedbacks={feedbacks} />
      ) : (
        <InternFeedbackFormView profile={profile} onAddFeedback={handleAddFeedback} />
      )}
    </AppShell>
  );
}

// -------------------------------------------------------------
// INTERN VIEW: FEEDBACK SUBMISSION FORM
// -------------------------------------------------------------
function InternFeedbackFormView({
  profile,
  onAddFeedback,
}: {
  profile: any;
  onAddFeedback: (fb: any) => void;
}) {
  const [problemStatement, setProblemStatement] = useState(PROBLEM_STATEMENTS[0]);
  const [adminHead, setAdminHead] = useState(PROBLEM_ADMIN_MAP[PROBLEM_STATEMENTS[0]].name);
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [sendTo, setSendTo] = useState<"Selected Admin Head" | "Super Admin" | "Both">(
    "Selected Admin Head",
  );

  // Attachments
  const [attachType, setAttachType] = useState<"none" | "pdf" | "image" | "link">("none");
  const [attachmentVal, setAttachmentVal] = useState("");
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Success State Modal
  const [showSuccess, setShowSuccess] = useState(false);
  const [submittedData, setSubmittedData] = useState<any>(null);

  // Auto update Admin Head when Problem Statement changes
  useEffect(() => {
    const assigned = PROBLEM_ADMIN_MAP[problemStatement];
    if (assigned) {
      setAdminHead(assigned.name);
    }
  }, [problemStatement]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAttachmentFile(file);
      setAttachmentVal(file.name);

      // Simulate progress
      setUploadProgress(0);
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 20;
        });
      }, 100);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) return toast.error("Please enter a subject.");
    if (!content.trim()) return toast.error("Please write your feedback/suggestions.");

    const entry = {
      id: "fb-" + Math.random().toString(36).substring(5),
      internName: profile?.full_name ?? profile?.email?.split("@")[0] ?? "Member Intern",
      city: "Mumbai",
      college: profile?.college ?? "IIT Bombay",
      problemStatement,
      subject: subject.trim(),
      content: content.trim(),
      attachment: attachmentVal.trim() || null,
      attachmentType: attachType === "none" ? null : attachType,
      adminHead,
      submittedTo: sendTo,
      submissionDate: new Date().toISOString(),
    };

    onAddFeedback(entry);
    setSubmittedData(entry);
    setShowSuccess(true);
  };

  const resetForm = () => {
    setSubject("");
    setContent("");
    setAttachmentVal("");
    setAttachmentFile(null);
    setAttachType("none");
    setShowSuccess(false);
    toast.success("Feedback Form Reset!");
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300 max-w-3xl mx-auto font-sans">
      <header>
        <h2 className="text-3xl font-bold tracking-tight">Feedback & Suggestions</h2>
        <p className="text-muted-foreground mt-2">
          Submit feedback, suggestions, or raise issues related to your assigned problem statement.
        </p>
      </header>

      <form onSubmit={handleFormSubmit} className="space-y-6">
        <div className="card-surface p-6 space-y-5">
          <h3 className="text-sm font-semibold tracking-tight text-foreground uppercase border-b border-border pb-2">
            Statement & Assigned Contact
          </h3>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* PROBLEM STATEMENT SELECT */}
            <label className="block space-y-1.5">
              <div className="text-xs font-semibold text-muted-foreground">Problem Statement</div>
              <select
                value={problemStatement}
                onChange={(e) => setProblemStatement(e.target.value)}
                className="w-full h-10 rounded-xl bg-surface-2/60 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all"
              >
                {PROBLEM_STATEMENTS.map((statement) => (
                  <option key={statement} value={statement}>
                    {statement}
                  </option>
                ))}
              </select>
            </label>

            {/* SELECT ADMIN HEAD DISPLAY */}
            <label className="block space-y-1.5">
              <div className="text-xs font-semibold text-muted-foreground">Select Admin Head</div>
              <select
                value={adminHead}
                onChange={(e) => setAdminHead(e.target.value)}
                className="w-full h-10 rounded-xl bg-surface-2/60 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all"
              >
                {ADMIN_HEADS.map((head) => (
                  <option key={head.name} value={head.name}>
                    {head.name} ({head.role})
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* ADMIN HEAD INFO WIDGET */}
          {PROBLEM_ADMIN_MAP[problemStatement] && (
            <div className="p-4 rounded-xl bg-accent/20 border border-primary/10 flex items-center gap-3">
              <div className="size-9 rounded-full bg-brand-orange-gradient grid place-items-center text-xs font-bold text-white shrink-0">
                {PROBLEM_ADMIN_MAP[problemStatement].name[0]}
              </div>
              <div>
                <div className="text-xs font-bold text-foreground">
                  {PROBLEM_ADMIN_MAP[problemStatement].name}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  Assigned {PROBLEM_ADMIN_MAP[problemStatement].role} for {problemStatement}
                </div>
              </div>
              <span className="ml-auto text-[10px] uppercase font-bold text-primary tracking-wider px-2 py-0.5 rounded bg-primary/5">
                Assigned Head
              </span>
            </div>
          )}
        </div>

        {/* FEEDBACK CONTENTS */}
        <div className="card-surface p-6 space-y-5">
          <h3 className="text-sm font-semibold tracking-tight text-foreground uppercase border-b border-border pb-2">
            Feedback Details
          </h3>

          {/* SUBJECT */}
          <label className="block space-y-1.5">
            <div className="text-xs font-semibold text-muted-foreground">Subject / Topic</div>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Issues with gas-fees calculation in smart contract"
              className="w-full h-10 rounded-xl bg-surface-2/60 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all"
              required
            />
          </label>

          {/* SUGGESTION BODY */}
          <label className="block space-y-1.5">
            <div className="text-xs font-semibold text-muted-foreground">
              Feedback / Suggestion Message
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write detailed recommendations or suggestions..."
              rows={5}
              className="w-full rounded-xl bg-surface-2/60 border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all"
              required
            />
          </label>
        </div>

        {/* ATTACHMENT AREA */}
        <div className="card-surface p-6 space-y-4">
          <h3 className="text-sm font-semibold tracking-tight text-foreground uppercase border-b border-border pb-2">
            Add Attachment (Optional)
          </h3>

          <div className="flex flex-wrap gap-2.5">
            {[
              { id: "none", label: "No Attachment" },
              { id: "pdf", label: "Attach PDF" },
              { id: "image", label: "Attach Image" },
              { id: "link", label: "Add URL Link" },
            ].map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => {
                  setAttachType(type.id as any);
                  setAttachmentVal("");
                  setAttachmentFile(null);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                  attachType === type.id
                    ? "border-primary bg-accent/20 text-primary"
                    : "border-border bg-surface hover:bg-surface-2"
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>

          {/* CONDITIONAL RENDER ATTACHMENTS */}
          {attachType === "link" && (
            <label className="block space-y-1.5 animate-in slide-in-from-top-1 duration-200">
              <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <LinkIcon className="size-3.5 text-primary" /> Reference Link
              </div>
              <input
                type="url"
                value={attachmentVal}
                onChange={(e) => setAttachmentVal(e.target.value)}
                placeholder="https://github.com/username/project"
                className="w-full h-10 rounded-xl bg-surface-2/60 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all"
              />
            </label>
          )}

          {(attachType === "pdf" || attachType === "image") && (
            <div className="space-y-4 animate-in slide-in-from-top-1 duration-200">
              <div className="border-dashed border-2 border-border hover:border-primary/50 rounded-2xl flex flex-col items-center justify-center p-6 bg-surface-2/30 cursor-pointer relative transition-all">
                <input
                  type="file"
                  accept={attachType === "pdf" ? ".pdf" : "image/*"}
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <Upload className="size-8 text-muted-foreground mb-2" />
                <span className="text-xs font-semibold text-foreground">
                  Click to stage your {attachType === "pdf" ? "PDF document" : "screenshot image"}
                </span>
              </div>

              {attachmentVal && (
                <div className="p-3.5 bg-surface border border-border rounded-xl flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${attachType === "pdf" ? "bg-red-50 text-red-500" : "bg-blue-50 text-blue-500"}`}
                  >
                    {attachType === "pdf" ? (
                      <FileText className="size-4" />
                    ) : (
                      <ImageIcon className="size-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-foreground truncate">
                      {attachmentVal}
                    </div>
                    {uploadProgress < 100 && (
                      <div className="w-full bg-border h-1 rounded-full mt-1.5 overflow-hidden">
                        <div
                          className="bg-primary h-full transition-all"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground font-semibold">
                    {uploadProgress}%
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RECIPIENT SELECT */}
        <div className="card-surface p-6 space-y-4">
          <h3 className="text-sm font-semibold tracking-tight text-foreground uppercase border-b border-border pb-2">
            Send Recipient
          </h3>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                id: "Selected Admin Head",
                label: `Send to ${adminHead}`,
                desc: `Routes to the mapped Admin Head of ${problemStatement}`,
              },
              {
                id: "Super Admin",
                label: "Send to Super Admin",
                desc: "Routes directly to the Super Admin review ledger",
              },
              {
                id: "Both",
                label: "Send to Both",
                desc: "Sends to both the Admin Head and Super Admin simultaneously",
              },
            ].map((rec) => {
              const active = sendTo === rec.id;
              return (
                <button
                  key={rec.id}
                  type="button"
                  onClick={() => setSendTo(rec.id as any)}
                  className={`p-4 border rounded-xl flex flex-col text-left hover:-translate-y-0.5 transition-all cursor-pointer ${
                    active
                      ? "border-primary bg-accent/20 ring-2 ring-primary/20 text-primary"
                      : "border-border bg-surface hover:bg-surface-2"
                  }`}
                >
                  <div className="font-semibold text-sm flex items-center gap-2">
                    <CheckCircle2
                      className={`size-4 ${active ? "text-primary fill-primary/10" : "text-muted-foreground/30"}`}
                    />
                    {rec.label}
                  </div>
                  <div
                    className={`text-[10px] mt-1 ${active ? "text-primary/70" : "text-muted-foreground"}`}
                  >
                    {rec.desc}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* BUTTON ACTIONS */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={resetForm}
            className="px-5 py-2.5 rounded-xl border border-border bg-surface text-sm font-semibold hover:bg-surface-2 transition cursor-pointer"
          >
            Reset Form
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-hover active:bg-primary-active transition shadow-sm cursor-pointer border-none"
          >
            Submit Feedback
          </button>
        </div>
      </form>

      {/* SUCCESS POPUP */}
      {showSuccess && submittedData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-200">
          <div className="w-full max-w-md bg-card card-surface p-6 rounded-2xl animate-in scale-in duration-300 text-center flex flex-col items-center">
            <div className="size-14 rounded-full bg-emerald-50 text-emerald-500 border border-emerald-100 flex items-center justify-center mb-4">
              <CheckCircle2 className="size-8" />
            </div>

            <h3 className="text-xl font-bold tracking-tight text-foreground">
              Feedback Sent Successfully
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Your feedback on{" "}
              <span className="font-semibold text-foreground">{problemStatement}</span> has been
              dispatched.
            </p>

            <div className="w-full text-left bg-surface-2 p-4 rounded-xl mt-5 space-y-3.5 border border-border">
              <div>
                <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                  Subject
                </span>
                <span className="text-xs font-bold text-foreground truncate block">
                  {submittedData.subject}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                    Assigned Head
                  </span>
                  <span className="text-xs font-semibold text-foreground block">
                    {submittedData.adminHead}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                    Routing To
                  </span>
                  <span className="text-xs font-bold text-primary block">
                    {submittedData.submittedTo}
                  </span>
                </div>
              </div>

              {submittedData.attachment && (
                <div>
                  <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                    Attachment
                  </span>
                  <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    {submittedData.attachmentType === "pdf" ? (
                      <FileText className="size-3 text-red-500" />
                    ) : submittedData.attachmentType === "image" ? (
                      <ImageIcon className="size-3 text-blue-500" />
                    ) : (
                      <LinkIcon className="size-3 text-emerald-500" />
                    )}
                    <span className="truncate flex-1">{submittedData.attachment}</span>
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={() => {
                setShowSuccess(false);
                resetForm();
              }}
              className="w-full py-2.5 bg-primary text-white font-semibold rounded-xl mt-6 hover:bg-primary-hover active:bg-primary-active transition shadow-sm cursor-pointer text-sm border-none"
            >
              Back to Form
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// ADMIN & SUPER ADMIN VIEW: REVIEW TABLE
// -------------------------------------------------------------
function AdminFeedbackView({ role, feedbacks }: { role: string; feedbacks: any[] }) {
  const [searchVal, setSearchVal] = useState("");

  // Selected details modal
  const [viewingFeedback, setViewingFeedback] = useState<any | null>(null);

  // Switch Admin Heads for testing
  const [activeAdminHead, setActiveAdminHead] = useState("Bhavna Patel"); // Defaults to Bhavna

  // Filter feedbacks:
  const filteredFeedbacks = useMemo(() => {
    const assignedNames = dataStore.getProblems().map((p) => p.name);
    return feedbacks.filter((fb) => {
      // 1. Role separation:
      if (role === "admin") {
        if (!assignedNames.includes(fb.problemStatement)) {
          return false;
        }
      }

      // 2. Omni-search filter
      if (searchVal.trim()) {
        const query = searchVal.toLowerCase();
        const matchesName = fb.internName?.toLowerCase().includes(query);
        const matchesCity = fb.city?.toLowerCase().includes(query);
        const matchesCollege = fb.college?.toLowerCase().includes(query);
        const matchesProblem = fb.problemStatement?.toLowerCase().includes(query);
        const matchesSubject = fb.subject?.toLowerCase().includes(query);
        return matchesName || matchesCity || matchesCollege || matchesProblem || matchesSubject;
      }

      return true;
    });
  }, [feedbacks, role, activeAdminHead, searchVal]);

  const clearFilters = () => {
    setSearchVal("");
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300 font-sans">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Feedback & Suggestions</h2>
          <p className="text-muted-foreground mt-2">
            Review recommendations, feedback logs, and structural improvement ideas from interns.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          {role === "admin" && (
            <label className="flex items-center gap-2 text-xs font-semibold bg-surface-2 border border-border px-3 py-1.5 rounded-full">
              <span className="text-muted-foreground">Admin Head:</span>
              <select
                value={activeAdminHead}
                onChange={(e) => setActiveAdminHead(e.target.value)}
                className="bg-transparent border-none outline-none font-bold text-primary focus:ring-0 cursor-pointer"
              >
                {ADMIN_HEADS.map((head) => (
                  <option key={head.name} value={head.name}>
                    {head.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-accent text-accent-foreground border border-primary/20">
            Role: {role === "super_admin" ? "Super Admin" : "Admin"}
          </span>
        </div>
      </header>

      {/* FILTERS */}
      <div className="card-surface p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="text-sm font-semibold flex items-center gap-1.5">
            <SlidersHorizontal className="size-4 text-primary" /> Filter Feedback Entries
          </div>
          {searchVal && (
            <button
              onClick={clearFilters}
              className="text-xs font-semibold text-primary hover:underline border-none bg-transparent p-0 cursor-pointer"
            >
              Clear Filters
            </button>
          )}
        </div>

        <div className="relative max-w-md">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            placeholder="Search name, city, college, problem, subject..."
            className="w-full h-10 rounded-xl bg-surface-2/60 border border-border pl-9 pr-4 text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* TABLE DATA */}
      <div className="card-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-2/60 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <th className="py-4 px-6">Intern Name</th>
                <th className="py-4 px-6">City</th>
                <th className="py-4 px-6">College</th>
                <th className="py-4 px-6">Problem Statement</th>
                <th className="py-4 px-6">Subject</th>
                <th className="py-4 px-6">Feedback / Suggestion</th>
                <th className="py-4 px-6">Attachment</th>
                <th className="py-4 px-6">Submitted To</th>
                <th className="py-4 px-6">Submission Date</th>
                <th className="py-4 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {filteredFeedbacks.length > 0 ? (
                filteredFeedbacks.map((fb) => {
                  const initial = fb.internName ? fb.internName[0].toUpperCase() : "I";
                  const subDate = new Date(fb.submissionDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });

                  // Render short teaser text for feedback content
                  const teaserContent =
                    fb.content.length > 40 ? fb.content.substring(0, 40) + "…" : fb.content;

                  // Render icon attachment representation
                  let attachmentBadge = (
                    <span className="text-[10px] text-muted-foreground">—</span>
                  );
                  if (fb.attachment) {
                    let attachIcon = <FileText className="size-3 text-red-500" />;
                    if (fb.attachmentType === "image")
                      attachIcon = <ImageIcon className="size-3 text-blue-500" />;
                    if (fb.attachmentType === "link")
                      attachIcon = <LinkIcon className="size-3 text-emerald-500" />;
                    attachmentBadge = (
                      <span
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface border border-border hover:border-primary/20 text-[10px] text-foreground font-medium transition max-w-[120px] truncate"
                        title={fb.attachment}
                      >
                        {attachIcon} <span className="truncate">{fb.attachment}</span>
                      </span>
                    );
                  }

                  return (
                    <tr key={fb.id} className="hover:bg-surface-2/30 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="size-8 rounded-full bg-brand-orange-gradient grid place-items-center text-xs font-semibold text-white shrink-0">
                            {initial}
                          </div>
                          <span className="font-semibold text-foreground">{fb.internName}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-muted-foreground">{fb.city}</td>
                      <td className="py-4 px-6 text-muted-foreground truncate max-w-[150px]">
                        {fb.college}
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full bg-accent text-accent-foreground border border-primary/10">
                          {fb.problemStatement}
                        </span>
                      </td>
                      <td
                        className="py-4 px-6 font-medium text-foreground truncate max-w-[150px]"
                        title={fb.subject}
                      >
                        {fb.subject}
                      </td>
                      <td
                        className="py-4 px-6 text-muted-foreground max-w-[200px] truncate"
                        title={fb.content}
                      >
                        {teaserContent}
                      </td>
                      <td className="py-4 px-6">{attachmentBadge}</td>
                      <td className="py-4 px-6">
                        <div className="flex flex-col gap-0.5">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md self-start ${
                              fb.submittedTo === "Super Admin"
                                ? "bg-purple-50 text-purple-600 border border-purple-100"
                                : "bg-orange-50 text-orange-600 border border-orange-100"
                            }`}
                          >
                            {fb.submittedTo}
                          </span>
                          {fb.submittedTo === "Selected Admin Head" && (
                            <span className="text-[9px] text-muted-foreground pl-0.5">
                              ({fb.adminHead})
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-muted-foreground">{subDate}</td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => setViewingFeedback(fb)}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-surface border border-border text-foreground hover:bg-surface-2 transition cursor-pointer inline-flex items-center gap-1"
                        >
                          <Eye className="size-3 text-primary" /> View Details
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="py-12 px-6 text-center text-muted-foreground">
                    <FolderDot className="size-10 text-muted-foreground/30 mx-auto mb-2" />
                    No feedback entries found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* VIEW DETAILS PANEL MODAL */}
      {viewingFeedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-200">
          <div className="w-full max-w-xl bg-card card-surface p-6 rounded-2xl animate-in scale-in duration-300 relative font-sans">
            <button
              onClick={() => setViewingFeedback(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-surface-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer border-none bg-transparent"
            >
              <X className="size-5" />
            </button>

            <h3 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2 mb-1">
              <MessageSquarePlus className="size-5 text-primary" /> Feedback Details
            </h3>
            <p className="text-xs text-muted-foreground mb-5 border-b border-border pb-3">
              Review feedback and suggestions submitted by the intern.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Intern Name
                </span>
                <div className="text-sm font-semibold flex items-center gap-2 text-foreground">
                  <UserIcon className="size-4 text-primary" /> {viewingFeedback.internName}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                  College & City
                </span>
                <div className="text-sm font-semibold flex items-center gap-2 text-foreground">
                  <Building className="size-4 text-primary" /> {viewingFeedback.college} (
                  {viewingFeedback.city})
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Problem Statement
                </span>
                <div className="text-sm font-semibold text-foreground">
                  {viewingFeedback.problemStatement}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Submission Date
                </span>
                <div className="text-sm font-semibold flex items-center gap-2 text-foreground">
                  <Calendar className="size-4 text-primary" />
                  {new Date(viewingFeedback.submissionDate).toLocaleString("en-US", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </div>
              </div>
            </div>

            <div className="mt-5 p-4 rounded-xl bg-surface-2 border border-border space-y-2">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Subject
              </div>
              <div className="text-sm font-bold text-foreground leading-tight">
                {viewingFeedback.subject}
              </div>
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider pt-2">
                Message
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                {viewingFeedback.content}
              </p>
            </div>

            {viewingFeedback.attachment && (
              <div className="mt-5 space-y-2">
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border pb-1">
                  Attachment Reference
                </div>
                <div className="p-3 bg-surface hover:bg-surface-2/40 border border-border rounded-xl flex items-center justify-between transition-colors">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={`p-2 rounded-lg ${
                        viewingFeedback.attachmentType === "pdf"
                          ? "bg-red-50 text-red-500"
                          : viewingFeedback.attachmentType === "image"
                            ? "bg-blue-50 text-blue-500"
                            : "bg-emerald-50 text-emerald-500"
                      }`}
                    >
                      {viewingFeedback.attachmentType === "pdf" ? (
                        <FileText className="size-4" />
                      ) : viewingFeedback.attachmentType === "image" ? (
                        <ImageIcon className="size-4" />
                      ) : (
                        <LinkIcon className="size-4" />
                      )}
                    </div>
                    <span
                      className="text-xs font-semibold text-foreground truncate flex-1"
                      title={viewingFeedback.attachment}
                    >
                      {viewingFeedback.attachment}
                    </span>
                  </div>

                  {viewingFeedback.attachmentType === "link" ? (
                    <a
                      href={viewingFeedback.attachment}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded bg-accent hover:bg-accent/80 text-[10px] font-bold text-primary transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      Open Link <ExternalLink className="size-3" />
                    </a>
                  ) : (
                    <button
                      onClick={() =>
                        toast.success(`Downloading attached file: ${viewingFeedback.attachment}`)
                      }
                      className="px-2.5 py-1 rounded bg-surface border border-border hover:bg-surface-2 text-[10px] font-bold text-foreground transition-colors cursor-pointer"
                    >
                      Download
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3 border-t border-border pt-4">
              <button
                onClick={() => setViewingFeedback(null)}
                className="px-4 py-2 rounded-xl border border-border bg-surface text-sm font-semibold hover:bg-surface-2 transition cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  toast.success("Feedback marked as resolved");
                  setViewingFeedback(null);
                }}
                className="px-5 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-hover active:bg-primary-active transition shadow-sm cursor-pointer border-none"
              >
                Mark Resolved
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
