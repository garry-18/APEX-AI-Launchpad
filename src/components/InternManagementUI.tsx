import React, { useState } from "react";
import { Link } from "@tanstack/react-router";
import { 
  Search, SlidersHorizontal, ArrowUpDown, MoreVertical, Eye, FileText, 
  BookOpen, Sparkles, Calendar, Activity, ChevronRight, CheckCircle2, 
  X, Check, AlertTriangle, Play, Download, Mail, UserCheck, ShieldAlert
} from "lucide-react";

// Status Badge Helper Component
export function StatusBadge({ status }: { status: string }) {
  const badgeColors: Record<string, string> = {
    "Profile Completed": "bg-blue-50 text-blue-600 border-blue-100",
    "Questionnaire Completed": "bg-indigo-50 text-indigo-600 border-indigo-100",
    "LMS Completed": "bg-purple-50 text-purple-600 border-purple-100",
    "Activities Submitted": "bg-orange-50 text-[#FF7A00] border-orange-100",
    "Waiting Review": "bg-amber-50 text-amber-600 border-amber-100 animate-pulse",
    "Review Skipped": "bg-gray-100 text-gray-600 border-gray-200",
    "Interview Scheduled": "bg-cyan-50 text-cyan-600 border-cyan-100",
    "Interview Completed": "bg-teal-50 text-teal-600 border-teal-100",
    "Onboarding Completed": "bg-emerald-50 text-emerald-600 border-emerald-100",
  };

  const label = status || "Onboarding";
  const colorClass = badgeColors[label] || "bg-gray-50 text-gray-500 border-gray-150";

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-black border uppercase tracking-wider ${colorClass}`}>
      {label}
    </span>
  );
}

// Progress Ring/Circle Component
export function ProgressCircle({ pct, size = 40 }: { pct: number, size?: number }) {
  const radius = size * 0.4;
  const stroke = radius * 0.18;
  const circ = 2 * Math.PI * radius;
  const offset = circ * (1 - pct / 100);

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg className="size-full -rotate-90">
        <circle 
          cx={size/2} cy={size/2} r={radius} 
          className="stroke-gray-100 fill-none" 
          strokeWidth={stroke} 
        />
        <circle 
          cx={size/2} cy={size/2} r={radius} 
          className="stroke-[#FF7A00] fill-none transition-all duration-500" 
          strokeWidth={stroke} 
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-[8px] font-black text-gray-800">{pct}%</span>
    </div>
  );
}

// Vertical Timeline Component (Drawer Details)
export function VerticalTimeline({ status, date }: { status: string, date: string }) {
  const steps = [
    { label: "Registration", status: "completed", time: date },
    { label: "Profile Setup", status: "completed", time: "2 hours ago" },
    { label: "Questionnaire Completed", status: "completed", time: "1 hour ago" },
    { label: "LMS Completed", status: status === "LMS Completed" || status === "Activities Submitted" || status === "Waiting Review" || status === "Interview Scheduled" || status === "Interview Completed" || status === "Onboarding Completed" ? "completed" : "pending", time: "30 mins ago" },
    { label: "Activities Submitted", status: status === "Activities Submitted" || status === "Waiting Review" || status === "Interview Scheduled" || status === "Interview Completed" || status === "Onboarding Completed" ? "completed" : "pending", time: "10 mins ago" },
    { label: "Admin Review", status: status === "Review Skipped" ? "skipped" : status === "Interview Scheduled" || status === "Interview Completed" || status === "Onboarding Completed" ? "completed" : status === "Waiting Review" ? "current" : "pending", time: "" },
    { label: "Interview Scheduled", status: status === "Interview Scheduled" || status === "Interview Completed" || status === "Onboarding Completed" ? "completed" : status === "Interview Scheduled" ? "current" : "pending", time: "" },
    { label: "Interview Completed", status: status === "Interview Completed" || status === "Onboarding Completed" ? "completed" : status === "Interview Completed" ? "current" : "pending", time: "" },
    { label: "Onboarding Completed", status: status === "Onboarding Completed" ? "completed" : "pending", time: "" }
  ];

  return (
    <div className="space-y-4">
      {steps.map((step, idx) => {
        let nodeClass = "bg-white border-gray-200 text-gray-300";
        if (step.status === "completed") {
          nodeClass = "bg-emerald-500 border-emerald-500 text-white";
        } else if (step.status === "current") {
          nodeClass = "bg-white border-[#FF7A00] text-[#FF7A00] animate-pulse ring-4 ring-orange-500/10";
        } else if (step.status === "skipped") {
          nodeClass = "bg-gray-200 border-gray-300 text-gray-500";
        }

        return (
          <div key={idx} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className={`size-5 rounded-full border-2 flex items-center justify-center text-[8px] font-black ${nodeClass}`}>
                {step.status === "completed" ? "✓" : step.status === "skipped" ? "→" : idx + 1}
              </div>
              {idx < steps.length - 1 && (
                <div className="w-0.5 h-8 bg-gray-150" />
              )}
            </div>
            <div className="space-y-0.5 pt-0.5">
              <h5 className="text-[11px] font-black text-gray-800">{step.label}</h5>
              {step.time && <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{step.time}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Right Drawer details Component
export function InternDrawer({ 
  intern, 
  onClose, 
  onSkipReview, 
  onScheduleInterview 
}: { 
  intern: any; 
  onClose: () => void;
  onSkipReview: (id: string) => void;
  onScheduleInterview: (id: string) => void;
}) {
  const [activeTab, setActiveTab] = useState("profile");

  if (!intern) return null;

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
          {["profile", "timeline", "review", "interview"].map((tab) => (
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
          {activeTab === "profile" && (
            <div className="space-y-6 text-xs text-gray-700">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-150">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Email Address</span>
                  <span className="font-semibold text-gray-900">{intern.email}</span>
                </div>
                <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-150">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Phone Number</span>
                  <span className="font-semibold text-gray-900">{intern.phone || "+91 9876543210"}</span>
                </div>
                <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-150 col-span-2">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Assigned Department / Branch</span>
                  <span className="font-semibold text-gray-900">{intern.branch || "Computer Science Engineering"}</span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider">Skills</h4>
                <div className="flex flex-wrap gap-1.5">
                  {["React", "TypeScript", "NodeJS", "Tailwind CSS", "Supabase"].map((s) => (
                    <span key={s} className="px-2.5 py-1 bg-orange-50 text-[#FF7A00] border border-orange-100 rounded-lg font-bold text-[10px]">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "timeline" && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 bg-orange-50 border border-orange-100 p-4 rounded-3xl">
                <ProgressCircle pct={intern.progress} size={56} />
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Overall Progress</span>
                  <h4 className="text-xs font-black text-gray-800 leading-tight">Stage: {intern.status}</h4>
                </div>
              </div>
              <VerticalTimeline status={intern.status} date={intern.registeredDate} />
            </div>
          )}

          {activeTab === "review" && (
            <div className="space-y-6">
              <div className="bg-gray-50 border border-gray-100 rounded-3xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-gray-900">Activity Submissions Package</h4>
                  <StatusBadge status={intern.status} />
                </div>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Student submitted 7 out of 7 completed milestone dossiers. Review package contains source code, documentation and deployment URLs.
                </p>

                <div className="flex flex-wrap gap-3">
                  <button 
                    onClick={() => {
                      onSkipReview(intern.id);
                    }}
                    className="px-4 py-2 bg-[#FF7A00] hover:bg-orange-600 rounded-xl text-xs font-black text-white shadow-sm transition-all"
                  >
                    Skip Review & Schedule
                  </button>
                  <button className="px-4 py-2 bg-white border border-gray-250 hover:border-gray-900 text-xs font-black text-gray-800 rounded-xl transition-all">
                    Approve Dossier
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "interview" && (
            <div className="space-y-6">
              <div className="bg-gray-50 border border-gray-100 rounded-3xl p-5 space-y-4">
                <h4 className="text-xs font-black text-gray-900">1-on-1 Interview Schedule</h4>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Arrange coordination calls with available technical staff.
                </p>

                <button 
                  onClick={() => onScheduleInterview(intern.id)}
                  className="px-4 py-2 bg-[#FF7A00] hover:bg-orange-600 rounded-xl text-xs font-black text-white shadow-sm transition-all"
                >
                  Schedule Interview
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
