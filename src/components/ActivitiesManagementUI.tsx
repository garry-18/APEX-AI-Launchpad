import React, { useState } from "react";
import { Link } from "@tanstack/react-router";
import { 
  Users, UserPlus, ShieldAlert, Sparkles, Calendar, BookOpen, Clock, Send, Trophy, 
  ChevronRight, AlertCircle, ArrowUpRight, TrendingUp, BarChart3, Database, ShieldCheck,
  X, Check, AlertTriangle, Play, Download, Mail, UserCheck, Eye, Terminal, Star, ExternalLink
} from "lucide-react";
import { ProgressCircle } from "./InternManagementUI";

// Activities Review Status Badge
export function ActivityReviewBadge({ status }: { status: string }) {
  const badgeColors: Record<string, string> = {
    "Pending Review": "bg-amber-50 text-amber-600 border-amber-100 animate-pulse",
    "Approved": "bg-emerald-50 text-emerald-600 border-emerald-100",
    "Rejected": "bg-red-50 text-red-600 border-red-100",
    "Resubmission Required": "bg-orange-50 text-orange-600 border-orange-100",
    "Skipped": "bg-purple-50 text-purple-600 border-purple-100",
    "Interview Eligible": "bg-blue-50 text-blue-600 border-blue-100",
    "Interview Scheduled": "bg-cyan-50 text-cyan-600 border-cyan-100",
  };

  const label = status || "Pending Review";
  const colorClass = badgeColors[label] || "bg-gray-50 text-gray-500 border-gray-150";

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-black border uppercase tracking-wider ${colorClass}`}>
      {label}
    </span>
  );
}

// Activity Review Details Drawer
export function ActivityDrawer({ 
  student, 
  onClose,
  onApprove,
  onReject,
  onSkipReview
}: { 
  student: any; 
  onClose: () => void;
  onApprove: (id: string, notes: string) => void;
  onReject: (id: string, notes: string) => void;
  onSkipReview: (id: string) => void;
}) {
  const [activeTab, setActiveTab] = useState("submissions");
  const [adminNotes, setAdminNotes] = useState("");

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
          {["submissions", "timeline", "review-action"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-xs font-black capitalize transition-all border-b-2 -mb-px ${
                activeTab === tab 
                  ? "border-[#FF7A00] text-[#FF7A00]" 
                  : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
            >
              {tab === "review-action" ? "Dossier Action" : tab}
            </button>
          ))}
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === "submissions" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-gray-50 p-4 rounded-2xl border border-gray-150">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Submission Dossier</span>
                <a 
                  href="https://github.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-gray-250 hover:border-gray-900 text-xs font-semibold text-gray-700 rounded-xl transition-all"
                >
                  <ExternalLink className="size-4" /> Open Drive/Github Link
                </a>
              </div>

              <div className="space-y-2 text-xs">
                <div className="font-extrabold text-gray-900">Current Onboarding Phase: {student.problemStatement}</div>
                <p className="text-gray-550 leading-relaxed">
                  Student uploaded all required source files and deployment checklists matching activity template 7 criteria.
                </p>
              </div>
            </div>
          )}

          {activeTab === "timeline" && (
            <div className="space-y-4">
              <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider">Milestone Timeline Progress</h4>
              
              <div className="space-y-4">
                {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                  <div key={num} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`size-5 rounded-full text-white flex items-center justify-center text-[8px] font-black ${
                        num <= student.completedCount ? "bg-orange-500" : "bg-gray-200"
                      }`}>
                        ✓
                      </div>
                      {num < 7 && <div className="w-0.5 h-8 bg-gray-150" />}
                    </div>
                    <div className="space-y-0.5 pt-0.5">
                      <h5 className="text-[11px] font-black text-gray-800">Activity {num}</h5>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                        {num <= student.completedCount ? "Completed" : "Pending"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "review-action" && (
            <div className="space-y-4">
              <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider">Audit Decision Remarks</h4>
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Feedback Notes</label>
                <textarea 
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Provide remarks visible to the student (e.g. Excellent work, or Request README edits)"
                  className="w-full bg-gray-50 border border-gray-250 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:bg-white h-24 transition-all"
                />
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <button 
                  onClick={() => onApprove(student.id, adminNotes)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-sm transition-all"
                >
                  Approve Submission
                </button>
                <button 
                  onClick={() => onReject(student.id, adminNotes)}
                  className="px-4 py-2 bg-red-650 hover:bg-red-700 text-white rounded-xl text-xs font-black shadow-sm transition-all"
                >
                  Request Changes
                </button>
                <button 
                  onClick={() => onSkipReview(student.id)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-black transition-all"
                >
                  Skip Review
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
