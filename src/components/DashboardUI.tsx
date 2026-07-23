import React from "react";
import { Link } from "@tanstack/react-router";
import { 
  Users, UserPlus, ShieldAlert, Sparkles, Calendar, BookOpen, Clock, Send, Trophy, 
  ChevronRight, AlertCircle, ArrowUpRight, TrendingUp, BarChart3, Database, ShieldCheck
} from "lucide-react";

// Dashboard Welcome Card Component
export function WelcomeCard({ name, role, totalCount }: { name: string, role: string, totalCount: number }) {
  const hours = new Date().getHours();
  let salutation = "Good Evening";
  if (hours < 12) salutation = "Good Morning";
  else if (hours < 18) salutation = "Good Afternoon";

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-gray-900 to-gray-800 text-white p-6 sm:p-8 shadow-md">
      <div className="relative z-10 space-y-3">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF7A00] bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
          Welcome Back • {role?.replace("_", " ").toUpperCase()}
        </span>
        <h2 className="text-xl sm:text-2xl font-black tracking-tight">
          {salutation}, {name || "Apex Administrator"}!
        </h2>
        <p className="text-xs text-gray-300 max-w-lg leading-relaxed">
          You currently have <span className="text-[#FF7A00] font-black">{totalCount}</span> interns under active management. All system microservices are operating normally.
        </p>
      </div>
      <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-12 translate-y-12">
        <Sparkles className="size-64 text-[#FF7A00]" />
      </div>
    </div>
  );
}

// Dashboard Summary Card Component
export function DashboardCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  color = "text-[#FF7A00]" 
}: { 
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  trend?: string;
  color?: string;
}) {
  return (
    <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between space-y-4 group">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{title}</span>
        <div className={`p-2.5 rounded-xl bg-gray-50 group-hover:bg-orange-50 transition-colors`}>
          <Icon className={`size-4.5 ${color}`} />
        </div>
      </div>
      <div className="space-y-1">
        <div className="text-2xl font-black text-gray-900 leading-none">{value}</div>
        {trend && (
          <div className="flex items-center gap-1 text-[9px] font-bold text-emerald-600">
            <TrendingUp className="size-3" />
            <span>{trend}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Dashboard Quick Action Card Component
export function QuickActionCard({ 
  title, 
  description, 
  icon: Icon, 
  to 
}: { 
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  to: string;
}) {
  return (
    <Link 
      to={to}
      className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm hover:shadow-md hover:border-[#FF7A00]/20 transition-all duration-300 flex items-start gap-4 text-left group"
    >
      <div className="p-3 rounded-2xl bg-orange-50 text-[#FF7A00] shrink-0 group-hover:bg-[#FF7A00] group-hover:text-white transition-colors duration-300">
        <Icon className="size-5" />
      </div>
      <div className="space-y-1 min-w-0">
        <h4 className="text-xs font-black text-gray-900 group-hover:text-[#FF7A00] transition-colors">{title}</h4>
        <p className="text-[10px] text-gray-500 leading-normal line-clamp-2">{description}</p>
      </div>
      <ArrowUpRight className="size-4 text-gray-300 ml-auto shrink-0 group-hover:text-[#FF7A00] transition-colors" />
    </Link>
  );
}

// Pending Work Card Component
export function PendingCard({ 
  title, 
  count, 
  priority, 
  to 
}: { 
  title: string;
  count: number;
  priority: "High" | "Medium" | "Low";
  to: string;
}) {
  const priorityColors = {
    High: "bg-red-50 text-red-600 border-red-100",
    Medium: "bg-amber-50 text-amber-600 border-amber-100",
    Low: "bg-blue-50 text-blue-600 border-blue-100",
  };

  return (
    <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex items-center justify-between gap-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-extrabold text-gray-900">{title}</span>
          <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full border ${priorityColors[priority]}`}>
            {priority}
          </span>
        </div>
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{count} Items Awaiting Action</p>
      </div>
      <Link 
        to={to}
        className="px-3.5 py-1.5 bg-white border border-gray-250 hover:border-gray-900 rounded-xl text-[10px] font-bold text-gray-800 transition-colors"
      >
        Open
      </Link>
    </div>
  );
}

// Recent Activity Item Component
export function RecentActivity({ 
  avatarInitials, 
  name, 
  action, 
  time, 
  status 
}: { 
  avatarInitials: string;
  name: string;
  action: string;
  time: string;
  status?: string;
}) {
  return (
    <div className="flex gap-3 py-3 border-b border-gray-100 last:border-0 items-start">
      <div className="size-7.5 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center font-bold text-[10px] shrink-0">
        {avatarInitials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-gray-900 truncate">{name}</span>
          <span className="text-[9px] text-gray-400 font-medium whitespace-nowrap">{time}</span>
        </div>
        <p className="text-[10px] text-gray-500 mt-0.5 leading-normal">{action}</p>
      </div>
      {status && (
        <span className="text-[8px] font-bold px-2 py-0.5 bg-orange-50 text-[#FF7A00] rounded-full self-start">
          {status}
        </span>
      )}
    </div>
  );
}

// Calendar Schedule Widget Card Component
export function CalendarCard() {
  const events = [
    { time: "10:00 AM", title: "Technical Alignment Interview", desc: "Intern Amar Singh", tag: "Interview" },
    { time: "02:30 PM", title: "LMS Syllabus Deliverables Audit", desc: "Cohort Logistics", tag: "Audit" },
    { time: "05:00 PM", title: "Leaderboard Weekly Standings Update", desc: "System Automation", tag: "System" }
  ];

  return (
    <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between space-y-4">
      <div>
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-3">Today's Schedule</span>
        <div className="space-y-3">
          {events.map((e, idx) => (
            <div key={idx} className="flex gap-3.5 items-start">
              <div className="text-[10px] font-black text-gray-400 w-14 shrink-0 pt-0.5">{e.time}</div>
              <div className="flex-1 min-w-0 space-y-0.5">
                <h5 className="text-xs font-bold text-gray-900 truncate">{e.title}</h5>
                <p className="text-[10px] text-gray-500">{e.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-gray-100 pt-3 flex justify-between items-center text-[10px] font-bold">
        <span className="text-gray-400">Total 3 Events Scheduled</span>
        <button className="text-[#FF7A00] hover:underline">View Calendar</button>
      </div>
    </div>
  );
}

// Dashboard Mock Chart Graphic Component
export function DashboardChart({ title }: { title: string }) {
  return (
    <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{title}</span>
        <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">+12% this week</span>
      </div>
      
      {/* Visual Chart Placeholder Design */}
      <div className="h-36 flex items-end justify-between gap-2.5 pt-4">
        {[45, 60, 30, 80, 55, 90, 75, 40, 65, 85].map((val, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
            <div 
              className="w-full bg-orange-100 hover:bg-[#FF7A00] rounded-t-md transition-all duration-300"
              style={{ height: `${val}%` }}
            />
            <span className="text-[8px] font-bold text-gray-400">M{i+1}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// System Overview Card Component (Super Admin Only)
export function SystemOverviewCard({ 
  totalAdmins, 
  totalColleges, 
  totalProblems 
}: { 
  totalAdmins: number;
  totalColleges: number;
  totalProblems: number;
}) {
  return (
    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Super Admin Area</span>
          <h3 className="text-base font-black text-gray-900">System Performance Metrics</h3>
        </div>
        <div className="bg-orange-50 border border-orange-100 px-3 py-1 rounded-xl text-[10px] font-bold text-[#FF7A00]">
          Active Microservices
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-gray-50 rounded-2xl p-4 flex items-center gap-3">
          <div className="size-10 rounded-xl bg-orange-100 text-[#FF7A00] flex items-center justify-center shrink-0">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Total Admins</span>
            <span className="text-xl font-black text-gray-900">{totalAdmins}</span>
          </div>
        </div>

        <div className="bg-gray-50 rounded-2xl p-4 flex items-center gap-3">
          <div className="size-10 rounded-xl bg-orange-100 text-[#FF7A00] flex items-center justify-center shrink-0">
            <Database className="size-5" />
          </div>
          <div>
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Total Colleges</span>
            <span className="text-xl font-black text-gray-900">{totalColleges}</span>
          </div>
        </div>

        <div className="bg-gray-50 rounded-2xl p-4 flex items-center gap-3">
          <div className="size-10 rounded-xl bg-orange-100 text-[#FF7A00] flex items-center justify-center shrink-0">
            <BarChart3 className="size-5" />
          </div>
          <div>
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Problem Statements</span>
            <span className="text-xl font-black text-gray-900">{totalProblems}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-gray-100 pt-4">
        <div className="flex items-center justify-between text-xs font-bold text-gray-700">
          <span className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-500" /> Supabase Connection
          </span>
          <span className="text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full text-[9px]">Online</span>
        </div>
        <div className="flex items-center justify-between text-xs font-bold text-gray-700">
          <span className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-500" /> APEX AI Engines
          </span>
          <span className="text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full text-[9px]">Online</span>
        </div>
      </div>
    </div>
  );
}
