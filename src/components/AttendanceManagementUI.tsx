import React, { useState } from "react";
import { Link } from "@tanstack/react-router";
import { 
  Users, UserPlus, ShieldAlert, Sparkles, Calendar, BookOpen, Clock, Send, Trophy, 
  ChevronRight, AlertCircle, ArrowUpRight, TrendingUp, BarChart3, Database, ShieldCheck,
  X, Check, AlertTriangle, Play, Download, Mail, UserCheck, Eye, Terminal, Star, Clock4
} from "lucide-react";

// Attendance state Badge Component
export function AttendanceStateBadge({ status }: { status: string }) {
  const badgeColors: Record<string, string> = {
    "Present": "bg-emerald-50 text-emerald-600 border-emerald-100",
    "Absent": "bg-red-50 text-red-600 border-red-100",
    "Late": "bg-amber-50 text-amber-600 border-amber-100",
    "Half Day": "bg-orange-50 text-orange-600 border-orange-100",
    "Leave": "bg-blue-50 text-blue-600 border-blue-100",
  };
  const label = status || "Present";
  const colorClass = badgeColors[label] || "bg-gray-50 text-gray-500 border-gray-150";

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-black border uppercase tracking-wider ${colorClass}`}>
      {label}
    </span>
  );
}

// Leave Status Badge Component
export function LeaveStatusBadge({ status }: { status: string }) {
  const badgeColors: Record<string, string> = {
    "Pending": "bg-amber-50 text-amber-600 border-amber-100 animate-pulse",
    "Approved": "bg-emerald-50 text-emerald-600 border-emerald-100",
    "Rejected": "bg-red-50 text-red-600 border-red-100",
  };
  const label = status || "Pending";
  const colorClass = badgeColors[label] || "bg-gray-50 text-gray-500 border-gray-150";

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-black border uppercase tracking-wider ${colorClass}`}>
      {label}
    </span>
  );
}

// Student Check-In Activity Panel Card
export function StudentCheckInCard({ 
  attendanceRecord, 
  onCheckIn, 
  onCheckOut 
}: { 
  attendanceRecord: any; 
  onCheckIn: () => void; 
  onCheckOut: () => void; 
}) {
  return (
    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider">Session Shift Log</h4>
        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{new Date().toDateString()}</span>
      </div>

      <div className="grid grid-cols-2 gap-4 text-xs">
        <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-150">
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Check In Time</span>
          <span className="font-semibold text-gray-900">{attendanceRecord?.checkIn || "--:--"}</span>
        </div>
        <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-150">
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Check Out Time</span>
          <span className="font-semibold text-gray-900">{attendanceRecord?.checkOut || "--:--"}</span>
        </div>
      </div>

      <div className="flex gap-3">
        {!attendanceRecord?.checkIn ? (
          <button 
            onClick={onCheckIn}
            className="w-full py-2.5 bg-[#FF7A00] hover:bg-orange-600 rounded-xl text-xs font-black text-white shadow-sm transition-all"
          >
            Check In Shift
          </button>
        ) : !attendanceRecord?.checkOut ? (
          <button 
            onClick={onCheckOut}
            className="w-full py-2.5 bg-gray-900 hover:bg-black rounded-xl text-xs font-black text-white shadow-sm transition-all"
          >
            Check Out Shift
          </button>
        ) : (
          <div className="w-full text-center py-2.5 bg-emerald-50 text-emerald-600 rounded-xl font-bold text-xs">
            Shift Completed ({attendanceRecord.workingHours} Hours Logged)
          </div>
        )}
      </div>
    </div>
  );
}

// Apply Leave Request Form Dialog Component
export function ApplyLeaveDialog({ 
  onClose, 
  onSubmit 
}: { 
  onClose: () => void; 
  onSubmit: (leaveData: any) => void;
}) {
  const [type, setType] = useState("Sick Leave");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [reason, setReason] = useState("");

  const handleLeaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      type,
      from,
      to,
      reason
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 grid place-items-center p-4 animate-in fade-in duration-200">
      <form 
        onSubmit={handleLeaveSubmit}
        className="bg-white rounded-3xl p-6 max-w-md w-full border border-gray-100 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200"
      >
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider">Apply for Leave Request</h4>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-955">
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Leave Category</label>
            <select 
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full bg-gray-50 border border-gray-250 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
            >
              <option value="Sick Leave">Sick Leave</option>
              <option value="Personal Leave">Personal Leave</option>
              <option value="Emergency Leave">Emergency Leave</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">From Date</label>
              <input 
                type="date" 
                value={from} 
                onChange={(e) => setFrom(e.target.value)}
                className="w-full bg-gray-50 border border-gray-250 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">To Date</label>
              <input 
                type="date" 
                value={to} 
                onChange={(e) => setTo(e.target.value)}
                className="w-full bg-gray-50 border border-gray-250 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Reason Details</label>
            <textarea 
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Provide reason remarks for leave approval..."
              className="w-full bg-gray-50 border border-gray-250 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:bg-white h-20 transition-all"
              required
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
            className="px-4 py-2 bg-[#FF7A00] hover:bg-orange-600 rounded-xl text-xs font-black text-white shadow-sm transition-all"
          >
            Submit Leave Request
          </button>
        </div>
      </form>
    </div>
  );
}
