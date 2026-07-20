import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, CheckCircle2, Circle, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/todo")({
  head: () => ({
    meta: [
      { title: "Todo List — APEX AI" },
      { name: "description", content: "Kanban-inspired task management with priority tracking." },
    ],
  }),
  component: Todo,
});

type Priority = "High" | "Medium" | "Low";
type Task = { id: string; title: string; done: boolean; priority: Priority };
type Filter = "All" | "Active" | "Done";

function Todo() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<Filter>("All");
  const [q, setQ] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [draft, setDraft] = useState({ title: "", priority: "Medium" as Priority });

  const tasksQ = useQuery({
    queryKey: ["todos"],
    queryFn: async (): Promise<Task[]> => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return [];
      const { data, error } = await supabase
        .from("todos")
        .select("id, title, done, priority")
        .eq("user_id", u.user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Task[];
    },
  });

  const tasks = tasksQ.data ?? [];

  const addM = useMutation({
    mutationFn: async (input: { title: string; priority: Priority }) => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const { error } = await supabase
        .from("todos")
        .insert({ user_id: u.user.id, title: input.title, priority: input.priority });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["todos"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to add"),
  });

  const toggleM = useMutation({
    mutationFn: async (t: Task) => {
      const { error } = await supabase.from("todos").update({ done: !t.done }).eq("id", t.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["todos"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const deleteM = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("todos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["todos"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const visible = useMemo(() => {
    return tasks
      .filter((t) => (filter === "All" ? true : filter === "Active" ? !t.done : t.done))
      .filter((t) => t.title.toLowerCase().includes(q.toLowerCase()));
  }, [tasks, filter, q]);
  const completed = tasks.filter((t) => t.done).length;
  const pct = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
  const counts = { High: 0, Medium: 0, Low: 0 } as Record<Priority, number>;
  tasks.forEach((t) => {
    counts[t.priority]++;
  });

  function add() {
    if (!draft.title.trim()) return;
    addM.mutate({ title: draft.title.trim(), priority: draft.priority });
    setDraft({ title: "", priority: "Medium" });
    setShowAdd(false);
  }

  return (
    <AppShell>
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="size-[18px] absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                placeholder="Search tasks…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-full h-10 rounded-xl bg-surface-2/60 border border-border pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div className="flex rounded-lg bg-surface-2 p-0.5 border border-border">
              {(["All", "Active", "Done"] as Filter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                    filter === f
                      ? "bg-surface shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowAdd((v) => !v)}
              className="h-10 px-4 rounded-xl bg-primary text-white font-medium text-sm flex items-center gap-2 hover:bg-primary-hover active:bg-primary-active transition shadow-sm"
            >
              <Plus className="size-4" /> Add Task
            </button>
          </div>

          {showAdd && (
            <div className="card-surface p-4 flex flex-wrap gap-3 items-end animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex-1 min-w-[200px]">
                <div className="text-xs text-muted-foreground mb-1.5">Task Title</div>
                <input
                  autoFocus
                  placeholder="What needs to be done?"
                  value={draft.title}
                  onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && add()}
                  className="w-full h-10 rounded-lg bg-surface-2/60 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div className="w-36">
                <div className="text-xs text-muted-foreground mb-1.5">Priority</div>
                <select
                  value={draft.priority}
                  onChange={(e) => setDraft((d) => ({ ...d, priority: e.target.value as any }))}
                  className="w-full h-10 rounded-lg bg-surface-2/60 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAdd(false)}
                  className="h-10 px-4 rounded-lg hover:bg-surface-2 text-sm font-medium transition"
                >
                  Cancel
                </button>
                <button
                  onClick={add}
                  className="h-10 px-4 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover active:bg-primary-active transition shadow-sm"
                >
                  Save
                </button>
              </div>
            </div>
          )}

          {tasksQ.isLoading ? (
            <div className="h-48 grid place-items-center">
              <Loader2 className="size-6 text-muted-foreground animate-spin" />
            </div>
          ) : visible.length === 0 ? (
            <div className="card-surface py-12 text-center text-sm text-muted-foreground">
              No tasks found.
            </div>
          ) : (
            <ul className="space-y-2">
              {visible.map((t) => (
                <li
                  key={t.id}
                  className="group card-surface p-4 flex items-center gap-3 hover:border-border transition-colors"
                >
                  <button
                    onClick={() => toggleM.mutate(t)}
                    className="text-muted-foreground hover:text-primary transition shrink-0"
                  >
                    {t.done ? (
                      <CheckCircle2 className="size-5 text-primary" />
                    ) : (
                      <Circle className="size-5" />
                    )}
                  </button>
                  <span
                    className={`flex-1 text-sm truncate ${
                      t.done ? "line-through text-muted-foreground" : "text-foreground"
                    }`}
                  >
                    {t.title}
                  </span>
                  <PriorityChip p={t.priority} />
                  <button
                    onClick={() => deleteM.mutate(t.id)}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition"
                  >
                    <Trash2 className="size-[18px]" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <aside className="space-y-6">
          <div className="card-surface p-5">
            <h3 className="font-semibold mb-3">Daily Progress</h3>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold">{completed}</span>
              <span className="text-muted-foreground">/{tasks.length}</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">tasks completed</div>
            <div className="mt-4 h-2 rounded-full bg-surface-2 overflow-hidden">
              <div
                className="h-full bg-brand-orange-gradient transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="text-xs text-muted-foreground mt-2">{pct}% complete</div>
          </div>
          <div className="card-surface p-5">
            <h3 className="font-semibold mb-4">By Priority</h3>
            <PriorityRow label="High" tone="destructive" count={counts.High} />
            <PriorityRow label="Medium" tone="warning" count={counts.Medium} />
            <PriorityRow label="Low" tone="success" count={counts.Low} />
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

function PriorityChip({ p }: { p: Priority }) {
  const map = {
    High: "bg-destructive/15 text-destructive",
    Medium: "bg-warning/15 text-warning",
    Low: "bg-success/15 text-success",
  } as const;
  return <span className={`text-xs px-2 py-1 rounded-md ${map[p]}`}>{p}</span>;
}

function PriorityRow({ label, tone, count }: { label: string; tone: string; count: number }) {
  const dot: Record<string, string> = {
    destructive: "bg-destructive",
    warning: "bg-warning",
    success: "bg-success",
  };
  return (
    <div className="flex items-center justify-between py-2 text-sm">
      <span className="flex items-center gap-2 text-muted-foreground">
        <span className={`size-2 rounded-full ${dot[tone]}`} /> {label}
      </span>
      <span className="font-semibold">{count}</span>
    </div>
  );
}
