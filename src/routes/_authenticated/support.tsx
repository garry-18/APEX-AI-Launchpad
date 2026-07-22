import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  HelpCircle,
  MessageSquare,
  LifeBuoy,
  FileText,
  ShieldCheck,
  Send,
  Plus,
  CheckCircle2,
  Clock,
  Search,
  ChevronDown,
  ExternalLink,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/support")({
  head: () => ({ meta: [{ title: "Help & Support — APEX AI" }] }),
  component: SharedSupportPage,
});

export interface SupportTicket {
  id: string;
  user_id: string;
  user_name: string;
  role: string;
  category: string;
  subject: string;
  message: string;
  status: "open" | "in_progress" | "resolved";
  created_at: string;
}

const FAQS = [
  {
    q: "How does the 7 Onboarding Activities submission work?",
    a: "Complete each activity using external AI tools (such as NotebookLM, Canva, Gamma App) and submit a public Google Drive link. Your assigned Admin will review and approve each deliverable.",
  },
  {
    q: "When do I get my assigned Problem Statement?",
    a: "Once all 7 activities and the 1-to-1 Interaction stage are completed, the Super Admin reviews your profile and assigns your Problem Statement and dedicated Admin.",
  },
  {
    q: "Can I edit my profile details after onboarding?",
    a: "Yes! You can update allowed personal fields such as Skills, LinkedIn, GitHub, and Resume anytime in the Profile section.",
  },
  {
    q: "What should I do if my Google Drive link is marked invalid?",
    a: "Ensure the share link starts with https://drive.google.com/ or https://docs.google.com/ and has general access set to 'Anyone with the link can view'.",
  },
];

function SharedSupportPage() {
  const [activeTab, setActiveTab] = useState<"faqs" | "tickets" | "feedback" | "about">("faqs");
  const [search, setSearch] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Tickets & Feedback Form States
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketCategory, setTicketCategory] = useState("Onboarding");
  const [ticketMessage, setTicketMessage] = useState("");
  const [feedbackRating, setFeedbackRating] = useState("5");
  const [feedbackCategory, setFeedbackCategory] = useState("Onboarding Experience");
  const [feedbackComments, setFeedbackComments] = useState("");

  const [tickets, setTickets] = useState<SupportTicket[]>([
    {
      id: "t_01",
      user_id: "u1",
      user_name: "Self",
      role: "intern",
      category: "LMS Integration",
      subject: "Course sync delayed",
      message: "My external LMS progress took 5 minutes to synchronize.",
      status: "resolved",
      created_at: "2026-07-20",
    },
  ]);

  const handleCreateTicket = async () => {
    if (!ticketSubject.trim() || !ticketMessage.trim()) {
      return toast.error("Please fill in the subject and message.");
    }
    const newT: SupportTicket = {
      id: `t_${Date.now()}`,
      user_id: "current",
      user_name: "CurrentUser",
      role: "intern",
      category: ticketCategory,
      subject: ticketSubject.trim(),
      message: ticketMessage.trim(),
      status: "open",
      created_at: "Just now",
    };
    setTickets((prev) => [newT, ...prev]);
    setTicketSubject("");
    setTicketMessage("");
    toast.success("Support ticket raised successfully! Our team will respond shortly.");
  };

  const handleSendFeedback = () => {
    if (!feedbackComments.trim()) return toast.error("Please provide your feedback comments.");
    toast.success("Thank you! Your feedback has been submitted to the APEX platform team.");
    setFeedbackComments("");
  };

  const filteredFaqs = FAQS.filter(
    (f) =>
      f.q.toLowerCase().includes(search.toLowerCase()) ||
      f.a.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppShell>
      <div className="space-y-6 font-sans">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold text-[#FF6B00] uppercase tracking-wider mb-1">
              <LifeBuoy className="size-3.5" /> Central Support Hub
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              Help, Support & Feedback
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Find answers, raise support tickets, provide platform feedback, or read terms & policies.
            </p>
          </div>

          {/* Tab Selection Switcher */}
          <div className="flex flex-wrap gap-1 bg-surface-2 p-1 rounded-2xl border border-border">
            {(["faqs", "tickets", "feedback", "about"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition cursor-pointer ${
                  activeTab === tab
                    ? "bg-primary text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab === "faqs" ? "FAQs & Guides" : tab === "tickets" ? "Support Tickets" : tab === "feedback" ? "Feedback" : "About Platform"}
              </button>
            ))}
          </div>
        </header>

        {/* TAB 1: FAQS & GUIDES */}
        {activeTab === "faqs" && (
          <div className="space-y-6 animate-in fade-in-50 duration-200">
            <div className="relative max-w-md">
              <Search className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search FAQs & platform guides..."
                className="w-full h-10 pl-10 pr-4 rounded-2xl bg-surface border border-border text-xs text-foreground focus:outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-3 max-w-3xl">
              {filteredFaqs.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={idx}
                    className="card-surface p-4 cursor-pointer transition"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                  >
                    <div className="flex items-center justify-between font-bold text-sm text-foreground">
                      <span>{faq.q}</span>
                      <ChevronDown
                        className={`size-4 text-muted-foreground transition-transform ${
                          isOpen ? "transform rotate-180 text-primary" : ""
                        }`}
                      />
                    </div>
                    {isOpen && (
                      <p className="mt-3 text-xs text-muted-foreground leading-relaxed pt-2 border-t border-border/50">
                        {faq.a}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: SUPPORT TICKETS */}
        {activeTab === "tickets" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in-50 duration-200">
            {/* Create Ticket */}
            <div className="card-surface p-6 space-y-4 lg:col-span-1">
              <h3 className="text-base font-bold text-foreground">Raise Support Ticket</h3>
              <div className="space-y-3 text-xs">
                <label className="block space-y-1">
                  <span className="font-semibold text-muted-foreground">Category</span>
                  <select
                    value={ticketCategory}
                    onChange={(e) => setTicketCategory(e.target.value)}
                    className="w-full h-10 rounded-xl bg-surface border border-border px-3 text-xs text-foreground"
                  >
                    <option value="Onboarding">Onboarding Workflow</option>
                    <option value="Questionnaire">Questionnaire</option>
                    <option value="LMS Integration">LMS Integration</option>
                    <option value="Activities">Activities Submission</option>
                    <option value="Interview">1-to-1 Interview</option>
                    <option value="Technical Bug">Technical Bug / Issue</option>
                  </select>
                </label>

                <label className="block space-y-1">
                  <span className="font-semibold text-muted-foreground">Subject</span>
                  <input
                    type="text"
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                    placeholder="Brief description of issue..."
                    className="w-full h-10 rounded-xl bg-surface border border-border px-3 text-xs text-foreground"
                  />
                </label>

                <label className="block space-y-1">
                  <span className="font-semibold text-muted-foreground">Detailed Message</span>
                  <textarea
                    value={ticketMessage}
                    onChange={(e) => setTicketMessage(e.target.value)}
                    rows={4}
                    placeholder="Describe your question or issue..."
                    className="w-full rounded-xl bg-surface border border-border p-3 text-xs text-foreground"
                  />
                </label>

                <button
                  type="button"
                  onClick={handleCreateTicket}
                  className="w-full h-11 rounded-2xl bg-primary hover:bg-primary-hover text-white font-bold text-xs shadow-md cursor-pointer inline-flex items-center justify-center gap-1.5"
                >
                  <Send className="size-3.5" /> Submit Ticket
                </button>
              </div>
            </div>

            {/* Ticket List */}
            <div className="card-surface p-6 space-y-4 lg:col-span-2">
              <h3 className="text-base font-bold text-foreground">Your Active Support Tickets ({tickets.length})</h3>
              <div className="space-y-3">
                {tickets.map((t) => (
                  <div key={t.id} className="bg-surface-2 p-4 rounded-2xl border border-border space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-foreground">{t.subject}</span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                          t.status === "resolved"
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                            : "bg-orange-50 text-[#FF6B00] border border-orange-200"
                        }`}
                      >
                        {t.status}
                      </span>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">{t.message}</p>
                    <div className="text-[10px] text-muted-foreground pt-1 flex justify-between border-t border-border/50">
                      <span>Category: {t.category}</span>
                      <span>Created: {t.created_at}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: FEEDBACK */}
        {activeTab === "feedback" && (
          <div className="card-surface p-6 max-w-xl space-y-4 animate-in fade-in-50 duration-200">
            <h3 className="text-base font-bold text-foreground">Platform & Experience Feedback</h3>
            <p className="text-xs text-muted-foreground">
              Help us improve the APEX AI Launchpad experience by sharing your suggestions.
            </p>

            <div className="space-y-3 text-xs">
              <label className="block space-y-1">
                <span className="font-semibold text-muted-foreground">Feedback Category</span>
                <select
                  value={feedbackCategory}
                  onChange={(e) => setFeedbackCategory(e.target.value)}
                  className="w-full h-10 rounded-xl bg-surface border border-border px-3 text-xs text-foreground"
                >
                  <option value="Onboarding Experience">Onboarding Experience</option>
                  <option value="LMS Integration">LMS Integration</option>
                  <option value="Onboarding Activities">Onboarding Activities</option>
                  <option value="Internship Workspace">Internship Workspace</option>
                  <option value="General Platform Suggestion">General Suggestion</option>
                </select>
              </label>

              <label className="block space-y-1">
                <span className="font-semibold text-muted-foreground">Rating (1 to 5 Stars)</span>
                <select
                  value={feedbackRating}
                  onChange={(e) => setFeedbackRating(e.target.value)}
                  className="w-full h-10 rounded-xl bg-surface border border-border px-3 text-xs text-foreground font-bold"
                >
                  <option value="5">⭐⭐⭐⭐⭐ (5/5 Excellent)</option>
                  <option value="4">⭐⭐⭐⭐ (4/5 Good)</option>
                  <option value="3">⭐⭐⭐ (3/5 Average)</option>
                  <option value="2">⭐⭐ (2/2 Fair)</option>
                  <option value="1">⭐ (1/5 Needs Improvement)</option>
                </select>
              </label>

              <label className="block space-y-1">
                <span className="font-semibold text-muted-foreground">Your Suggestions & Comments</span>
                <textarea
                  value={feedbackComments}
                  onChange={(e) => setFeedbackComments(e.target.value)}
                  rows={4}
                  placeholder="Share details or suggestions..."
                  className="w-full rounded-xl bg-surface border border-border p-3 text-xs text-foreground"
                />
              </label>

              <button
                type="button"
                onClick={handleSendFeedback}
                className="h-11 px-6 rounded-2xl bg-primary hover:bg-primary-hover text-white font-bold text-xs shadow-md cursor-pointer"
              >
                Submit Feedback
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: ABOUT & PRIVACY */}
        {activeTab === "about" && (
          <div className="card-surface p-6 sm:p-8 max-w-3xl space-y-5 animate-in fade-in-50 duration-200 text-xs leading-relaxed text-foreground">
            <h3 className="text-xl font-extrabold text-foreground">About APEX AI Launchpad</h3>
            <p className="text-muted-foreground">
              APEX AI Launchpad is an enterprise AI-driven internship and talent onboarding platform designed to bridge academic preparation with real-world full-stack and artificial intelligence engineering.
            </p>

            <div className="border-t border-border pt-4 space-y-2">
              <h4 className="font-bold text-sm">Privacy Policy & Terms of Service</h4>
              <p className="text-muted-foreground">
                All submitted personal information, academic records, and activity deliverables are securely processed and protected in accordance with platform security standards. User data is strictly used for internship evaluations, mentor assignments, and career analytics.
              </p>
            </div>

            <div className="border-t border-border pt-4 text-muted-foreground">
              <p>© APEX AI Launchpad • All Rights Reserved</p>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
