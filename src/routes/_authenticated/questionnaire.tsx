import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import {
  CheckCircle2,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Sparkles,
  Send,
  Save,
  Check,
  X,
  AlertCircle,
  Clock,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { toast } from "sonner";
import { ApexLogo } from "@/components/ApexLogo";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/questionnaire")({
  head: () => ({ meta: [{ title: "Student Questionnaire — APEX AI" }] }),
  component: QuestionnaireModule,
});

export type QuestionType = "short_text" | "long_text" | "multiple_choice";
export type QuestionCategory = "Technical" | "Non-Technical" | "AI Knowledge";

export interface QuestionItem {
  id: string;
  category: QuestionCategory;
  type: QuestionType;
  question_text: string;
  options?: string[];
  required: boolean;
  order: number;
  placeholder?: string;
  help_text?: string;
  character_limit?: number;
  enabled: boolean;
}

export const INITIAL_QUESTIONS: QuestionItem[] = [
  {
    id: "q_tech_1",
    category: "Technical",
    type: "multiple_choice",
    question_text: "Which programming language are you most comfortable with?",
    options: ["Python", "Java", "JavaScript / TypeScript", "C++", "Go / Rust", "Other"],
    required: true,
    order: 1,
    help_text: "Select your primary coding language for technical projects.",
    enabled: true,
  },
  {
    id: "q_tech_2",
    category: "Technical",
    type: "short_text",
    question_text: "List your primary web development frameworks (e.g. React, Next.js, Django, FastApi):",
    placeholder: "React, Next.js, Node.js",
    required: true,
    character_limit: 150,
    order: 2,
    enabled: true,
  },
  {
    id: "q_tech_3",
    category: "Technical",
    type: "multiple_choice",
    question_text: "How would you rate your experience with Git & GitHub workflows?",
    options: [
      "Beginner (Basic clone, commit, push)",
      "Intermediate (Branching, PRs, code reviews)",
      "Advanced (CI/CD pipelines, Git hooks, rebase)",
    ],
    required: true,
    order: 3,
    enabled: true,
  },
  {
    id: "q_nontech_1",
    category: "Non-Technical",
    type: "multiple_choice",
    question_text: "How many hours per week can you dedicate to your internship?",
    options: ["10 - 15 hours / week", "15 - 25 hours / week", "25 - 35 hours / week", "40+ hours / week (Full Time)"],
    required: true,
    order: 4,
    enabled: true,
  },
  {
    id: "q_nontech_2",
    category: "Non-Technical",
    type: "long_text",
    question_text: "Describe your main career goals and what you hope to achieve during this APEX Launchpad:",
    placeholder: "I want to build production-ready projects and collaborate with mentors...",
    required: true,
    character_limit: 500,
    order: 5,
    enabled: true,
  },
  {
    id: "q_ai_1",
    category: "AI Knowledge",
    type: "multiple_choice",
    question_text: "Have you worked with LLMs, Generative AI, or API frameworks (e.g. OpenAI, LangChain, Gemini)?",
    options: ["No experience yet", "Basic API calls / Prompts", "Built projects with RAG / Embeddings", "Trained / Fine-tuned models"],
    required: true,
    order: 6,
    enabled: true,
  },
  {
    id: "q_ai_2",
    category: "AI Knowledge",
    type: "long_text",
    question_text: "Share an idea for an AI-powered feature or tool you would like to build:",
    placeholder: "An automated code reviewer that suggests performance fixes...",
    required: false,
    character_limit: 400,
    order: 7,
    enabled: true,
  },
];

function QuestionnaireModule() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving">("saved");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Load active questions & student answers from Supabase/Local storage
  useEffect(() => {
    async function loadData() {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      setUserId(auth.user.id);

      // Check profile status
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed, questionnaire_answers, questionnaire_status, last_question_index")
        .eq("id", auth.user.id)
        .maybeSingle();

      if (profile?.onboarding_completed) {
        navigate({ to: "/dashboard", replace: true });
        return;
      }

      // Filter active enabled questions
      const enabledQuestions = INITIAL_QUESTIONS.filter((q) => q.enabled).sort((a, b) => a.order - b.order);
      setQuestions(enabledQuestions);

      if (profile?.questionnaire_answers) {
        setAnswers(profile.questionnaire_answers);
      }
      if (typeof profile?.last_question_index === "number" && profile.last_question_index < enabledQuestions.length) {
        setCurrentIndex(profile.last_question_index);
      }

      setLoading(false);
    }

    loadData();
  }, [navigate]);

  // Group questions by category
  const activeQuestion = questions[currentIndex];
  const totalQuestions = questions.length;

  const answeredCount = useMemo(() => {
    return questions.filter((q) => !!answers[q.id]?.trim()).length;
  }, [questions, answers]);

  const completionPercentage = useMemo(() => {
    if (totalQuestions === 0) return 0;
    return Math.round((answeredCount / totalQuestions) * 100);
  }, [totalQuestions, answeredCount]);

  // Validation: Check if all required questions have been answered
  const unansweredRequired = useMemo(() => {
    return questions.filter((q) => q.required && !answers[q.id]?.trim());
  }, [questions, answers]);

  const canSubmit = unansweredRequired.length === 0;

  // Auto-Save Handler
  const handleAnswer = (qId: string, val: string) => {
    const updated = { ...answers, [qId]: val };
    setAnswers(updated);
    setSaveStatus("saving");

    // Debounced persist to Supabase
    if (userId) {
      supabase
        .from("profiles")
        .update({
          questionnaire_answers: updated,
          last_question_index: currentIndex,
          questionnaire_completion_pct: Math.round((Object.keys(updated).length / totalQuestions) * 100),
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)
        .then(() => {
          setTimeout(() => setSaveStatus("saved"), 400);
        })
        .catch(() => setSaveStatus("saved"));
    }
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((i) => i + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  };

  const handleSaveAndExit = async () => {
    toast.success("Progress saved. You can resume anytime!");
    navigate({ to: "/dashboard" });
  };

  const executeSubmission = async () => {
    setShowConfirmModal(false);
    setSubmitting(true);

    try {
      if (userId) {
        await supabase
          .from("profiles")
          .update({
            questionnaire_answers: answers,
            questionnaire_status: "completed",
            onboarding_completed: true, // Complete onboarding workflow
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);
      }

      setSubmittedSuccess(true);

      setTimeout(() => {
        // Automatically redirect to LMS Integration phase after questionnaire
        navigate({ to: "/lms-integration", replace: true });
      }, 1800);
    } catch (err: any) {
      toast.error(err.message || "Submission failed");
      setSubmitting(false);
    }
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
      {/* Top Header */}
      <header className="max-w-4xl w-full mx-auto flex items-center justify-between py-2 mb-6">
        <ApexLogo size="md" />
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 bg-white border border-gray-200 px-3.5 py-1.5 rounded-full shadow-sm">
          {saveStatus === "saving" ? (
            <>
              <Loader2 className="size-3.5 animate-spin text-[#FF6B00]" />
              <span>Saving answer...</span>
            </>
          ) : (
            <>
              <Check className="size-3.5 text-emerald-500 stroke-[3]" />
              <span>Progress Saved</span>
            </>
          )}
        </div>
      </header>

      {/* Main Questionnaire Area */}
      <main className="max-w-3xl w-full mx-auto flex-1 flex flex-col justify-center relative">
        {/* Submission Confirmation Modal */}
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-gray-100 text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="size-14 rounded-full bg-orange-50 text-[#FF6B00] mx-auto flex items-center justify-center">
                <HelpCircle className="size-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Submit Questionnaire?</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Are you sure you want to submit your questionnaire? You won't be able to edit your answers after submission.
              </p>
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 h-12 rounded-2xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={executeSubmission}
                  className="flex-1 h-12 rounded-2xl bg-[#FF6B00] hover:bg-[#e05e00] text-white font-bold text-sm shadow-md shadow-[#FF6B00]/25 transition-all cursor-pointer"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success Screen Overlay */}
        {submittedSuccess ? (
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm text-center space-y-4 animate-in fade-in duration-300">
            <div className="size-16 rounded-full bg-orange-50 text-[#FF6B00] mx-auto flex items-center justify-center animate-bounce">
              <CheckCircle2 className="size-10" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Questionnaire Submitted Successfully!</h2>
            <p className="text-sm text-gray-600 max-w-sm mx-auto">
              Redirecting to LMS Integration & Intern Launchpad...
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header Title Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-4">
                <div>
                  <div className="inline-flex items-center gap-2 text-xs font-bold text-[#FF6B00] uppercase tracking-wider mb-1">
                    <Sparkles className="size-3.5" /> Phase 4 • Questionnaire
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                    Technical & Career Questionnaire
                  </h1>
                  <p className="text-sm text-gray-500 mt-1">
                    Help us understand your technical background, AI knowledge, and career interests.
                  </p>
                </div>
              </div>

              {/* Progress Header Info */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                  <span>
                    Question {currentIndex + 1} of {totalQuestions}
                  </span>
                  <span className="text-[#FF6B00]">{completionPercentage}% Completed</span>
                </div>
                {/* Animated Progress Bar */}
                <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#FF6B00] transition-all duration-500 rounded-full"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Question Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-6 transition-all duration-300">
              {activeQuestion && (
                <div key={activeQuestion.id} className="space-y-4 animate-in fade-in duration-300">
                  {/* Category Title Header */}
                  <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    <span>Category:</span>
                    <span className="text-[#FF6B00]">{activeQuestion.category}</span>
                  </div>

                  {/* Question Text */}
                  <div className="space-y-1">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-start gap-2">
                      <span>{activeQuestion.question_text}</span>
                      {activeQuestion.required ? (
                        <span className="text-red-500 text-sm font-semibold" title="Required">*</span>
                      ) : (
                        <span className="text-xs font-normal text-gray-400 mt-1">(Optional)</span>
                      )}
                    </h2>
                    {activeQuestion.help_text && (
                      <p className="text-xs text-gray-500">{activeQuestion.help_text}</p>
                    )}
                  </div>

                  {/* Render based on Question Type */}
                  {activeQuestion.type === "multiple_choice" && (
                    <div className="grid grid-cols-1 gap-2.5 pt-2">
                      {activeQuestion.options?.map((opt) => {
                        const isSelected = answers[activeQuestion.id] === opt;
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => handleAnswer(activeQuestion.id, opt)}
                            className={`w-full text-left p-4 rounded-2xl border text-sm font-semibold transition-all flex items-center justify-between cursor-pointer ${
                              isSelected
                                ? "bg-orange-50/70 border-[#FF6B00] text-[#FF6B00] shadow-sm ring-2 ring-[#FF6B00]/10"
                                : "bg-gray-50/70 border-gray-200 text-gray-800 hover:bg-gray-100"
                            }`}
                          >
                            <span>{opt}</span>
                            <div
                              className={`size-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                isSelected ? "border-[#FF6B00] bg-[#FF6B00] text-white" : "border-gray-300"
                              }`}
                            >
                              {isSelected && <Check className="size-3 stroke-[3]" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {activeQuestion.type === "short_text" && (
                    <div className="space-y-1.5 pt-2">
                      <input
                        type="text"
                        value={answers[activeQuestion.id] || ""}
                        onChange={(e) => handleAnswer(activeQuestion.id, e.target.value)}
                        maxLength={activeQuestion.character_limit || 200}
                        placeholder={activeQuestion.placeholder || "Type your answer..."}
                        className="w-full h-12 rounded-2xl bg-gray-50/70 border border-gray-200 px-4 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-[#FF6B00] focus:ring-4 focus:ring-[#FF6B00]/10 transition-all"
                      />
                      {activeQuestion.character_limit && (
                        <div className="text-[11px] text-gray-400 text-right">
                          {(answers[activeQuestion.id] || "").length} / {activeQuestion.character_limit} chars
                        </div>
                      )}
                    </div>
                  )}

                  {activeQuestion.type === "long_text" && (
                    <div className="space-y-1.5 pt-2">
                      <textarea
                        value={answers[activeQuestion.id] || ""}
                        onChange={(e) => handleAnswer(activeQuestion.id, e.target.value)}
                        maxLength={activeQuestion.character_limit || 500}
                        rows={4}
                        placeholder={activeQuestion.placeholder || "Type your detailed response..."}
                        className="w-full rounded-2xl bg-gray-50/70 border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-[#FF6B00] focus:ring-4 focus:ring-[#FF6B00]/10 transition-all resize-none"
                      />
                      {activeQuestion.character_limit && (
                        <div className="text-[11px] text-gray-400 text-right">
                          {(answers[activeQuestion.id] || "").length} / {activeQuestion.character_limit} chars
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Navigation Actions */}
              <div className="pt-6 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                    className="h-11 px-5 rounded-2xl border border-gray-200 text-gray-700 font-semibold text-xs inline-flex items-center gap-1.5 hover:bg-gray-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronLeft className="size-4" /> Previous
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={currentIndex === totalQuestions - 1}
                    className="h-11 px-5 rounded-2xl border border-gray-200 text-gray-700 font-semibold text-xs inline-flex items-center gap-1.5 hover:bg-gray-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Next <ChevronRight className="size-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSaveAndExit}
                    className="h-11 px-4 rounded-2xl border border-gray-200 text-gray-600 font-semibold text-xs hover:bg-gray-50 transition-all cursor-pointer"
                  >
                    Save & Exit
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (!canSubmit) {
                        toast.error("Please answer all required questions before submitting.");
                      } else {
                        setShowConfirmModal(true);
                      }
                    }}
                    disabled={!canSubmit || submitting}
                    className="h-11 px-6 rounded-2xl bg-[#FF6B00] hover:bg-[#e05e00] text-white font-bold text-xs inline-flex items-center gap-2 shadow-md shadow-[#FF6B00]/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-3.5" />}
                    Submit Questionnaire
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-4xl w-full mx-auto text-center py-4 text-xs text-gray-400 mt-6">
        © APEX AI Launchpad • Dynamic Questionnaire Portal
      </footer>
    </div>
  );
}
