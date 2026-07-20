import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo, useEffect } from "react";
import { Crown, Trophy, SlidersHorizontal, History } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { IconBadge } from "@/components/Tile";
import { supabase } from "@/integrations/supabase/client";
import { adjustInternPoints } from "@/lib/leaderboard.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/leaderboard")({
  head: () => ({ meta: [{ title: "Leaderboard — APEX AI" }] }),
  component: Leaderboard,
});

type Row = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  college: string | null;
  problem_statement: string | null;
  community_points: number;
  attendance_points: number;
  overall_score: number;
  branding_score: number;
  total: number;
};

function Leaderboard() {
  const [selectedProblem, setSelectedProblem] = useState("All");
  const [selectedCollege, setSelectedCollege] = useState("All");
  const [selectedCity, setSelectedCity] = useState("All");
  const [timePeriod, setTimePeriod] = useState<"overall" | "weekly" | "monthly">("overall");

  // Points adjustment modal states
  const [selectedAdjustIntern, setSelectedAdjustIntern] = useState<Row | null>(null);
  const [pointsType, setPointsType] = useState<"community" | "attendance">("community");
  const [pointsAmount, setPointsAmount] = useState(0);
  const [adjustmentReason, setAdjustmentReason] = useState("");
  const [loading, setLoading] = useState(false);

  // Audit Logs view state
  const [showAuditLogs, setShowAuditLogs] = useState(false);

  const queryClient = useQueryClient();

  useEffect(() => {
    // Subscribe to changes on profiles and points_audit_logs tables
    const channel = supabase
      .channel("leaderboard-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        (payload) => {
          console.log("Realtime: profiles table changed", payload);
          queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "points_audit_logs" },
        (payload) => {
          console.log("Realtime: points_audit_logs table changed", payload);
          queryClient.invalidateQueries({ queryKey: ["leaderboard-points-audit-logs"] });
          queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const me = useQuery({
    queryKey: ["me-id"],
    queryFn: async () => (await supabase.auth.getUser()).data.user?.id ?? null,
  });

  const myRoleQuery = useQuery({
    queryKey: ["my-role"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
      return data?.role || null;
    }
  });

  const callerRole = myRoleQuery.data;

  // Find admin's active problem statement assignment (UUIDs)
  const adminAssignmentQuery = useQuery({
    queryKey: ["my-admin-assignment", callerRole],
    queryFn: async () => {
      if (callerRole !== "admin") return null;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase
        .from("admin_problem_statements" as any)
        .select("problem_statement_id")
        .eq("admin_id", user.id)
        .eq("is_active", true);
      return (data || []).map((d: any) => d.problem_statement_id).filter(Boolean);
    },
    enabled: callerRole === "admin"
  });

  const adminAssignedIds = adminAssignmentQuery.data || [];

  const collegesQuery = useQuery({
    queryKey: ["colleges-list"],
    queryFn: async () => {
      const { data } = await supabase.from("colleges" as any).select("*");
      return (data as any[]) || [];
    }
  });

  const problemsQuery = useQuery({
    queryKey: ["problems-list"],
    queryFn: async () => {
      const { data } = await supabase.from("problem_statements").select("*");
      return (data as any[]) || [];
    }
  });

  const auditLogsQuery = useQuery({
    queryKey: ["leaderboard-points-audit-logs"],
    queryFn: async () => {
      const { data } = await supabase.from("points_audit_logs" as any).select("*");
      return (data as any[]) || [];
    }
  });

  const colleges = collegesQuery.data || [];
  const problems = problemsQuery.data || [];
  const logs = auditLogsQuery.data || [];
  const cities = Array.from(new Set(colleges.map((c) => c.city).filter(Boolean)));

  const rows = useQuery<Row[]>({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      // 1. Leaderboard query always filters role = 'intern'
      const { data } = await supabase
        .from("public_leaderboard" as any)
        .select("*")
        .eq("role", "intern");

      return ((data as any[]) ?? [])
        .map(
          (p) =>
            ({
              id: p.id,
              full_name: p.full_name,
              avatar_url: p.avatar_url,
              college: p.college,
              problem_statement: p.problem_statement,
              community_points: p.community_points ?? 0,
              attendance_points: p.attendance_points ?? 0,
              overall_score: p.overall_score ?? 0,
              branding_score: p.branding_score ?? 0,
              total:
                (p.overall_score ?? 0) +
                (p.branding_score ?? 0) +
                (p.community_points ?? 0) +
                (p.attendance_points ?? 0),
            }) as Row,
        )
        .sort((a, b) => b.total - a.total);
    },
  });

  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Helper to sum points adjusted in range
  const getPointsInRange = (internId: string, sinceDate?: Date) => {
    return logs
      .filter((log) => {
        if (log.intern_id !== internId) return false;
        if (sinceDate && new Date(log.created_at) < sinceDate) return false;
        return true;
      })
      .reduce((sum, log) => sum + log.amount, 0);
  };

  const list = rows.data ?? [];

  const filteredList = useMemo(() => {
    let result = list.map((item) => {
      const collegeObj = colleges.find((c) => c.name === item.college);
      const city = collegeObj?.city || "";
      
      // Calculate score based on time period
      let score = item.total;
      if (timePeriod === "weekly") {
        score = getPointsInRange(item.id, oneWeekAgo);
      } else if (timePeriod === "monthly") {
        score = getPointsInRange(item.id, oneMonthAgo);
      }

      return {
        ...item,
        city,
        displayScore: score,
      };
    });

    if (selectedProblem !== "All") {
      result = result.filter(
        (item) =>
          (item.problem_statement ?? "").trim().toLowerCase() === selectedProblem.trim().toLowerCase(),
      );
    }
    if (selectedCollege !== "All") {
      result = result.filter(
        (item) => (item.college ?? "").trim().toLowerCase() === selectedCollege.trim().toLowerCase(),
      );
    }
    if (selectedCity !== "All") {
      result = result.filter(
        (item) => (item.city ?? "").trim().toLowerCase() === selectedCity.trim().toLowerCase(),
      );
    }

    return result.sort((a, b) => b.displayScore - a.displayScore);
  }, [list, colleges, selectedProblem, selectedCollege, selectedCity, timePeriod, logs]);

  const podium = useMemo(() => filteredList.slice(0, 3), [filteredList]);
  const rest = useMemo(() => filteredList.slice(3), [filteredList]);

  const canAdjustPoints = (intern: Row) => {
    if (callerRole === "super_admin") return true;
    if (callerRole === "admin") {
      const prob = problems.find((p) => p.name === intern.problem_statement);
      return prob && adminAssignedIds.includes(prob.id);
    }
    return false;
  };

  const handlePointsAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdjustIntern) return;
    if (pointsAmount === 0 || !adjustmentReason.trim()) {
      return toast.error("Please enter a valid amount and reason");
    }

    setLoading(true);
    try {
      await adjustInternPoints({
        data: {
          internId: selectedAdjustIntern.id,
          pointsType,
          amount: pointsAmount,
          reason: adjustmentReason.trim(),
        }
      });
      toast.success("Points Adjusted successfully!");
      setSelectedAdjustIntern(null);
      setAdjustmentReason("");
      setPointsAmount(0);
      rows.refetch();
      auditLogsQuery.refetch();
    } catch (err: any) {
      toast.error(err.message ?? "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex justify-between items-start gap-4">
          <div>
            <h2 className="text-2xl font-bold">Global Rankings</h2>
            <p className="text-muted-foreground mt-1">
              Ranked by AI Profile + Personal Branding + Community + Attendance.
            </p>
          </div>

          {callerRole && (
            <button
              onClick={() => setShowAuditLogs(true)}
              className="px-4 py-2 rounded-xl border border-border bg-surface text-xs font-semibold hover:bg-surface-2 transition flex items-center gap-1.5 cursor-pointer"
            >
              <History className="size-4" /> {callerRole === "intern" ? "My Points History" : "Audit Trail"}
            </button>
          )}
        </div>

        {/* FILTERS & SCOPES */}
        <div className="card-surface p-5 space-y-4 bg-white border border-border rounded-xl">
          <div className="text-sm font-semibold flex items-center gap-1.5 border-b border-border pb-3">
            <SlidersHorizontal className="size-4 text-primary" /> Filter Leaderboard
          </div>

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <label className="block space-y-1">
              <span className="text-xs font-semibold text-muted-foreground">Time Period</span>
              <select
                value={timePeriod}
                onChange={(e) => setTimePeriod(e.target.value as any)}
                className="w-full h-10 rounded-xl bg-surface-2/60 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="overall">Overall Leaderboard</option>
                <option value="weekly">Weekly Rankings</option>
                <option value="monthly">Monthly Rankings</option>
              </select>
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-semibold text-muted-foreground">Problem Statement</span>
              <select
                value={selectedProblem}
                onChange={(e) => setSelectedProblem(e.target.value)}
                className="w-full h-10 rounded-xl bg-surface-2/60 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="All">All Problems</option>
                {problems.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-semibold text-muted-foreground">College</span>
              <select
                value={selectedCollege}
                onChange={(e) => setSelectedCollege(e.target.value)}
                className="w-full h-10 rounded-xl bg-surface-2/60 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="All">All Colleges</option>
                {colleges.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-semibold text-muted-foreground">City Location</span>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full h-10 rounded-xl bg-surface-2/60 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="All">All Cities</option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {podium.map((p, i) => {
            const Icon = i === 0 ? Crown : Trophy;
            const tone = (["warning", "primary", "info"] as const)[i];
            const initials = (p.full_name ?? "U")
              .split(" ")
              .map((s) => s[0])
              .filter(Boolean)
              .slice(0, 2)
              .join("")
              .toUpperCase();
            return (
              <div
                key={p.id}
                className="card-surface p-6 flex flex-col items-center text-center relative bg-white border border-border rounded-xl"
              >
                <IconBadge icon={Icon} tone={tone} size="lg" />
                <div className="mt-3 text-xs text-muted-foreground">Rank #{i + 1}</div>
                {p.avatar_url ? (
                  <img
                    src={p.avatar_url}
                    alt=""
                    className="size-14 rounded-full mt-2 object-cover"
                  />
                ) : (
                  <div className="size-14 rounded-full mt-2 bg-brand-orange-gradient grid place-items-center text-sm font-bold text-white">
                    {initials}
                  </div>
                )}
                <div className="font-bold text-lg mt-2 flex items-center justify-center gap-1.5">
                  <Link
                    to="/u/$id"
                    params={{ id: p.id }}
                    className="hover:text-primary hover:underline transition"
                  >
                    {p.full_name ?? "Member"}
                  </Link>
                  {canAdjustPoints(p) && (
                    <button
                      onClick={() => setSelectedAdjustIntern(p)}
                      className="px-2 py-0.5 rounded bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-semibold transition cursor-pointer border-none"
                    >
                      +/- Points
                    </button>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">{p.college ?? "—"}</div>
                <div className="text-3xl font-bold mt-3 text-primary">{p.displayScore}</div>
                <div className="text-xs text-muted-foreground">points</div>
                <div className="text-[10px] text-muted-foreground mt-3 space-y-0.5 border-t border-border/50 pt-2 w-full">
                  <div className="flex justify-between px-1"><span>AI Profile:</span><span className="font-semibold">{p.overall_score}</span></div>
                  <div className="flex justify-between px-1"><span>Branding:</span><span className="font-semibold">{p.branding_score}</span></div>
                  <div className="flex justify-between px-1"><span>Community:</span><span className="font-semibold">{p.community_points}</span></div>
                  <div className="flex justify-between px-1"><span>Attendance:</span><span className="font-semibold">{p.attendance_points}</span></div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="card-surface overflow-hidden bg-white border border-border rounded-xl">
          <div className="grid grid-cols-[60px_1fr_1fr_135px_120px] px-5 py-3 text-xs text-muted-foreground border-b border-border eyebrow !mb-0">
            <div>Rank</div>
            <div>Member</div>
            <div>Problem Statement</div>
            <div className="text-right">Score</div>
            <div className="text-right">Actions</div>
          </div>
          {filteredList.map((r, i) => {
            const rank = i + 1;
            const isMe = me.data === r.id;
            const initials = (r.full_name ?? "U")
              .split(" ")
              .map((s) => s[0])
              .filter(Boolean)
              .slice(0, 2)
              .join("")
              .toUpperCase();
            return (
              <div
                key={r.id}
                className={`grid grid-cols-[60px_1fr_1fr_135px_120px] px-5 py-4 items-center border-b border-border/60 last:border-0 hover:bg-surface-2/30 ${isMe ? "bg-primary/5" : ""}`}
              >
                <div className="text-muted-foreground text-sm">#{rank}</div>
                <div className="flex items-center gap-3 min-w-0">
                  {r.avatar_url ? (
                    <img src={r.avatar_url} alt="" className="size-9 rounded-full object-cover" />
                  ) : (
                    <div className="size-9 rounded-full bg-brand-orange-gradient grid place-items-center text-xs font-semibold text-white">
                      {initials}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="text-sm truncate">
                      <Link
                        to="/u/$id"
                        params={{ id: r.id }}
                        className="hover:text-primary hover:underline transition font-bold"
                      >
                        {r.full_name ?? "Member"}
                      </Link>
                      {isMe && <span className="text-primary text-xs ml-1">(you)</span>}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{r.college ?? "—"}</div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground truncate pr-3">
                  {r.problem_statement ?? "—"}
                </div>
                <div className="text-right">
                  <div className="font-semibold text-sm">{r.displayScore}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5 whitespace-nowrap">
                    ai:{r.overall_score} • bd:{r.branding_score} • cm:{r.community_points} • at:{r.attendance_points}
                  </div>
                </div>
                <div className="text-right">
                  {canAdjustPoints(r) ? (
                    <button
                      onClick={() => setSelectedAdjustIntern(r)}
                      className="px-2.5 py-1.5 rounded-lg border border-primary/20 bg-primary/5 text-primary text-xs font-semibold hover:bg-primary/10 transition cursor-pointer"
                    >
                      Adjust Points
                    </button>
                  ) : (
                    <span className="text-xs text-muted-foreground/50">—</span>
                  )}
                </div>
              </div>
            );
          })}
          {filteredList.length === 0 && (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No ranked members match current filters.
            </div>
          )}
        </div>
      </div>

      {/* ADJUST POINTS MODAL */}
      {selectedAdjustIntern && (
        <div className="fixed inset-0 bg-black/50 grid place-items-center z-50 p-4 backdrop-blur-sm animate-in fade-in-30 duration-200">
          <div className="card-surface p-6 max-w-md w-full space-y-5 animate-in zoom-in-95 duration-200 bg-white">
            <div>
              <h3 className="font-bold text-lg text-foreground">Adjust Intern Points</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Modify points registry for {selectedAdjustIntern.full_name}.
              </p>
            </div>

            <form onSubmit={handlePointsAdjustment} className="space-y-4">
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-muted-foreground">Points Registry Type</span>
                <select
                  value={pointsType}
                  onChange={(e) => setPointsType(e.target.value as any)}
                  className="w-full h-10 rounded-xl bg-surface-2/60 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="community">Community Points</option>
                  <option value="attendance">Attendance Points</option>
                </select>
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-muted-foreground">Adjustment Amount *</span>
                <input
                  type="number"
                  value={pointsAmount}
                  onChange={(e) => setPointsAmount(Number(e.target.value))}
                  placeholder="e.g. 10 or -5"
                  className="w-full h-10 rounded-xl bg-surface-2/60 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  required
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-muted-foreground">Reason / Audit Trail Description *</span>
                <textarea
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  placeholder="e.g. Extra credits for leaderboard challenge win."
                  rows={3}
                  className="w-full rounded-xl bg-surface-2/60 border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  required
                />
              </label>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAdjustIntern(null);
                    setAdjustmentReason("");
                    setPointsAmount(0);
                  }}
                  className="px-4 py-2 rounded-lg border border-border bg-surface text-xs font-semibold hover:bg-surface-2 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4.5 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-hover transition border-none cursor-pointer disabled:opacity-50"
                >
                  {loading ? "Saving..." : "Apply Adjustment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AUDIT LOGS MODAL */}
      {showAuditLogs && (
        <div className="fixed inset-0 bg-black/50 grid place-items-center z-50 p-4 backdrop-blur-sm animate-in fade-in-30 duration-200">
          <div className="card-surface p-6 max-w-2xl w-full space-y-5 animate-in zoom-in-95 duration-200 bg-white">
            <div className="flex justify-between items-center border-b border-border pb-2.5">
              <h3 className="font-bold text-lg text-foreground">
                {callerRole === "intern" ? "My Points History" : "Points Audit Logs Trail"}
              </h3>
              <button
                onClick={() => setShowAuditLogs(false)}
                className="text-xs font-semibold text-muted-foreground border-none bg-transparent cursor-pointer hover:text-foreground"
              >
                Close
              </button>
            </div>

            <div className="overflow-y-auto max-h-96 divide-y divide-border pr-1">
              {logs.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground text-xs">
                  No points adjustment audits recorded.
                </div>
              ) : (
                logs.map((log) => {
                  const internName = list.find((i) => i.id === log.intern_id)?.full_name || "Unknown Intern";
                  return (
                    <div key={log.id} className="py-3 flex flex-col gap-1 text-xs">
                      <div className="flex justify-between font-semibold">
                        <span className="text-foreground">{internName}</span>
                        <span className={log.amount >= 0 ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                          {log.amount >= 0 ? `+${log.amount}` : log.amount} ({log.points_type})
                        </span>
                      </div>
                      <div className="text-muted-foreground text-[10px]">
                        Reason: {log.reason}
                      </div>
                      <div className="text-muted-foreground text-[9px] flex justify-between pt-1">
                        <span>Adjusted At: {new Date(log.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
