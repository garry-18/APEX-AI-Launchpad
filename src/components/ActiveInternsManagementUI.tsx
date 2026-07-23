import React, { useState } from "react";
import { Link } from "@tanstack/react-router";
import { 
  Users, UserPlus, ShieldAlert, Sparkles, Calendar, BookOpen, Clock, Send, Trophy, 
  ChevronRight, AlertCircle, ArrowUpRight, TrendingUp, BarChart3, Database, ShieldCheck,
  X, Check, AlertTriangle, Play, Download, Mail, UserCheck, Eye, Terminal, Star
} from "lucide-react";
import { StatusBadge, ProgressCircle } from "./InternManagementUI";

// Active Status Badge Helper Component
export function ActiveStatusBadge({ status }: { status: string }) {
  const badgeColors: Record<string, string> = {
    "Available": "bg-emerald-50 text-emerald-600 border-emerald-100",
    "Working": "bg-blue-50 text-blue-600 border-blue-100",
    "Busy": "bg-amber-50 text-amber-600 border-amber-100",
    "On Leave": "bg-orange-50 text-orange-600 border-orange-100",
    "Inactive": "bg-red-50 text-red-600 border-red-100",
    "Completed": "bg-teal-50 text-teal-600 border-teal-100",
  };

  const label = status || "Available";
  const colorClass = badgeColors[label] || "bg-gray-50 text-gray-500 border-gray-150";

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-black border uppercase tracking-wider ${colorClass}`}>
      {label}
    </span>
  );
}

// Active Intern Profile Drawer Component
export function ActiveInternDrawer({ 
  intern, 
  onClose, 
  onAssignProject 
}: { 
  intern: any; 
  onClose: () => void;
  onAssignProject: (id: string, projectData: any) => void;
}) {
  const [activeTab, setActiveTab] = useState("project");
  const [selectedProblem, setSelectedProblem] = useState("");
  const [selectedMentor, setSelectedMentor] = useState("");

  if (!intern) return null;

  const handleProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAssignProject(intern.id, {
      problemStatement: selectedProblem,
      mentor: selectedMentor
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex justify-end animate-in fade-in duration-300">
      <div className="w-full max-w-xl bg-white h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-orange-100 text-[#FF7A00] flex items-center justify-center font-bold text-sm">
              {intern.name[0]}
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-900 leading-tight">{intern.name}</h3>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{intern.college}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="size-8 rounded-xl hover:bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-900"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-gray-100 px-4 bg-gray-50">
          {["project", "performance", "attendance", "diary", "ai"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-xs font-black capitalize transition-all border-b-2 -mb-px ${
                activeTab === tab 
                  ? "border-[#FF7A00] text-[#FF7A00]" 
                  : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === "project" && (
            <div className="space-y-6">
              <div className="bg-gray-50 border border-gray-100 rounded-3xl p-5 space-y-3">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Assigned Project & Mentor</span>
                <div className="text-xs space-y-1">
                  <div className="font-extrabold text-gray-900">Problem Statement: {intern.problemStatement || "Not Assigned"}</div>
                  <div className="text-gray-500 font-medium">Assigned Mentor: {intern.mentor || "Not Assigned"}</div>
                </div>
              </div>

              <form onSubmit={handleProjectSubmit} className="space-y-4">
                <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider">Assign / Reassign Project</h4>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Problem Statement</label>
                  <select 
                    value={selectedProblem}
                    onChange={(e) => setSelectedProblem(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-250 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                    required
                  >
                    <option value="">Select Problem Statement</option>
                    <option value="LLM Finetuning Engine">LLM Finetuning Engine</option>
                    <option value="AI Vector Database Sync">AI Vector Database Sync</option>
                    <option value="Serverless GPU Orchestrator">Serverless GPU Orchestrator</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Assigned Mentor</label>
                  <select 
                    value={selectedMentor}
                    onChange={(e) => setSelectedMentor(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-250 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                    required
                  >
                    <option value="">Select Mentor</option>
                    <option value="Dr. Hemlata">Dr. Hemlata</option>
                    <option value="Prof. Satish">Prof. Satish</option>
                    <option value="Amit Kumar">Amit Kumar</option>
                  </select>
                </div>

                <button 
                  type="submit"
                  className="w-full py-2 bg-[#FF7A00] hover:bg-orange-600 rounded-xl text-xs font-black text-white shadow-sm transition-all"
                >
                  Save Project Assignment
                </button>
              </form>
            </div>
          )}

          {activeTab === "performance" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white border border-gray-100 rounded-3xl p-5 flex flex-col items-center justify-center text-center space-y-2">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Performance Score</span>
                  <ProgressCircle pct={intern.performanceScore} size={64} />
                  <span className="text-xs font-black text-gray-800">Grade: A+</span>
                </div>

                <div className="bg-white border border-gray-100 rounded-3xl p-5 flex flex-col justify-between space-y-2 text-xs">
                  <div className="flex justify-between border-b border-gray-55 pb-2">
                    <span className="text-gray-400 font-bold">Tasks Completed</span>
                    <span className="font-extrabold text-gray-900">92%</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-55 pb-2">
                    <span className="text-gray-400 font-bold">Repo Commits</span>
                    <span className="font-extrabold text-[#FF7A00]">128 Commits</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-bold">Mentor Rating</span>
                    <span className="font-extrabold text-gray-900">4.8 / 5.0</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "attendance" && (
            <div className="space-y-4">
              <div className="bg-gray-50 border border-gray-100 rounded-3xl p-5 flex justify-between items-center">
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Attendance Summary</span>
                  <div className="text-2xl font-black text-gray-900">{intern.attendance}%</div>
                </div>
                <div className="text-right text-xs space-y-1">
                  <div className="text-emerald-600 font-black">24 Days Present</div>
                  <div className="text-gray-450 font-bold">0 Days Absent</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "diary" && (
            <div className="space-y-4 text-xs">
              <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider">Latest Daily Diary Submissions</h4>
              <div className="space-y-3">
                <div className="bg-white border border-gray-100 p-4 rounded-2xl space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-black text-gray-800">Weekly Progress Update - Milestone 7</span>
                    <span className="text-[8px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full">Approved</span>
                  </div>
                  <p className="text-[10px] text-gray-500 leading-normal">
                    Completed LLM weights finetuning on target datasets. Prepared training scripts and verified metrics outputs.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "ai" && (
            <div className="space-y-6">
              <div className="bg-gray-50 border border-gray-150 rounded-3xl p-5 space-y-4 text-xs">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">APEX AI Talent Profile</span>
                
                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-gray-700">Skill Growth & Learning Index</span>
                      <span className="text-[#FF7A00]">95%</span>
                    </div>
                    <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-[#FF7A00] h-full" style={{ width: "95%" }} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-gray-700">Problem Solving & Architecture</span>
                      <span className="text-blue-600">88%</span>
                    </div>
                    <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-blue-600 h-full" style={{ width: "88%" }} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-gray-700">Consistency & Execution Delivery</span>
                      <span className="text-emerald-600">92%</span>
                    </div>
                    <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-600 h-full" style={{ width: "92%" }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
