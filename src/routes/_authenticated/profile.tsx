import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  Mail,
  MapPin,
  Briefcase,
  Trophy,
  CalendarCheck,
  CheckSquare,
  Linkedin,
  Sparkles,
  Loader2,
  ExternalLink,
  Lightbulb,
  Pencil,
  X,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { IconBadge } from "@/components/Tile";
import { supabase } from "@/integrations/supabase/client";
import { analyzeProfile } from "@/lib/ai-analysis.functions";
import { useServerFn } from "@tanstack/react-start";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile — APEX AI" }] }),
  component: Profile,
});

const DEGREES = ["B.Tech", "B.E.", "B.Sc", "B.A.", "M.Tech", "M.Sc", "MBA", "Ph.D", "Other"];
const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "Graduate"];

function normalizeCollege(input: string) {
  let s = (input ?? "").trim().toLowerCase().replace(/\s+/g, " ");
  if (!s) return "";
  if (!/\b(college|collage|university|institute|school)\b/.test(s)) s = `${s} college`;
  return s;
}

function Profile() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const profile = useQuery({
    queryKey: ["my-profile"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data, error, status, statusText } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", u.user.id)
        .maybeSingle();

      if (error) {
        console.error("fetch my-profile query error:", {
          status,
          statusText,
          error: {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint,
          },
        });
      }
      return data;
    },
  });
  const ai = useQuery({
    queryKey: ["my-ai-analysis"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data } = await supabase
        .from("ai_analysis")
        .select("*")
        .eq("user_id", u.user.id)
        .maybeSingle();
      return data;
    },
  });
  const analyze = useServerFn(analyzeProfile);
  const regenerate = useMutation({
    mutationFn: () => analyze(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-ai-analysis"] });
      toast.success("Analysis updated");
    },
    onError: (e: any) => toast.error(e.message ?? "Analysis failed"),
  });

  const p = profile.data;
  const a = ai.data;
  const initials = (p?.full_name ?? p?.email ?? "U")
    .split(" ")
    .map((s: string) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="card-surface overflow-hidden">
          <div className="h-32 bg-surface-2 border-b border-border/50" />
          <div className="px-6 pb-6 -mt-10">
            <div className="flex items-end justify-between gap-4 flex-wrap">
              <div className="flex items-end gap-4">
                {p?.avatar_url ? (
                  <img
                    src={p.avatar_url}
                    alt=""
                    className="size-20 rounded-2xl object-cover ring-4 ring-surface"
                  />
                ) : (
                  <div className="size-20 rounded-2xl bg-brand-orange-gradient grid place-items-center text-2xl font-bold text-white ring-4 ring-surface">
                    {initials}
                  </div>
                )}
                <div className="pb-2">
                  <div className="text-xl font-bold">{p?.full_name ?? "Your name"}</div>
                  <div className="text-sm text-muted-foreground">
                    {p?.linkedin_headline ?? "Member"}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 pb-2 flex-wrap">
                <button
                  onClick={() => setEditing(true)}
                  className="h-9 px-3 rounded-xl bg-primary text-primary-foreground text-sm inline-flex items-center gap-2 hover:opacity-90"
                >
                  <Pencil className="size-[18px]" /> Edit Profile
                </button>
                {p?.linkedin_url && (
                  <a
                    href={p.linkedin_url}
                    target="_blank"
                    rel="noreferrer"
                    className="h-9 px-3 rounded-xl border border-border text-sm inline-flex items-center gap-2 hover:bg-surface-2/60"
                  >
                    <Linkedin className="size-[18px]" /> LinkedIn
                  </a>
                )}
                {p && (
                  <Link
                    to="/u/$id"
                    params={{ id: p.id }}
                    className="h-9 px-3 rounded-xl border border-border text-sm inline-flex items-center gap-2 hover:bg-surface-2/60"
                  >
                    <ExternalLink className="size-[18px]" /> Public view
                  </Link>
                )}
              </div>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-sm">
              <InfoRow icon={Mail} label={p?.email ?? "—"} />
              <InfoRow icon={MapPin} label={p?.college ?? "—"} className="capitalize" />
              <InfoRow icon={Lightbulb} label={p?.problem_statement ?? "—"} />
              <InfoRow
                icon={Briefcase}
                label={p?.degree ? `${p.degree} · ${p.year_of_study ?? ""}` : "—"}
              />
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <ProfileStat
            icon={Trophy}
            tone="warning"
            value={a?.overall_score ?? "—"}
            label="LinkedIn Score"
          />
          <ProfileStat
            icon={CalendarCheck}
            tone="success"
            value={`${p?.attendance_points ?? 0}`}
            label="Attendance Points"
          />
          <ProfileStat
            icon={CheckSquare}
            tone="primary"
            value={`${p?.community_points ?? 0}`}
            label="Community Points"
          />
        </div>

        <div className="card-surface p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <IconBadge icon={Sparkles} tone="primary" />
              <div>
                <div className="font-semibold">AI Profile Analysis</div>
                <div className="text-xs text-muted-foreground">Generated by Google Gemini API</div>
              </div>
            </div>
            <button
              onClick={() => regenerate.mutate()}
              disabled={regenerate.isPending}
              className="h-9 px-3 rounded-xl border border-border text-sm inline-flex items-center gap-2 hover:bg-surface-2/60"
            >
              {regenerate.isPending && <Loader2 className="size-[18px] animate-spin" />} Regenerate
            </button>
          </div>

          {!a ? (
            <p className="text-sm text-muted-foreground">
              No analysis yet — click Regenerate to create one.
            </p>
          ) : (
            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <ScoreRing label="Overall" value={a.overall_score} />
                <ScoreRing label="Branding" value={a.branding_score} />
                <ScoreRing label="Content" value={a.content_score} />
                <ScoreRing label="Completeness" value={a.completeness_score} />
                <ScoreRing label="Networking" value={a.networking_score} />
              </div>
              {a.summary && (
                <p className="text-sm text-foreground/90 leading-relaxed">{a.summary}</p>
              )}
              <div className="grid gap-4 md:grid-cols-2">
                <ListBlock title="Suggestions" items={a.suggestions as string[]} />
                <ListBlock title="Recommendations" items={a.recommendations as string[]} />
              </div>
              {(a.missing_sections as string[])?.length > 0 && (
                <ListBlock title="Missing / weak sections" items={a.missing_sections as string[]} />
              )}
              <div className="grid gap-3 sm:grid-cols-2 pt-2 border-t border-border">
                <Bar label="Resume readiness" value={a.resume_readiness} />
                <Bar label="Recruiter readiness" value={a.recruiter_readiness} />
              </div>
            </div>
          )}
        </div>
      </div>

      {editing && p && (
        <EditProfileModal
          profile={p}
          onClose={() => setEditing(false)}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ["my-profile"] });
            setEditing(false);
          }}
        />
      )}
    </AppShell>
  );
}

function EditProfileModal({
  profile,
  onClose,
  onSaved,
}: {
  profile: any;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: profile.full_name ?? "",
    phone: profile.phone ?? "",
    dob: profile.dob ?? "",
    gender: profile.gender ?? "",
    college: profile.college ?? "",
    degree: profile.degree ?? "",
    year_of_study: profile.year_of_study ?? "",
    problem_statement: profile.problem_statement ?? "",
    skills: Array.isArray(profile.skills) ? profile.skills.join(", ") : "",
    linkedin_url: profile.linkedin_url ?? "",
    linkedin_headline: profile.linkedin_headline ?? "",
    linkedin_about: profile.linkedin_about ?? "",
    linkedin_experience: profile.linkedin_experience ?? "",
    linkedin_education: profile.linkedin_education ?? "",
    avatar_url: profile.avatar_url ?? "",
  });
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function save() {
    if (!form.full_name.trim()) return toast.error("Full name is required");
    setSaving(true);
    try {
      const collegeName = form.college ? normalizeCollege(form.college) : "";
      if (collegeName) {
        await supabase.from("colleges" as any).insert({ name: collegeName, city: "General" });
      }
      const skills = form.skills
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean);
      const { error, status, statusText } = await supabase
        .from("profiles")
        .update({
          full_name: form.full_name,
          phone: form.phone,
          dob: form.dob || null,
          gender: form.gender,
          college: collegeName,
          degree: form.degree,
          year_of_study: form.year_of_study,
          problem_statement: form.problem_statement,
          skills,
          linkedin_url: form.linkedin_url,
          linkedin_headline: form.linkedin_headline,
          linkedin_about: form.linkedin_about,
          linkedin_experience: form.linkedin_experience,
          linkedin_education: form.linkedin_education,
          avatar_url: form.avatar_url,
        })
        .eq("id", profile.id);

      if (error) {
        console.error("Save profile update query error:", {
          status,
          statusText,
          error: {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint,
          },
        });
        throw error;
      }
      toast.success("Profile updated");
      onSaved();
    } catch (e: any) {
      toast.error(e.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl card-surface max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-border bg-surface">
          <h2 className="text-lg font-bold">Edit Profile</h2>
          <button
            onClick={onClose}
            className="size-8 grid place-items-center rounded-lg hover:bg-surface-2/60"
          >
            <X className="size-[18px]" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <Field
            label="Avatar URL"
            value={form.avatar_url}
            onChange={set("avatar_url")}
            placeholder="https://…"
          />
          <Field label="Full Name" value={form.full_name} onChange={set("full_name")} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Phone" value={form.phone} onChange={set("phone")} />
            <Field label="Date of Birth" type="date" value={form.dob} onChange={set("dob")} />
          </div>
          <SelectField
            label="Gender"
            value={form.gender}
            onChange={set("gender")}
            options={["Male", "Female", "Non-binary", "Prefer not to say"]}
          />
          <Field
            label="College"
            value={form.college}
            onChange={set("college")}
            placeholder="Your college name"
          />
          <div className="grid grid-cols-2 gap-3">
            <SelectField
              label="Degree"
              value={form.degree}
              onChange={set("degree")}
              options={DEGREES}
            />
            <SelectField
              label="Year of Study"
              value={form.year_of_study}
              onChange={set("year_of_study")}
              options={YEARS}
            />
          </div>
          <TextareaField
            label="Problem Statement"
            value={form.problem_statement}
            onChange={set("problem_statement")}
          />
          <Field
            label="Skills (comma-separated)"
            value={form.skills}
            onChange={set("skills")}
            placeholder="React, Python, Design"
          />
          <Field label="LinkedIn URL" value={form.linkedin_url} onChange={set("linkedin_url")} />
          <Field
            label="Headline"
            value={form.linkedin_headline}
            onChange={set("linkedin_headline")}
          />
          <TextareaField
            label="About"
            value={form.linkedin_about}
            onChange={set("linkedin_about")}
          />
          <TextareaField
            label="Experience"
            value={form.linkedin_experience}
            onChange={set("linkedin_experience")}
          />
          <TextareaField
            label="Education"
            value={form.linkedin_education}
            onChange={set("linkedin_education")}
          />
        </div>
        <div className="sticky bottom-0 flex items-center justify-end gap-2 px-6 py-4 border-t border-border bg-surface">
          <button
            onClick={onClose}
            disabled={saving}
            className="h-10 px-4 rounded-xl border border-border text-sm hover:bg-surface-2/60"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="h-10 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-medium inline-flex items-center gap-2 hover:opacity-90"
          >
            {saving ? (
              <Loader2 className="size-[18px] animate-spin" />
            ) : (
              <Save className="size-[18px]" />
            )}{" "}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder }: any) {
  return (
    <label className="block">
      <div className="text-xs text-muted-foreground mb-1.5">{label}</div>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-10 rounded-xl bg-surface-2/60 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
      />
    </label>
  );
}
function TextareaField({ label, value, onChange, placeholder }: any) {
  return (
    <label className="block">
      <div className="text-xs text-muted-foreground mb-1.5">{label}</div>
      <textarea
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full rounded-xl bg-surface-2/60 border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
      />
    </label>
  );
}
function SelectField({ label, value, onChange, options }: any) {
  return (
    <label className="block">
      <div className="text-xs text-muted-foreground mb-1.5">{label}</div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-10 rounded-xl bg-surface-2/60 border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
      >
        <option value="">Select…</option>
        {options.map((o: string) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

function InfoRow({ icon: Icon, label, className }: any) {
  return (
    <div className="flex items-center gap-2 text-muted-foreground min-w-0">
      <Icon className="size-[18px] shrink-0" />{" "}
      <span className={`text-foreground/90 truncate ${className ?? ""}`}>{label}</span>
    </div>
  );
}
function ProfileStat({ icon, tone, value, label }: any) {
  return (
    <div className="card-surface p-5 flex items-center gap-4">
      <IconBadge icon={icon} tone={tone} />
      <div>
        <div className="text-xl font-bold">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}
function ScoreRing({ label, value }: { label: string; value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="card-surface p-4 flex flex-col items-center gap-2">
      <div className="relative size-16">
        <svg viewBox="0 0 36 36" className="size-16 -rotate-90">
          <circle cx="18" cy="18" r="16" fill="none" stroke="var(--color-border)" strokeWidth="3" />
          <circle
            cx="18"
            cy="18"
            r="16"
            fill="none"
            stroke="var(--primary)"
            strokeWidth="3"
            strokeDasharray={`${pct} 100`}
            pathLength={100}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center text-sm font-bold">{pct}</div>
      </div>
      <div className="text-xs text-muted-foreground text-center">{label}</div>
    </div>
  );
}
function Bar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold">{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
        <div className="h-full bg-primary transition-all" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
function ListBlock({ title, items }: { title: string; items: string[] }) {
  if (!items?.length) return null;
  return (
    <div>
      <div className="eyebrow mb-2">{title}</div>
      <ul className="space-y-2">
        {items.map((it, i) => (
          <li key={i} className="text-sm flex gap-2">
            <span className="text-primary mt-0.5">•</span>
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
