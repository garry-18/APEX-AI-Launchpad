import React, { useState } from "react";
import { Link } from "@tanstack/react-router";
import { 
  Users, UserPlus, ShieldAlert, Sparkles, Calendar, BookOpen, Clock, Send, Trophy, 
  ChevronRight, AlertCircle, ArrowUpRight, TrendingUp, BarChart3, Database, ShieldCheck,
  X, Check, AlertTriangle, Play, Download, Mail, UserCheck, Eye, Terminal, Star, Video, MapPin
} from "lucide-react";

// Status Badge for Activity Review state in interactions
export function InteractionActivityBadge({ status }: { status: string }) {
  const badgeColors: Record<string, string> = {
    "Pending Review": "bg-amber-50 text-amber-600 border-amber-100 animate-pulse",
    "Under Review": "bg-blue-50 text-blue-600 border-blue-100",
    "Approved": "bg-emerald-50 text-emerald-600 border-emerald-100",
    "Rejected": "bg-red-50 text-red-600 border-red-100",
    "Skipped by Admin": "bg-purple-50 text-purple-600 border-purple-100",
  };
  const label = status || "Pending Review";
  const colorClass = badgeColors[label] || "bg-gray-50 text-gray-500 border-gray-150";

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-black border uppercase tracking-wider ${colorClass}`}>
      {label}
    </span>
  );
}

// Status Badge for Interview outcome state
export function InterviewOutcomeBadge({ status }: { status: string }) {
  const badgeColors: Record<string, string> = {
    "Waiting": "bg-gray-100 text-gray-550 border-gray-200",
    "Scheduled": "bg-cyan-50 text-cyan-600 border-cyan-100 animate-pulse",
    "Rescheduled": "bg-orange-50 text-orange-600 border-orange-100",
    "Completed": "bg-teal-50 text-teal-600 border-teal-100",
    "Cancelled": "bg-red-50 text-red-655 border-red-100",
    "Selected": "bg-emerald-50 text-emerald-600 border-emerald-100",
    "Rejected": "bg-red-50 text-red-600 border-red-100",
    "Hold": "bg-amber-50 text-amber-600 border-amber-100",
  };
  const label = status || "Waiting";
  const colorClass = badgeColors[label] || "bg-gray-50 text-gray-500 border-gray-150";

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-black border uppercase tracking-wider ${colorClass}`}>
      {label}
    </span>
  );
}

// Schedule Interview Modal Component
export function ScheduleInterviewModal({ 
  student, 
  onClose, 
  onSchedule 
}: { 
  student: any; 
  onClose: () => void; 
  onSchedule: (scheduleData: any) => void;
}) {
  const [interviewer, setInterviewer] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [mode, setMode] = useState("Online");
  const [link, setLink] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSchedule({
      interviewer,
      date,
      time,
      mode,
      link
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 grid place-items-center p-4 animate-in fade-in duration-200">
      <form 
        onSubmit={handleSubmit}
        className="bg-white rounded-3xl p-6 max-w-md w-full border border-gray-100 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200"
      >
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider">Schedule Interview: {student?.name}</h4>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-955">
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Assigned Interviewer</label>
            <select 
              value={interviewer}
              onChange={(e) => setInterviewer(e.target.value)}
              className="w-full bg-gray-50 border border-gray-250 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
              required
            >
              <option value="">Select Interviewer</option>
              <option value="Dr. Hemlata">Dr. Hemlata</option>
              <option value="Prof. Satish">Prof. Satish</option>
              <option value="Amit Kumar">Amit Kumar</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Date</label>
              <input 
                type="date" 
                value={date} 
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-gray-50 border border-gray-250 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Time</label>
              <input 
                type="time" 
                value={time} 
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-gray-50 border border-gray-250 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Meeting Mode</label>
            <select 
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="w-full bg-gray-50 border border-gray-250 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
            >
              <option value="Online">Online (Google Meet)</option>
              <option value="Offline">Offline (On-campus Venue)</option>
            </select>
          </div>

          {mode === "Online" ? (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Google Meet Link</label>
              <input 
                type="url" 
                placeholder="https://meet.google.com/abc-defg-hij"
                value={link} 
                onChange={(e) => setLink(e.target.value)}
                className="w-full bg-gray-50 border border-gray-250 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
              />
            </div>
          ) : (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Venue / Room Number</label>
              <input 
                type="text" 
                placeholder="Main Seminar Auditorium"
                value={link} 
                onChange={(e) => setLink(e.target.value)}
                className="w-full bg-gray-50 border border-gray-250 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button 
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-255 hover:border-gray-900 rounded-xl text-xs font-black text-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit"
            className="px-4 py-2 bg-[#FF7A00] hover:bg-orange-600 rounded-xl text-xs font-black text-white shadow-sm transition-all"
          >
            Confirm Schedule
          </button>
        </div>
      </form>
    </div>
  );
}

// Complete/Evaluate Interview Dialog Modal Component
export function CompleteInterviewModal({ 
  student, 
  onClose, 
  onComplete 
}: { 
  student: any; 
  onClose: () => void; 
  onComplete: (evaluationData: any) => void;
}) {
  const [techRating, setTechRating] = useState("5");
  const [commRating, setCommRating] = useState("5");
  const [decision, setDecision] = useState("Selected");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete({
      techRating,
      commRating,
      decision,
      notes
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 grid place-items-center p-4 animate-in fade-in duration-200">
      <form 
        onSubmit={handleSubmit}
        className="bg-white rounded-3xl p-6 max-w-md w-full border border-gray-100 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200"
      >
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider">Evaluate Outcome: {student?.name}</h4>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-955">
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Technical Rating (1-10)</label>
              <input 
                type="number" 
                min="1" max="10"
                value={techRating} 
                onChange={(e) => setTechRating(e.target.value)}
                className="w-full bg-gray-50 border border-gray-250 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Communication (1-10)</label>
              <input 
                type="number" 
                min="1" max="10"
                value={commRating} 
                onChange={(e) => setCommRating(e.target.value)}
                className="w-full bg-gray-50 border border-gray-250 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Final Decision Outcome</label>
            <select 
              value={decision}
              onChange={(e) => setDecision(e.target.value)}
              className="w-full bg-gray-50 border border-gray-250 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
            >
              <option value="Selected">Selected</option>
              <option value="Rejected">Rejected</option>
              <option value="Hold">Hold / On Waitlist</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Evaluation Comments</label>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Record final assessment notes remarks..."
              className="w-full bg-gray-50 border border-gray-250 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:bg-white h-20 transition-all"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button 
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-255 hover:border-gray-900 rounded-xl text-xs font-black text-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-sm transition-all"
          >
            Submit evaluation
          </button>
        </div>
      </form>
    </div>
  );
}
