import React, { useState } from "react";
import { Link } from "@tanstack/react-router";
import { 
  Users, UserPlus, ShieldAlert, Sparkles, Calendar, BookOpen, Clock, Send, Trophy, 
  ChevronRight, AlertCircle, ArrowUpRight, TrendingUp, BarChart3, Database, ShieldCheck,
  X, Check, AlertTriangle, Play, Download, Mail, UserCheck, Eye, Terminal, Star
} from "lucide-react";
import { ProgressCircle } from "./InternManagementUI";

// LMS Status Badge Component
export function LMSStatusBadge({ status }: { status: string }) {
  const badgeColors: Record<string, string> = {
    "Not Started": "bg-gray-100 text-gray-500 border-gray-200",
    "In Progress": "bg-blue-50 text-blue-600 border-blue-100 animate-pulse",
    "Completed": "bg-emerald-50 text-emerald-600 border-emerald-100",
    "Certificate Earned": "bg-purple-50 text-purple-600 border-purple-100",
  };

  const label = status || "In Progress";
  const colorClass = badgeColors[label] || "bg-gray-50 text-gray-500 border-gray-150";

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-black border uppercase tracking-wider ${colorClass}`}>
      {label}
    </span>
  );
}

// LMS Course Progress Details Drawer
export function LMSDrawer({ 
  student, 
  onClose,
  onSendReminder 
}: { 
  student: any; 
  onClose: () => void;
  onSendReminder: (type: string) => void;
}) {
  const [activeTab, setActiveTab] = useState("course");

  if (!student) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex justify-end animate-in fade-in duration-300">
      <div className="w-full max-w-xl bg-white h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-orange-100 text-[#FF7A00] flex items-center justify-center font-bold text-sm">
              {student.name[0]}
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-900 leading-tight">{student.name}</h3>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{student.college}</p>
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
          {["course", "timeline", "actions"].map((tab) => (
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
          {activeTab === "course" && (
            <div className="space-y-6">
              <div className="bg-gray-50 border border-gray-100 rounded-3xl p-5 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Assigned Course</span>
                  <div className="text-xs font-black text-gray-900 leading-tight">{student.course}</div>
                </div>
                <ProgressCircle pct={student.progress} size={48} />
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider">Module Completion Metrics</h4>
                <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-3 text-xs">
                  <div className="flex justify-between border-b border-gray-50 pb-2">
                    <span className="text-gray-450 font-semibold">Total Modules</span>
                    <span className="font-extrabold text-gray-800">12 Modules</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-50 pb-2">
                    <span className="text-gray-450 font-semibold">Learning Hours</span>
                    <span className="font-extrabold text-gray-800">{student.learningHours} Hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-450 font-semibold">Last LMS Activity</span>
                    <span className="font-extrabold text-[#FF7A00]">{student.lastActivity}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "timeline" && (
            <div className="space-y-4">
              <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider">LMS Event Timeline</h4>
              
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="size-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[8px] font-black">✓</div>
                    <div className="w-0.5 h-8 bg-gray-150" />
                  </div>
                  <div className="space-y-0.5 pt-0.5">
                    <h5 className="text-[11px] font-black text-gray-800">Course Registered</h5>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">2026-07-15 10:00 AM</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="size-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[8px] font-black">✓</div>
                    <div className="w-0.5 h-8 bg-gray-150" />
                  </div>
                  <div className="space-y-0.5 pt-0.5">
                    <h5 className="text-[11px] font-black text-gray-800">Module 1 Completed</h5>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">2026-07-17 04:30 PM</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="size-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[8px] font-black">→</div>
                  </div>
                  <div className="space-y-0.5 pt-0.5">
                    <h5 className="text-[11px] font-black text-gray-800">Milestone Quiz 2 In Progress</h5>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{student.lastActivity}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "actions" && (
            <div className="space-y-4">
              <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider">Send Reminders</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button 
                  onClick={() => onSendReminder("Continue Learning")}
                  className="bg-gray-50 border border-gray-150 hover:border-gray-900 p-4 rounded-2xl text-left space-y-1 transition-all"
                >
                  <div className="text-xs font-black text-gray-900">Continue Learning</div>
                  <p className="text-[9px] text-gray-400 leading-normal">Prompt the intern to pick up where they left off.</p>
                </button>

                <button 
                  onClick={() => onSendReminder("Deadline Reminder")}
                  className="bg-gray-50 border border-gray-150 hover:border-gray-900 p-4 rounded-2xl text-left space-y-1 transition-all"
                >
                  <div className="text-xs font-black text-gray-900">Deadline Reminder</div>
                  <p className="text-[9px] text-gray-400 leading-normal">Warn about upcoming syllabus completion dates.</p>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
