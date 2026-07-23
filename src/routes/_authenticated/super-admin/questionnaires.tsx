import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { 
  Users, UserPlus, ShieldAlert, Sparkles, Calendar, BookOpen, Clock, Send, Trophy, Bell, Settings, 
  Search, SlidersHorizontal, ArrowUpDown, Play, Download, Mail, UserCheck, Plus, Trash2, Eye
} from "lucide-react";
import { AdminLayout, PageHeader, ContentContainer } from "@/components/AdminLayout";
import { QuestionCard, QuestionPreview, ResponseDrawer } from "@/components/QuestionnaireBuilderUI";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/super-admin/questionnaires")({
  head: () => ({ meta: [{ title: "Super Admin Questionnaire Builder & Management — APEX AI" }] }),
  component: SuperAdminQuestionnaires,
});

// Seed mock questionnaires data
const MOCK_QUESTIONNAIRES = [
  { id: "1", title: "Apex AI Intern Intake Questionnaire", version: "v1.2", questionsCount: 8, status: "Published", createdBy: "Dr. Hemlata", createdDate: "2026-06-15", responses: 124 },
  { id: "2", title: "Milestone Dossier Technical Review feedback", version: "v2.0", questionsCount: 12, status: "Draft", createdBy: "Amit Kumar", createdDate: "2026-07-10", responses: 0 },
  { id: "3", title: "Previous Cohort Exit Survey", version: "v1.0", questionsCount: 15, status: "Archived", createdBy: "Prof. Satish", createdDate: "2026-01-05", responses: 88 }
];

// Seed mock responses data
const MOCK_RESPONSES = [
  { id: "101", name: "Amar Singh", college: "IIT Bombay", submittedAt: "2026-07-22 10:30 AM", status: "Pass" },
  { id: "102", name: "Bhavna Patel", college: "BITS Pilani", submittedAt: "2026-07-21 02:45 PM", status: "Pass" },
  { id: "103", name: "Chirag Sharma", college: "VIT Vellore", submittedAt: "2026-07-20 11:15 AM", status: "Pending Review" }
];

function SuperAdminQuestionnaires() {
  const [questionnaires, setQuestionnaires] = useState(MOCK_QUESTIONNAIRES);
  const [responses, setResponses] = useState(MOCK_RESPONSES);
  
  const [viewMode, setViewMode] = useState<"dashboard" | "builder" | "responses">("dashboard");
  const [selectedResponse, setSelectedResponse] = useState<any>(null);

  // Builder States
  const [builderTitle, setBuilderTitle] = useState("New Questionnaire Title");
  const [builderDesc, setBuilderDesc] = useState("Please provide detailed answers to each item.");
  const [questions, setQuestions] = useState<any[]>([
    { id: "q1", title: "Why do you want to join the APEX AI cohort?", type: "long_text", required: true },
    { id: "q2", title: "Rate your Python / PyTorch development skills.", type: "rating", required: true }
  ]);

  const handleAddQuestion = () => {
    const newQ = {
      id: `q-${Date.now()}`,
      title: "",
      type: "short_text",
      required: false
    };
    setQuestions(prev => [...prev, newQ]);
  };

  const handleUpdateQuestion = (id: string, updatedQ: any) => {
    setQuestions(prev => prev.map(q => q.id === id ? updatedQ : q));
  };

  const handleDeleteQuestion = (id: string) => {
    setQuestions(prev => prev.filter(q => q.id !== id));
  };

  const handleMoveQuestion = (idx: number, direction: "up" | "down") => {
    const nextIdx = direction === "up" ? idx - 1 : idx + 1;
    if (nextIdx < 0 || nextIdx >= questions.length) return;
    const newQs = [...questions];
    const temp = newQs[idx];
    newQs[idx] = newQs[nextIdx];
    newQs[nextIdx] = temp;
    setQuestions(newQs);
  };

  const handleDuplicateQuestion = (idx: number) => {
    const target = questions[idx];
    const copy = { ...target, id: `q-${Date.now()}`, title: `${target.title} (Copy)` };
    const newQs = [...questions];
    newQs.splice(idx + 1, 0, copy);
    setQuestions(newQs);
  };

  const handlePublish = () => {
    const newSurvey = {
      id: `q-survey-${Date.now()}`,
      title: builderTitle,
      version: "v1.0",
      questionsCount: questions.length,
      status: "Published",
      createdBy: "Dr. Hemlata",
      createdDate: new Date().toISOString().split("T")[0],
      responses: 0
    };
    setQuestionnaires(prev => [newSurvey, ...prev]);
    toast.success("Questionnaire published successfully!");
    setViewMode("dashboard");
  };

  return (
    <AdminLayout>
      <PageHeader 
        title="Super Admin Questionnaires" 
        description="Design intake questionnaires, evaluate answers responses datasets, and customize surveys curriculum milestones."
        path="/super-admin/questionnaires"
      />

      {/* Internal Navigation Header Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button 
          onClick={() => setViewMode("dashboard")}
          className={`px-6 py-3 text-xs font-black capitalize transition-all border-b-2 -mb-px ${
            viewMode === "dashboard" ? "border-[#FF7A00] text-[#FF7A00]" : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          All Surveys ({questionnaires.length})
        </button>
        <button 
          onClick={() => setViewMode("builder")}
          className={`px-6 py-3 text-xs font-black capitalize transition-all border-b-2 -mb-px ${
            viewMode === "builder" ? "border-[#FF7A00] text-[#FF7A00]" : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          Intake Form Builder
        </button>
        <button 
          onClick={() => setViewMode("responses")}
          className={`px-6 py-3 text-xs font-black capitalize transition-all border-b-2 -mb-px ${
            viewMode === "responses" ? "border-[#FF7A00] text-[#FF7A00]" : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          Submissions List
        </button>
      </div>

      {viewMode === "dashboard" && (
        <div className="space-y-6">
          {/* Dashboard Summary Statistics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm text-left">
              <span className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Total Questionnaires</span>
              <span className="text-2xl font-black text-gray-900">{questionnaires.length}</span>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm text-left">
              <span className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Published</span>
              <span className="text-2xl font-black text-emerald-600">{questionnaires.filter(q => q.status === "Published").length}</span>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm text-left">
              <span className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Drafts Queue</span>
              <span className="text-2xl font-black text-gray-500">{questionnaires.filter(q => q.status === "Draft").length}</span>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm text-left">
              <span className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Responses Received</span>
              <span className="text-2xl font-black text-[#FF7A00]">{responses.length} Submissions</span>
            </div>
          </div>

          <ContentContainer>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Questionnaire Title</th>
                    <th className="py-3 px-4">Version</th>
                    <th className="py-3 px-4">Questions</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Creator</th>
                    <th className="py-3 px-4">Responses</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {questionnaires.map((survey) => (
                    <tr key={survey.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-black text-gray-900">{survey.title}</div>
                        <div className="text-[10px] text-gray-400 font-medium">Created: {survey.createdDate}</div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-gray-750">{survey.version}</td>
                      <td className="py-3.5 px-4 font-bold text-gray-800">{survey.questionsCount} items</td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                          survey.status === "Published" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-gray-100 text-gray-650"
                        }`}>
                          {survey.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-gray-500 font-medium">{survey.createdBy}</td>
                      <td className="py-3.5 px-4 font-extrabold text-gray-900">{survey.responses}</td>
                      <td className="py-3.5 px-4 text-right">
                        <button className="px-3 py-1.5 bg-gray-50 hover:bg-orange-50 hover:text-[#FF7A00] rounded-xl text-[10px] font-bold text-gray-600 border border-transparent hover:border-orange-100 transition-all">
                          Edit Survey
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ContentContainer>
        </div>
      )}

      {viewMode === "builder" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Editor Column */}
          <div className="bg-white border border-gray-150 rounded-3xl p-6 space-y-6">
            <div className="border-b border-gray-100 pb-4 space-y-4">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Questionnaire Settings</span>
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Title</label>
                <input 
                  type="text" 
                  value={builderTitle} 
                  onChange={(e) => setBuilderTitle(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-250 rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none focus:bg-white transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Description Help Text</label>
                <input 
                  type="text" 
                  value={builderDesc} 
                  onChange={(e) => setBuilderDesc(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-250 rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Questions Builder Stack */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Questions ({questions.length})</span>
                <button 
                  onClick={handleAddQuestion}
                  className="flex items-center gap-1 px-3 py-1.5 bg-[#FF7A00] hover:bg-orange-600 rounded-xl text-[10px] font-black text-white shadow-sm transition-all"
                >
                  <Plus className="size-3.5" /> Add Question
                </button>
              </div>

              <div className="space-y-4">
                {questions.map((q, idx) => (
                  <QuestionCard 
                    key={q.id}
                    question={q}
                    onUpdate={(updated) => handleUpdateQuestion(q.id, updated)}
                    onDelete={() => handleDeleteQuestion(q.id)}
                    onMoveUp={() => handleMoveQuestion(idx, "up")}
                    onMoveDown={() => handleMoveQuestion(idx, "down")}
                    onDuplicate={() => handleDuplicateQuestion(idx)}
                  />
                ))}
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4 flex gap-3">
              <button 
                onClick={handlePublish}
                className="px-4 py-2 bg-[#FF7A00] hover:bg-orange-600 rounded-xl text-xs font-black text-white shadow-sm transition-all"
              >
                Publish Questionnaire
              </button>
              <button className="px-4 py-2 bg-white border border-gray-250 hover:border-gray-900 text-xs font-black text-gray-800 rounded-xl transition-all">
                Save Draft
              </button>
            </div>
          </div>

          {/* Live Preview Column */}
          <div className="space-y-3 lg:sticky lg:top-6">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Live Student Preview</span>
            <QuestionPreview questions={questions} title={builderTitle} desc={builderDesc} />
          </div>
        </div>
      )}

      {viewMode === "responses" && (
        <div className="space-y-6">
          <ContentContainer>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">College</th>
                    <th className="py-3 px-4">Submission Time</th>
                    <th className="py-3 px-4">Result Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {responses.map((resp) => (
                    <tr key={resp.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-black text-gray-900">{resp.name}</td>
                      <td className="py-3.5 px-4 font-semibold text-gray-800">{resp.college}</td>
                      <td className="py-3.5 px-4 text-gray-500 font-medium">{resp.submittedAt}</td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                          resp.status === "Pass" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-amber-50 text-amber-600 border border-amber-100"
                        }`}>
                          {resp.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button 
                          onClick={() => setSelectedResponse(resp)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-50 hover:bg-orange-50 hover:text-[#FF7A00] rounded-xl text-[10px] font-bold text-gray-600 border border-transparent hover:border-orange-100 transition-all"
                        >
                          <Eye className="size-3.5" /> View Answer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ContentContainer>

          <ResponseDrawer 
            response={selectedResponse} 
            onClose={() => setSelectedResponse(null)} 
          />
        </div>
      )}
    </AdminLayout>
  );
}
