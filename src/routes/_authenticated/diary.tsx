import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  Pin,
  PinOff,
  Pencil,
  Trash2,
  Copy,
  X,
  Printer,
  Download,
  ArrowLeft,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Quote,
  Code,
  Link as LinkIcon,
  Image as ImageIcon,
  Calendar as CalendarIcon,
  Save,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { StatCard, SectionLabel } from "@/components/Tile";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { dataStore } from "@/lib/data-store";

export const Route = createFileRoute("/_authenticated/diary")({
  head: () => ({
    meta: [
      { title: "Daily Diary — APEX AI Launchpad" },
      {
        name: "description",
        content: "Capture your daily thoughts, progress, ideas, and reflections.",
      },
    ],
  }),
  component: DiaryPage,
});

const MOODS = ["😊", "😐", "😔", "😴", "😍", "🚀"] as const;

type Entry = {
  id: string;
  user_id: string;
  title: string;
  content: string;
  mood: string | null;
  tags: string[];
  entry_date: string;
  entry_time: string;
  pinned: boolean;
  is_draft: boolean;
  created_at: string;
  updated_at: string;
};

type View = { kind: "list" } | { kind: "editor"; id?: string } | { kind: "detail"; id: string };

function DiaryPage() {
  const qc = useQueryClient();
  const [view, setView] = useState<View>({ kind: "list" });
  const [search, setSearch] = useState("");
  const [moodFilter, setMoodFilter] = useState<string | null>(null);
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [sortDesc, setSortDesc] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [pinnedOnly, setPinnedOnly] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const entriesQ = useQuery({
    queryKey: ["diary-entries"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      let query = supabase.from("diary_entries" as any).select("*");

      if (profile?.role === "admin") {
        const { data: adminAssigns } = await supabase
          .from("admin_problem_statements" as any)
          .select("problem_statement_id, problem_statements(name)")
          .eq("admin_id", user.id);

        const assignedNames = (adminAssigns || [])
          .map((a: any) => a.problem_statements?.name)
          .filter(Boolean);

        if (assignedNames.length > 0) {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id")
            .in("problem_statement", assignedNames);

          const userIds = (profiles || []).map((p) => p.id);
          query = query.in("user_id", userIds);
        } else {
          query = query.in("user_id", []);
        }
      }

      const { data, error } = await query
        .order("pinned", { ascending: false })
        .order("entry_date", { ascending: false })
        .order("entry_time", { ascending: false });

      if (error) throw error;
      return (data ?? []) as unknown as Entry[];
    },
  });

  const entries = entriesQ.data ?? [];

  const allTags = useMemo(() => {
    const s = new Set<string>();
    entries.forEach((e) => e.tags?.forEach((t) => s.add(t)));
    return Array.from(s).sort();
  }, [entries]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = entries.filter((e) => {
      if (q && !(e.title.toLowerCase().includes(q) || e.content.toLowerCase().includes(q)))
        return false;
      if (moodFilter && e.mood !== moodFilter) return false;
      if (tagFilter && !e.tags.includes(tagFilter)) return false;
      if (pinnedOnly && !e.pinned) return false;
      if (selectedDate && e.entry_date !== selectedDate) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      const ak = `${a.entry_date}T${a.entry_time}`;
      const bk = `${b.entry_date}T${b.entry_time}`;
      return sortDesc ? bk.localeCompare(ak) : ak.localeCompare(bk);
    });
    return list;
  }, [entries, search, moodFilter, tagFilter, sortDesc, pinnedOnly, selectedDate]);

  const stats = useMemo(() => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const wk = entries.filter((e) => new Date(e.entry_date) >= weekStart).length;
    const mo = entries.filter((e) => new Date(e.entry_date) >= monthStart).length;
    const words = entries.reduce(
      (n, e) => n + (e.content.trim() ? e.content.trim().split(/\s+/).length : 0),
      0,
    );
    // streak
    const dates = new Set(entries.map((e) => e.entry_date));
    let streak = 0;
    const cursor = new Date();
    while (true) {
      const k = cursor.toISOString().slice(0, 10);
      if (dates.has(k)) {
        streak++;
        cursor.setDate(cursor.getDate() - 1);
      } else break;
    }
    return { total: entries.length, week: wk, month: mo, streak, words };
  }, [entries]);

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("diary_entries" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Entry deleted");
      qc.invalidateQueries({ queryKey: ["diary-entries"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to delete"),
  });

  const pinMut = useMutation({
    mutationFn: async ({ id, pinned }: { id: string; pinned: boolean }) => {
      const { error } = await supabase
        .from("diary_entries" as any)
        .update({ pinned })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["diary-entries"] }),
  });

  const duplicateMut = useMutation({
    mutationFn: async (e: Entry) => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not authenticated");
      const now = new Date();
      const { error } = await supabase.from("diary_entries" as any).insert({
        user_id: u.user.id,
        title: e.title ? `${e.title} (Copy)` : "",
        content: e.content,
        mood: e.mood,
        tags: e.tags,
        entry_date: now.toISOString().slice(0, 10),
        entry_time: now.toTimeString().slice(0, 8),
        pinned: false,
        is_draft: e.is_draft,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Entry duplicated");
      qc.invalidateQueries({ queryKey: ["diary-entries"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to duplicate"),
  });

  if (view.kind === "editor") {
    return (
      <AppShell>
        <DiaryEditor
          id={view.id}
          onBack={() => setView({ kind: "list" })}
          onSaved={(id) => {
            qc.invalidateQueries({ queryKey: ["diary-entries"] });
            setView({ kind: "detail", id });
          }}
        />
      </AppShell>
    );
  }

  if (view.kind === "detail") {
    const entry = entries.find((e) => e.id === view.id);
    return (
      <AppShell>
        {entry ? (
          <DiaryDetail
            entry={entry}
            onBack={() => setView({ kind: "list" })}
            onEdit={() => setView({ kind: "editor", id: entry.id })}
            onDelete={() => {
              deleteMut.mutate(entry.id);
              setView({ kind: "list" });
            }}
          />
        ) : (
          <div className="text-muted-foreground">Entry not found.</div>
        )}
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-8">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Daily Diary</h2>
            <p className="text-muted-foreground mt-2">
              Capture your daily thoughts, progress, ideas, and reflections.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search entries…"
                className="h-10 w-56 sm:w-64 rounded-full bg-surface-2/60 border-border pl-9"
              />
            </div>
            <button
              onClick={() => setShowFilters((v) => !v)}
              className={`h-10 px-3 inline-flex items-center gap-2 rounded-full border border-border text-sm transition ${showFilters ? "bg-surface-2" : "bg-surface-2/60 hover:bg-surface-2"}`}
            >
              <Filter className="size-4" /> Filter
            </button>
            <button
              onClick={() => setSortDesc((v) => !v)}
              className="h-10 px-3 inline-flex items-center gap-2 rounded-full bg-surface-2/60 border border-border text-sm hover:bg-surface-2 transition"
              title="Toggle sort"
            >
              <ArrowUpDown className="size-4" /> {sortDesc ? "Newest" : "Oldest"}
            </button>
            <Button onClick={() => setView({ kind: "editor" })} className="rounded-full h-10">
              <Plus className="size-4" /> New Entry
            </Button>
          </div>
        </header>

        {showFilters && (
          <div className="card-surface p-4 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Mood</span>
              <button
                onClick={() => setMoodFilter(null)}
                className={`size-8 rounded-full border border-border text-xs grid place-items-center ${!moodFilter ? "bg-primary/20" : "bg-surface-2/60 hover:bg-surface-2"}`}
              >
                All
              </button>
              {MOODS.map((m) => (
                <button
                  key={m}
                  onClick={() => setMoodFilter(moodFilter === m ? null : m)}
                  className={`size-8 rounded-full border border-border text-base grid place-items-center transition ${moodFilter === m ? "bg-primary/20" : "bg-surface-2/60 hover:bg-surface-2"}`}
                >
                  {m}
                </button>
              ))}
            </div>
            {allTags.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Tags</span>
                {allTags.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTagFilter(tagFilter === t ? null : t)}
                    className={`px-2.5 h-7 rounded-full text-xs border border-border ${tagFilter === t ? "bg-primary/20" : "bg-surface-2/60 hover:bg-surface-2"}`}
                  >
                    #{t}
                  </button>
                ))}
              </div>
            )}
            <label className="inline-flex items-center gap-2 text-sm ml-auto cursor-pointer">
              <input
                type="checkbox"
                checked={pinnedOnly}
                onChange={(e) => setPinnedOnly(e.target.checked)}
              />
              Pinned only
            </label>
          </div>
        )}

        <section className="grid gap-4 grid-cols-2 xl:grid-cols-5">
          <StatCard
            icon={BookOpen}
            tone="primary"
            value={String(stats.total)}
            label="Total Entries"
          />
          <StatCard icon={CalendarIcon} tone="info" value={String(stats.week)} label="This Week" />
          <StatCard
            icon={CalendarIcon}
            tone="success"
            value={String(stats.month)}
            label="This Month"
          />
          <StatCard
            icon={CheckCircle2}
            tone="warning"
            value={`${stats.streak}d`}
            label="Writing Streak"
          />
          <StatCard
            icon={Pencil}
            tone="pink"
            value={stats.words.toLocaleString()}
            label="Words Written"
          />
        </section>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div>
            <SectionLabel>My Diary Entries</SectionLabel>
            {entriesQ.isLoading ? (
              <div className="text-muted-foreground">Loading…</div>
            ) : filtered.length === 0 ? (
              <EmptyState hasAny={entries.length > 0} onNew={() => setView({ kind: "editor" })} />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {filtered.map((e) => (
                  <DiaryCard
                    key={e.id}
                    entry={e}
                    onOpen={() => setView({ kind: "detail", id: e.id })}
                    onEdit={() => setView({ kind: "editor", id: e.id })}
                    onDelete={() => {
                      if (confirm("Delete this entry?")) deleteMut.mutate(e.id);
                    }}
                    onDuplicate={() => duplicateMut.mutate(e)}
                    onPin={() => pinMut.mutate({ id: e.id, pinned: !e.pinned })}
                  />
                ))}
              </div>
            )}
          </div>

          <aside className="space-y-4">
            <SectionLabel>Calendar</SectionLabel>
            <MiniCalendar
              month={calendarMonth}
              setMonth={setCalendarMonth}
              entries={entries}
              selectedDate={selectedDate}
              onSelect={(d) => setSelectedDate(selectedDate === d ? null : d)}
            />
            {selectedDate && (
              <button
                onClick={() => setSelectedDate(null)}
                className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
              >
                <X className="size-3" /> Clear date filter ({selectedDate})
              </button>
            )}
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

function EmptyState({ hasAny, onNew }: { hasAny: boolean; onNew: () => void }) {
  return (
    <div className="card-surface p-10 text-center">
      <div className="text-5xl mb-3">📖</div>
      <div className="text-lg font-semibold">
        {hasAny ? "No entries match your filters." : "Your story starts today."}
      </div>
      <p className="text-sm text-muted-foreground mt-1">
        Start writing to capture your thoughts and reflections.
      </p>
      <Button onClick={onNew} className="mt-5 rounded-full">
        <Plus className="size-4" /> Write Your First Diary
      </Button>
    </div>
  );
}

function DiaryCard({
  entry,
  onOpen,
  onEdit,
  onDelete,
  onDuplicate,
  onPin,
}: {
  entry: Entry;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onPin: () => void;
}) {
  const preview = (entry.content || "").replace(/\s+/g, " ").slice(0, 180);
  return (
    <div className="card-surface p-5 flex flex-col gap-3 hover:border-primary/40 transition-all hover:-translate-y-0.5">
      <div className="flex items-start gap-3">
        <button onClick={onOpen} className="flex-1 text-left min-w-0">
          <div className="flex items-center gap-2">
            {entry.mood && <span className="text-xl">{entry.mood}</span>}
            <div className="font-semibold truncate">{entry.title || "Untitled entry"}</div>
          </div>
          <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
            {preview || "No content yet."}
          </p>
        </button>
        <button
          onClick={onPin}
          title={entry.pinned ? "Unpin" : "Pin"}
          className="size-8 grid place-items-center rounded-lg hover:bg-surface-2 text-muted-foreground hover:text-foreground"
        >
          {entry.pinned ? (
            <Pin className="size-4 text-primary fill-primary/30" />
          ) : (
            <PinOff className="size-4" />
          )}
        </button>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {entry.tags.slice(0, 4).map((t) => (
          <span
            key={t}
            className="px-2 h-6 inline-flex items-center rounded-full text-[11px] bg-surface-2/60 border border-border"
          >
            #{t}
          </span>
        ))}
        {entry.is_draft && (
          <span className="px-2 h-6 inline-flex items-center rounded-full text-[11px] bg-warning/15 text-warning border border-warning/30">
            Draft
          </span>
        )}
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {entry.entry_date} · {entry.entry_time.slice(0, 5)}
        </span>
        <span>Edited {new Date(entry.updated_at).toLocaleDateString()}</span>
      </div>
      <div className="flex items-center gap-1 -mb-1">
        <button onClick={onOpen} className="text-xs px-2.5 h-7 rounded-md hover:bg-surface-2">
          Open
        </button>
        <button
          onClick={onEdit}
          className="text-xs px-2.5 h-7 rounded-md hover:bg-surface-2 inline-flex items-center gap-1"
        >
          <Pencil className="size-3" /> Edit
        </button>
        <button
          onClick={onDuplicate}
          className="text-xs px-2.5 h-7 rounded-md hover:bg-surface-2 inline-flex items-center gap-1"
        >
          <Copy className="size-3" /> Duplicate
        </button>
        <button
          onClick={onDelete}
          className="text-xs px-2.5 h-7 rounded-md hover:bg-destructive/15 text-destructive inline-flex items-center gap-1 ml-auto"
        >
          <Trash2 className="size-3" /> Delete
        </button>
      </div>
    </div>
  );
}

function MiniCalendar({
  month,
  setMonth,
  entries,
  selectedDate,
  onSelect,
}: {
  month: Date;
  setMonth: (d: Date) => void;
  entries: Entry[];
  selectedDate: string | null;
  onSelect: (d: string) => void;
}) {
  const dates = useMemo(() => new Set(entries.map((e) => e.entry_date)), [entries]);
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const startWd = first.getDay();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startWd; i++) cells.push(null);
  for (let d = 1; d <= lastDay; d++) cells.push(d);
  while (cells.length % 7) cells.push(null);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="card-surface p-4">
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
          className="size-7 grid place-items-center rounded-md hover:bg-surface-2"
        >
          <ChevronLeft className="size-[18px]" />
        </button>
        <div className="text-sm font-semibold">
          {month.toLocaleString(undefined, { month: "long", year: "numeric" })}
        </div>
        <button
          onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
          className="size-7 grid place-items-center rounded-md hover:bg-surface-2"
        >
          <ChevronRight className="size-[18px]" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-[10px] text-muted-foreground mb-1">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i} className="text-center">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const key = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          const has = dates.has(key);
          const isToday = key === today;
          const isSel = selectedDate === key;
          return (
            <button
              key={i}
              onClick={() => onSelect(key)}
              className={`relative aspect-square text-xs rounded-md transition
                ${isSel ? "bg-primary text-primary-foreground" : has ? "bg-primary/15 hover:bg-primary/25" : "hover:bg-surface-2"}
                ${isToday && !isSel ? "ring-1 ring-primary/60" : ""}`}
            >
              {d}
              {has && !isSel && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 size-1 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DiaryDetail({
  entry,
  onBack,
  onEdit,
  onDelete,
}: {
  entry: Entry;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const contentRef = useRef<HTMLDivElement>(null);

  function print() {
    window.print();
  }

  function exportPdf() {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<html><head><title>${escapeHtml(entry.title || "Diary Entry")}</title>
      <style>body{font-family:ui-sans-serif,system-ui;padding:40px;max-width:720px;margin:auto;line-height:1.6;color:#111}
      h1{margin-bottom:4px} .meta{color:#666;font-size:13px;margin-bottom:24px}
      .content{white-space:pre-wrap}</style></head>
      <body><h1>${escapeHtml(entry.title || "Diary Entry")}</h1>
      <div class="meta">${entry.entry_date} · ${entry.entry_time.slice(0, 5)} ${entry.mood ? "· " + entry.mood : ""}</div>
      <div class="content">${entry.content || ""}</div></body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 300);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-[18px]" /> Back to All Entries
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={print}
            className="h-9 px-3 rounded-md bg-surface-2/60 border border-border hover:bg-surface-2 text-sm inline-flex items-center gap-2"
          >
            <Printer className="size-[18px]" /> Print
          </button>
          <button
            onClick={exportPdf}
            className="h-9 px-3 rounded-md bg-surface-2/60 border border-border hover:bg-surface-2 text-sm inline-flex items-center gap-2"
          >
            <Download className="size-[18px]" /> Export PDF
          </button>
          <Button variant="outline" onClick={onEdit} className="h-9">
            <Pencil className="size-[18px]" /> Edit
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              if (confirm("Delete this entry?")) onDelete();
            }}
            className="h-9"
          >
            <Trash2 className="size-[18px]" /> Delete
          </Button>
        </div>
      </div>

      <article className="card-surface p-8">
        <div className="flex items-center gap-3">
          {entry.mood && <span className="text-3xl">{entry.mood}</span>}
          <h1 className="text-3xl font-bold tracking-tight">{entry.title || "Untitled entry"}</h1>
        </div>
        <div className="mt-2 text-sm text-muted-foreground">
          {entry.entry_date} · {entry.entry_time.slice(0, 5)}
        </div>
        {entry.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {entry.tags.map((t) => (
              <span
                key={t}
                className="px-2.5 h-6 inline-flex items-center rounded-full text-xs bg-surface-2/60 border border-border"
              >
                #{t}
              </span>
            ))}
          </div>
        )}
        <div
          ref={contentRef}
          className="prose prose-invert max-w-none mt-6 text-foreground leading-relaxed [&_h1]:text-2xl [&_h2]:text-xl [&_blockquote]:border-l-2 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:text-muted-foreground [&_code]:bg-surface-2 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_pre]:bg-surface-2 [&_pre]:p-4 [&_pre]:rounded-lg [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_a]:text-primary [&_a]:underline"
          dangerouslySetInnerHTML={{
            __html: entry.content || "<p class='text-muted-foreground'>No content.</p>",
          }}
        />
        <div className="mt-8 pt-4 border-t border-border text-xs text-muted-foreground flex justify-between">
          <span>Created {new Date(entry.created_at).toLocaleString()}</span>
          <span>Last updated {new Date(entry.updated_at).toLocaleString()}</span>
        </div>
      </article>
    </div>
  );
}

function escapeHtml(s: string) {
  return s.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}

function DiaryEditor({
  id,
  onBack,
  onSaved,
}: {
  id?: string;
  onBack: () => void;
  onSaved: (id: string) => void;
}) {
  const qc = useQueryClient();
  const editorRef = useRef<HTMLDivElement>(null);
  const [title, setTitle] = useState("");
  const [mood, setMood] = useState<string | null>(null);
  const [tagsInput, setTagsInput] = useState("");
  const [content, setContent] = useState("");
  const [chars, setChars] = useState(0);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);
  const [currentId, setCurrentId] = useState<string | undefined>(id);
  const now = new Date();
  const [entryDate, setEntryDate] = useState<string>(now.toISOString().slice(0, 10));
  const [entryTime, setEntryTime] = useState<string>(now.toTimeString().slice(0, 5));

  const existing = useQuery({
    queryKey: ["diary-entry", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("diary_entries" as any)
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as Entry | null;
    },
  });

  useEffect(() => {
    if (existing.data) {
      setTitle(existing.data.title);
      setMood(existing.data.mood);
      setTagsInput(existing.data.tags.join(", "));
      setContent(existing.data.content);
      setEntryDate(existing.data.entry_date);
      setEntryTime(existing.data.entry_time.slice(0, 5));
      if (editorRef.current) editorRef.current.innerHTML = existing.data.content || "";
      setChars((existing.data.content || "").replace(/<[^>]+>/g, "").length);
    }
  }, [existing.data]);

  const tags = useMemo(
    () =>
      tagsInput
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean),
    [tagsInput],
  );

  async function persist(isDraft: boolean): Promise<string | null> {
    setSaving(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not authenticated");
      const payload = {
        user_id: u.user.id,
        title,
        content,
        mood,
        tags,
        entry_date: entryDate,
        entry_time: entryTime + ":00",
        is_draft: isDraft,
      };
      if (currentId) {
        const { error } = await supabase
          .from("diary_entries" as any)
          .update(payload)
          .eq("id", currentId);
        if (error) throw error;
        setSavedAt(new Date());
        return currentId;
      } else {
        const { data, error } = await supabase
          .from("diary_entries" as any)
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;
        const newId = (data as any).id as string;
        setCurrentId(newId);
        setSavedAt(new Date());
        return newId;
      }
    } catch (e: any) {
      toast.error(e.message ?? "Failed to save");
      return null;
    } finally {
      setSaving(false);
    }
  }

  // Autosave
  const dirtyRef = useRef(false);
  useEffect(() => {
    dirtyRef.current = true;
  }, [title, content, mood, tagsInput, entryDate, entryTime]);
  useEffect(() => {
    const t = setInterval(async () => {
      if (!dirtyRef.current) return;
      if (!title.trim() && !content.trim()) return;
      dirtyRef.current = false;
      await persist(true);
      qc.invalidateQueries({ queryKey: ["diary-entries"] });
    }, 5000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, content, mood, tagsInput, entryDate, entryTime, currentId]);

  function exec(cmd: string, value?: string) {
    document.execCommand(cmd, false, value);
    editorRef.current?.focus();
    syncContent();
  }

  function syncContent() {
    const html = editorRef.current?.innerHTML ?? "";
    setContent(html);
    setChars((editorRef.current?.innerText ?? "").length);
  }

  function insertLink() {
    const url = prompt("Enter URL");
    if (url) exec("createLink", url);
  }
  function insertImage() {
    const url = prompt("Image URL");
    if (url) exec("insertImage", url);
  }
  function insertCode() {
    exec("formatBlock", "pre");
  }
  function insertQuote() {
    exec("formatBlock", "blockquote");
  }

  async function publish() {
    if (!title.trim() && !content.trim()) {
      toast.error("Add a title or content first");
      return;
    }
    const newId = await persist(false);
    qc.invalidateQueries({ queryKey: ["diary-entries"] });
    if (newId) {
      toast.success("Entry published");
      onSaved(newId);
    }
  }
  async function saveDraft() {
    const newId = await persist(true);
    qc.invalidateQueries({ queryKey: ["diary-entries"] });
    if (newId) toast.success("Draft saved");
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-[18px]" /> Back
        </button>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {saving ? (
            <span className="inline-flex items-center gap-1">
              <Save className="size-3 animate-pulse" /> Saving…
            </span>
          ) : savedAt ? (
            <span className="inline-flex items-center gap-1 text-success">
              <CheckCircle2 className="size-3" /> Saved {savedAt.toLocaleTimeString()}
            </span>
          ) : (
            <span>Not saved yet</span>
          )}
          <span>· {chars} chars</span>
        </div>
      </div>

      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Entry title…"
        className="!text-2xl font-bold h-14 border-0 bg-transparent shadow-none px-0 focus-visible:ring-0"
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          {MOODS.map((m) => (
            <button
              key={m}
              onClick={() => setMood(mood === m ? null : m)}
              className={`size-9 grid place-items-center rounded-full border border-border text-lg transition ${mood === m ? "bg-primary/20 scale-110" : "bg-surface-2/60 hover:bg-surface-2"}`}
            >
              {m}
            </button>
          ))}
        </div>
        <Input
          type="date"
          value={entryDate}
          onChange={(e) => setEntryDate(e.target.value)}
          className="w-auto h-9"
        />
        <Input
          type="time"
          value={entryTime}
          onChange={(e) => setEntryTime(e.target.value)}
          className="w-auto h-9"
        />
        <Input
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="tags, comma, separated"
          className="flex-1 min-w-[180px] h-9"
        />
      </div>

      <div className="card-surface overflow-hidden">
        <div className="flex flex-wrap items-center gap-1 p-2 border-b border-border bg-surface-2/30">
          <ToolBtn onClick={() => exec("bold")} icon={Bold} label="Bold" />
          <ToolBtn onClick={() => exec("italic")} icon={Italic} label="Italic" />
          <ToolBtn onClick={() => exec("underline")} icon={UnderlineIcon} label="Underline" />
          <div className="w-px h-5 bg-border mx-1" />
          <ToolBtn onClick={() => exec("formatBlock", "h1")} icon={Heading1} label="H1" />
          <ToolBtn onClick={() => exec("formatBlock", "h2")} icon={Heading2} label="H2" />
          <ToolBtn onClick={() => exec("insertUnorderedList")} icon={List} label="Bullet list" />
          <ToolBtn
            onClick={() => exec("insertOrderedList")}
            icon={ListOrdered}
            label="Numbered list"
          />
          <ToolBtn onClick={insertQuote} icon={Quote} label="Quote" />
          <ToolBtn onClick={insertCode} icon={Code} label="Code" />
          <ToolBtn onClick={insertLink} icon={LinkIcon} label="Link" />
          <ToolBtn onClick={insertImage} icon={ImageIcon} label="Image" />
        </div>
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={syncContent}
          className="min-h-[360px] p-5 outline-none prose prose-invert max-w-none text-foreground leading-relaxed [&_h1]:text-2xl [&_h2]:text-xl [&_blockquote]:border-l-2 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:text-muted-foreground [&_code]:bg-surface-2 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_pre]:bg-surface-2 [&_pre]:p-4 [&_pre]:rounded-lg [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_a]:text-primary [&_a]:underline"
          data-placeholder="Write what's on your mind today…"
        />
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" onClick={saveDraft} disabled={saving}>
          Save Draft
        </Button>
        <Button onClick={publish} disabled={saving}>
          Publish Entry
        </Button>
      </div>
    </div>
  );
}

function ToolBtn({
  onClick,
  icon: Icon,
  label,
}: {
  onClick: () => void;
  icon: any;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className="size-8 grid place-items-center rounded-md hover:bg-surface-2 text-muted-foreground hover:text-foreground transition"
    >
      <Icon className="size-[18px]" />
    </button>
  );
}
