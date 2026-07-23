import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { 
  Users, Calendar, Clock, Sparkles, Plus, AlertTriangle, FileText, ArrowLeft
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { StudentCheckInCard, ApplyLeaveDialog } from "@/components/AttendanceManagementUI";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/student/attendance")({
  head: () => ({ meta: [{ title: "Student Shift Attendance — APEX AI" }] }),
  component: StudentAttendanceView,
});

function StudentAttendanceView() {
  const [shiftRecord, setShiftRecord] = useState<any>(null);
  const [showApplyLeave, setShowApplyLeave] = useState(false);

  const handleCheckIn = () => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setShiftRecord({
      checkIn: timeStr,
      checkOut: null,
      workingHours: 0
    });
    toast.success("Check-In Registered Successfully!");
  };

  const handleCheckOut = () => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setShiftRecord(prev => ({
      ...prev,
      checkOut: timeStr,
      workingHours: 8
    }));
    toast.success("Check-Out Registered Successfully!");
  };

  const handleLeaveRequest = (data: any) => {
    toast.success(`Leave request for ${data.type} submitted successfully!`);
    setShowApplyLeave(false);
  };

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-black text-gray-900">Shift Attendance Dashboard</h2>
            <p className="text-xs text-gray-500">Log daily shift check-ins, record working hours, and apply for leaves.</p>
          </div>
          <button 
            onClick={() => setShowApplyLeave(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#FF7A00] hover:bg-orange-600 rounded-xl text-xs font-black text-white shadow-sm transition-all"
          >
            <Plus className="size-4" /> Apply for Leave
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <StudentCheckInCard 
              attendanceRecord={shiftRecord} 
              onCheckIn={handleCheckIn} 
              onCheckOut={handleCheckOut} 
            />

            {/* Attendance Analytics Metrics */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Attendance Summary</span>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-150">
                  <div className="text-xl font-black text-[#FF7A00]">94%</div>
                  <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-1 block">Monthly Rate</span>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-150">
                  <div className="text-xl font-black text-emerald-600">24 Days</div>
                  <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-1 block">Present</span>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-150">
                  <div className="text-xl font-black text-red-500">1 Day</div>
                  <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-1 block">Absent</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-3">Holiday Calendar</span>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                  <span className="font-bold text-gray-800">Independence Day</span>
                  <span className="text-[9px] text-gray-400">Aug 15</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                  <span className="font-bold text-gray-800">Ganesh Chaturthi</span>
                  <span className="text-[9px] text-gray-400">Sep 07</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showApplyLeave && (
        <ApplyLeaveDialog 
          onClose={() => setShowApplyLeave(false)} 
          onSubmit={(data) => handleLeaveRequest(data)} 
        />
      )}
    </AppShell>
  );
}
