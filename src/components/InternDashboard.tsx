import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  CheckSquare,
  TrendingUp,
  CalendarCheck,
  Trophy,
  CalendarCheck2,
  Send,
  Plus,
  ArrowRight,
  MessageSquare,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { StatCard, SectionLabel, IconBadge } from "@/components/Tile";
import { supabase } from "@/integrations/supabase/client";

export function InternDashboard() {
  const dash = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const uid = u.user.id;
      const [profileRes, aiRes, todoRes, doneRes, attendanceRes, leaderboardRes] =
        await Promise.all([
          supabase
            .from("profiles")
            .select("full_name, community_points, attendance_points")
            .eq("id", uid)
            .maybeSingle(),
          supabase.from("ai_analysis").select("overall_score").eq("user_id", uid).maybeSingle(),
          supabase.from("todos").select("id", { count: "exact", head: true }).eq("user_id", uid),
          supabase
            .from("todos")
            .select("id", { count: "exact", head: true })
            .eq("user_id", uid)
            .eq("done", true),
          supabase
            .from("attendance_records")
            .select("date, check_in")
            .eq("user_id", uid)
            .order("date", { ascending: false })
            .limit(30),
          supabase
            .from("public_leaderboard" as any)
            .select("id, community_points, attendance_points"),
        ]);

      if (profileRes.error) {
        console.error("Dashboard profile query error:", {
          status: profileRes.status,
          statusText: profileRes.statusText,
          error: {
            code: profileRes.error.code,
            message: profileRes.error.message,
            details: profileRes.error.details,
            hint: profileRes.error.hint,
          },
        });
      }
      if (aiRes.error) {
        console.error("Dashboard ai_analysis query error:", {
          status: aiRes.status,
          statusText: aiRes.statusText,
          error: {
            code: aiRes.error.code,
            message: aiRes.error.message,
            details: aiRes.error.details,
            hint: aiRes.error.hint,
          },
        });
      }
      if (todoRes.error) {
        console.error("Dashboard todo query error:", {
          status: todoRes.status,
          statusText: todoRes.statusText,
          error: {
            code: todoRes.error.code,
            message: todoRes.error.message,
            details: todoRes.error.details,
            hint: todoRes.error.hint,
          },
        });
      }
      if (doneRes.error) {
        console.error("Dashboard completed todos query error:", {
          status: doneRes.status,
          statusText: doneRes.statusText,
          error: {
            code: doneRes.error.code,
            message: doneRes.error.message,
            details: doneRes.error.details,
            hint: doneRes.error.hint,
          },
        });
      }
      if (attendanceRes.error) {
        console.error("Dashboard attendance query error:", {
          status: attendanceRes.status,
          statusText: attendanceRes.statusText,
          error: {
            code: attendanceRes.error.code,
            message: attendanceRes.error.message,
            details: attendanceRes.error.details,
            hint: attendanceRes.error.hint,
          },
        });
      }
      if (leaderboardRes.error) {
        console.error("Dashboard leaderboard query error:", {
          status: leaderboardRes.status,
          statusText: leaderboardRes.statusText,
          error: {
            code: leaderboardRes.error.code,
            message: leaderboardRes.error.message,
            details: leaderboardRes.error.details,
            hint: leaderboardRes.error.hint,
          },
        });
      }

      const profile = profileRes.data;
      const ai = aiRes.data;
      const todoCount = todoRes.count;
      const doneCount = doneRes.count;
      const attendance = attendanceRes.data;
      const leaderboard = leaderboardRes.data;

      // Compute rank against everyone (community+attendance only for client-only privacy-safe ranking)
      const myScore = (profile?.community_points ?? 0) + (profile?.attendance_points ?? 0);
      const scores = (leaderboard ?? []).map(
        (p: any) => (p.community_points ?? 0) + (p.attendance_points ?? 0),
      );
      scores.sort((a, b) => b - a);
      const rank = scores.findIndex((s) => s <= myScore) + 1 || scores.length + 1;

      // Attendance rate this month
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const presentDays = (attendance ?? []).filter(
        (a: any) => a.check_in && new Date(a.date) >= monthStart,
      ).length;
      const elapsed = Math.max(1, now.getDate());
      const attRate = Math.round((presentDays / elapsed) * 100);

      return {
        name: profile?.full_name ?? u.user.email?.split("@")[0] ?? "there",
        tasks: todoCount ?? 0,
        tasksDone: doneCount ?? 0,
        score: ai?.overall_score ?? 0,
        attRate,
        presentDays,
        elapsed,
        rank,
      };
    },
  });

  const d = dash.data;

  return (
    <AppShell>
      <div className="space-y-10">
        <header>
          <h2 className="text-3xl font-bold tracking-tight">
            Welcome back, {d?.name ?? "…"}{" "}
            <span className="inline-block animate-[wave_2s_ease-in-out_infinite] origin-[70%_70%]">
              👋
            </span>
          </h2>
          <p className="text-muted-foreground mt-2">Here's a snapshot of your progress today.</p>
        </header>

        <section className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={CheckSquare}
            tone="primary"
            value={d ? String(d.tasks) : "0"}
            label="Total Tasks"
            delta={`${d?.tasksDone ?? 0} completed`}
          />
          <StatCard
            icon={TrendingUp}
            tone="info"
            value={d ? String(d.score) : "0"}
            label="LinkedIn Score"
            delta="AI analysis"
          />
          <StatCard
            icon={CalendarCheck}
            tone="success"
            value={d ? `${d.attRate}%` : "0%"}
            label="Attendance"
            delta={`${d?.presentDays ?? 0} of ${d?.elapsed ?? 0} days`}
          />
          <StatCard
            icon={Trophy}
            tone="warning"
            value={d ? `#${d.rank}` : "—"}
            label="Global Rank"
            delta="updated live"
          />
        </section>

        <section>
          <SectionLabel>Quick Actions</SectionLabel>
          <div className="grid gap-4 sm:grid-cols-3">
            <QuickAction
              to="/attendance"
              tone="success"
              icon={CalendarCheck2}
              label="Mark Attendance"
            />
            <QuickAction to="/social" tone="info" icon={Send} label="Create Post" />
            <QuickAction to="/todo" tone="primary" icon={Plus} label="Add Task" />
          </div>
        </section>

        <section>
          <SectionLabel>All Modules</SectionLabel>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <ModuleCard
              to="/attendance"
              tone="success"
              icon={CalendarCheck}
              title="Attendance Tracker"
              desc="Daily presence & calendar history"
            />
            <ModuleCard
              to="/social"
              tone="info"
              icon={Send}
              title="Social Posting"
              desc="AI-powered LinkedIn post creator"
            />
            <ModuleCard
              to="/todo"
              tone="primary"
              icon={CheckSquare}
              title="Todo Board"
              desc="Kanban-style task management"
            />
            <ModuleCard
              to="/leaderboard"
              tone="warning"
              icon={Trophy}
              title="Leaderboard"
              desc="Compete with community members"
            />
            <ModuleCard
              to="/community"
              tone="pink"
              icon={MessageSquare}
              title="Community"
              desc="Discuss and collaborate openly"
            />
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function QuickAction({ to, tone, icon: Icon, label }: any) {
  const toneBg: Record<string, string> = {
    success: "hover:bg-[#22C55E]/4 hover:border-[#22C55E]/20",
    info: "hover:bg-[#3B82F6]/4 hover:border-[#3B82F6]/20",
    primary: "hover:bg-[#FF7A00]/4 hover:border-[#FF7A00]/20",
  };
  const iconColor: Record<string, string> = {
    success: "text-[#22C55E]",
    info: "text-[#3B82F6]",
    primary: "text-[#FF7A00]",
  };

  return (
    <Link
      to={to}
      className={`card-surface relative overflow-hidden flex items-center justify-center gap-2.5 py-4 font-semibold text-[#111827] hover:text-[#FF7A00] transition-all duration-200 hover:-translate-y-0.5 ${toneBg[tone] || ""}`}
    >
      <Icon className={`size-4 shrink-0 relative ${iconColor[tone]}`} />
      <span className="relative text-sm">{label}</span>
    </Link>
  );
}

function ModuleCard({ to, tone, icon, title, desc }: any) {
  const toneBorders: Record<string, string> = {
    success: "hover:border-[#22C55E]/30 hover:shadow-md",
    info: "hover:border-[#3B82F6]/30 hover:shadow-md",
    primary: "hover:border-[#FF7A00]/30 hover:shadow-md",
    warning: "hover:border-[#F59E0B]/30 hover:shadow-md",
    pink: "hover:border-[#FF7A00]/30 hover:shadow-md",
  };

  return (
    <Link
      to={to}
      className={`card-surface p-6 group transition-all duration-200 hover:-translate-y-0.5 ${
        toneBorders[tone] || "hover:border-primary/25 hover:shadow-md"
      }`}
    >
      <div className="flex items-start justify-between">
        <IconBadge icon={icon} tone={tone} />
        <ArrowRight className="size-4 text-[#9CA3AF] opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
      </div>
      <div className="mt-6">
        <div className="font-bold text-[#111827] text-base group-hover:text-[#FF7A00] transition-colors">{title}</div>
        <div className="text-sm text-[#6B7280] mt-1.5 leading-relaxed">{desc}</div>
      </div>
    </Link>
  );
}
