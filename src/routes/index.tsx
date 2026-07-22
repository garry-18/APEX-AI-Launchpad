import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { ArrowRight, LogIn, UserPlus, Sparkles, ShieldCheck, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ApexLogo } from "@/components/ApexLogo";
import { fetchUserRole, ROLE_HOME } from "@/lib/roles";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Welcome — APEX AI Launchpad" },
      { name: "description", content: "AI-Powered Intern & Talent Launchpad by APEX." },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        const role = await fetchUserRole(data.user.id);
        const destination = role ? ROLE_HOME[role] : "/unauthorized";
        navigate({ to: destination as any, replace: true });
      }
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col justify-between p-4 sm:p-6 md:p-10 font-sans selection:bg-[#FF6B00]/10 selection:text-[#FF6B00]">
      {/* Top Header */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between py-4 animate-in fade-in duration-500">
        <ApexLogo size="lg" />
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate({ to: "/auth", search: { mode: "login" } as any })}
            className="h-10 px-5 rounded-2xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 hover:border-gray-300 transition-all cursor-pointer"
          >
            Login
          </button>
          <button
            onClick={() => navigate({ to: "/auth", search: { mode: "register" } as any })}
            className="h-10 px-5 rounded-2xl bg-[#FF6B00] hover:bg-[#e05e00] text-white font-bold text-sm shadow-md shadow-[#FF6B00]/20 hover:shadow-lg transition-all cursor-pointer"
          >
            Register
          </button>
        </div>
      </header>

      {/* Hero Content */}
      <main className="max-w-4xl w-full mx-auto text-center my-auto py-12 flex flex-col items-center justify-center">
        {/* Animated Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-50 border border-orange-100 text-[#FF6B00] text-xs font-bold uppercase tracking-wider mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
          <Sparkles className="size-3.5" />
          <span>The Next Generation Student Launchpad</span>
        </div>

        {/* Heading */}
        <h1 className="text-4xl sm:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight mb-6 animate-in fade-in duration-700">
          Accelerate Your Career with <br className="hidden sm:inline" />
          <span className="text-[#FF6B00]">APEX AI Launchpad</span>
        </h1>

        {/* Short Description */}
        <p className="text-base sm:text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed animate-in fade-in duration-700 delay-100">
          Build your professional AI profile, track real-time progress, log daily diaries, and unlock exclusive internship opportunities with Apex Startup Group.
        </p>

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
          <button
            onClick={() => navigate({ to: "/auth", search: { mode: "login" } as any })}
            className="w-full sm:w-auto h-13 px-8 rounded-2xl bg-[#FF6B00] hover:bg-[#e05e00] active:bg-[#c95400] text-white font-bold text-base inline-flex items-center justify-center gap-3 shadow-lg shadow-[#FF6B00]/25 hover:shadow-xl hover:shadow-[#FF6B00]/35 transition-all transform hover:-translate-y-0.5 cursor-pointer"
          >
            <LogIn className="size-5" />
            <span>Student Login</span>
            <ArrowRight className="size-4 opacity-75" />
          </button>
          <button
            onClick={() => navigate({ to: "/auth", search: { mode: "register" } as any })}
            className="w-full sm:w-auto h-13 px-8 rounded-2xl bg-white border border-gray-200 text-gray-800 font-bold text-base inline-flex items-center justify-center gap-3 hover:bg-gray-50 hover:border-gray-300 shadow-sm transition-all transform hover:-translate-y-0.5 cursor-pointer"
          >
            <UserPlus className="size-5 text-[#FF6B00]" />
            <span>Student Registration</span>
          </button>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16 text-left w-full max-w-3xl animate-in fade-in duration-700 delay-300">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
            <div className="size-10 rounded-2xl bg-orange-50 flex items-center justify-center text-[#FF6B00] mb-4">
              <Zap className="size-5" />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1">Guided Onboarding</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Automated 3-step profile builder with real-time draft saving and AI skills analysis.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
            <div className="size-10 rounded-2xl bg-orange-50 flex items-center justify-center text-[#FF6B00] mb-4">
              <ShieldCheck className="size-5" />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1">Role-Based Access</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Dedicated portals tailored specifically for Students, Admins, and Super Admins.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
            <div className="size-10 rounded-2xl bg-orange-50 flex items-center justify-center text-[#FF6B00] mb-4">
              <Sparkles className="size-5" />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1">Internship Analytics</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Track work submission, attendance, leaderboards, and daily work logs seamlessly.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl w-full mx-auto text-center py-4 text-xs text-gray-400">
        © APEX Startup Group • All rights reserved.
      </footer>
    </div>
  );
}
