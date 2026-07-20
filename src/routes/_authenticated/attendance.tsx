import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarCheck, Clock, LogIn, LogOut, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { IconBadge } from "@/components/Tile";
import { supabase } from "@/integrations/supabase/client";
import { checkInToday, checkOutToday } from "@/lib/attendance.functions";

export const Route = createFileRoute("/_authenticated/attendance")({
  head: () => ({
    meta: [
      { title: "Attendance — APEX AI" },
      {
        name: "description",
        content: "Track today's attendance, session timer, and monthly calendar.",
      },
    ],
  }),
  component: Attendance,
});

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function Attendance() {
  const qc = useQueryClient();
  const [tick, setTick] = useState(0);

  const recordsQ = useQuery({
    queryKey: ["attendance-records"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return [];
      const { data, error } = await supabase
        .from("attendance_records")
        .select("*")
        .eq("user_id", u.user.id)
        .order("date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const records = recordsQ.data ?? [];
  const today = records.find((r: any) => r.date === todayStr());

  useEffect(() => {
    if (today?.check_in && !today?.check_out) {
      const id = setInterval(() => setTick((t) => t + 1), 1000);
      return () => clearInterval(id);
    }
  }, [today?.check_in, today?.check_out]);

  const liveSeconds =
    today?.check_in && !today?.check_out
      ? Math.floor((Date.now() - new Date(today.check_in).getTime()) / 1000) + (tick && 0)
      : (today?.seconds ?? 0);

  const hh = String(Math.floor(liveSeconds / 3600)).padStart(2, "0");
  const mm = String(Math.floor((liveSeconds % 3600) / 60)).padStart(2, "0");
  const ss = String(liveSeconds % 60).padStart(2, "0");

  const checkIn = useMutation({
    mutationFn: async () => {
      await checkInToday();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attendance-records"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Checked in");
    },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const checkOut = useMutation({
    mutationFn: async () => {
      await checkOutToday();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attendance-records"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["my-profile"] });
      toast.success("Checked out");
    },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const status: "idle" | "in" | "out" = !today ? "idle" : today.check_out ? "out" : "in";

  const todayDate = new Date();
  const monthName = todayDate.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const year = todayDate.getFullYear();
  const month = todayDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const presentDays = new Set(
    records
      .filter(
        (r: any) =>
          r.check_in &&
          new Date(r.date).getMonth() === month &&
          new Date(r.date).getFullYear() === year,
      )
      .map((r: any) => new Date(r.date).getDate()),
  );
  const dayLabels = ["S", "M", "T", "W", "T", "F", "S"];

  const rateMonth = Math.round((presentDays.size / todayDate.getDate()) * 100) || 0;
  const totalTracked = records.length;

  return (
    <AppShell>
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div className="card-surface p-6">
            <div className="flex items-center gap-4">
              <IconBadge icon={CalendarCheck} tone="success" size="lg" />
              <div>
                <h2 className="text-xl font-bold">Today's Attendance</h2>
                <p className="text-sm text-muted-foreground">{monthName}</p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-border p-5 bg-surface-2/40">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="size-[18px]" /> Session timer
                </div>
                <div className="font-mono text-4xl mt-3 tracking-widest">
                  {hh}
                  <span className="text-muted-foreground/60">:</span>
                  {mm}
                  <span className="text-muted-foreground/60">:</span>
                  {ss}
                </div>
                <div className="text-xs text-muted-foreground mt-3">
                  {status === "idle"
                    ? "Not checked in yet"
                    : status === "in"
                      ? "Session active"
                      : "Checked out"}
                </div>
              </div>
              <div className="rounded-xl border border-border p-5 bg-surface-2/40">
                <div className="text-xs text-muted-foreground">Status</div>
                <div className="font-semibold mt-2">
                  {status === "idle" ? "Not Started" : status === "in" ? "Present" : "Completed"}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button
                    onClick={() => checkIn.mutate()}
                    disabled={status !== "idle" || checkIn.isPending}
                    className="flex items-center justify-center gap-2 py-2.5 rounded-lg border border-success/30 bg-success/10 text-success hover:bg-success/15 disabled:opacity-50 text-sm font-medium transition"
                  >
                    {checkIn.isPending ? (
                      <Loader2 className="size-[18px] animate-spin" />
                    ) : (
                      <LogIn className="size-[18px]" />
                    )}{" "}
                    Check In
                  </button>
                  <button
                    onClick={() => checkOut.mutate()}
                    disabled={status !== "in" || checkOut.isPending}
                    className="flex items-center justify-center gap-2 py-2.5 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/15 disabled:opacity-50 text-sm font-medium transition"
                  >
                    {checkOut.isPending ? (
                      <Loader2 className="size-[18px] animate-spin" />
                    ) : (
                      <LogOut className="size-[18px]" />
                    )}{" "}
                    Check Out
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4">This Month</h3>
            <div className="grid grid-cols-7 gap-2 text-center text-xs text-muted-foreground mb-2">
              {dayLabels.map((d, i) => (
                <div key={i}>{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {cells.map((d, i) => {
                const isToday = d === todayDate.getDate();
                const present = d != null && presentDays.has(d);
                return (
                  <div
                    key={i}
                    className={`aspect-square rounded-xl border flex items-center justify-center text-sm ${
                      d == null
                        ? "border-transparent"
                        : isToday
                          ? "border-primary/60 text-foreground bg-primary/5"
                          : present
                            ? "border-success/40 bg-success/10 text-success"
                            : "border-border bg-surface-2/30 text-muted-foreground"
                    }`}
                  >
                    {d}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="card-surface p-5">
            <h3 className="font-semibold mb-4">Statistics</h3>
            <StatRow label="Attendance Rate" value={`${rateMonth}%`} tone="success" />
            <StatRow label="Days Present" value={String(presentDays.size)} tone="info" />
            <StatRow label="Total Tracked" value={String(totalTracked)} tone="primary" />
          </div>
          <div className="card-surface p-5">
            <h3 className="font-semibold mb-3">Recent Records</h3>
            {records.length === 0 ? (
              <p className="text-sm text-muted-foreground">No attendance records yet.</p>
            ) : (
              <ul className="space-y-2">
                {records.slice(0, 5).map((r: any) => (
                  <li key={r.id} className="text-sm flex items-center justify-between">
                    <span>{new Date(r.date).toLocaleDateString()}</span>
                    <span className="text-muted-foreground text-xs">
                      {r.check_in
                        ? new Date(r.check_in).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                      {" → "}
                      {r.check_out
                        ? new Date(r.check_out).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "active"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

function StatRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "success" | "info" | "warning" | "primary";
}) {
  const toneText: Record<string, string> = {
    success: "text-success",
    info: "text-info",
    warning: "text-warning",
    primary: "text-primary",
  };
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border/60 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`font-semibold ${toneText[tone]}`}>{value}</span>
    </div>
  );
}
