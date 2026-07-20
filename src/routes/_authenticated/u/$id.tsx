import { createFileRoute, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Linkedin,
  MapPin,
  Briefcase,
  Trophy,
  CalendarCheck,
  MessageSquare,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { IconBadge } from "@/components/Tile";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/u/$id")({
  head: () => ({ meta: [{ title: "Member Profile — APEX AI" }] }),
  component: PublicProfile,
});

function PublicProfile() {
  const { id } = useParams({ from: "/_authenticated/u/$id" });
  const { user, role: callerRole } = Route.useRouteContext();

  const q = useQuery({
    queryKey: ["member-profile", id, callerRole, user?.id],
    queryFn: async () => {
      const isAdminOrSuper = callerRole === "admin" || callerRole === "super_admin";
      const profileTable = isAdminOrSuper ? "profiles" : "public_profiles";
      const aiTable = isAdminOrSuper ? "ai_analysis" : "public_ai_analysis";

      const [{ data: profile }, { data: ai }] = await Promise.all([
        supabase
          .from(profileTable as any)
          .select("*")
          .eq("id", id)
          .maybeSingle(),
        supabase
          .from(aiTable as any)
          .select("*")
          .eq("user_id", id)
          .maybeSingle(),
      ]);

      // Frontend security check for Admin
      if (callerRole === "admin" && profile) {
        const p = profile as any;
        // If target is another admin or super_admin, and not themselves, block access
        if ((p.role === "admin" || p.role === "super_admin") && p.id !== user?.id) {
          return {
            profile: null,
            ai: null,
            accessDenied: true,
            reason: "You do not have permission to view other Admin profiles.",
          };
        }
        // If target is an intern, check if they belong to the admin's assigned statements
        if (p.role === "intern") {
          const { data: adminAssigns } = await supabase
            .from("admin_problem_statements" as any)
            .select("problem_statement_id")
            .eq("admin_id", user?.id)
            .eq("is_active", true);
          const assignedIds = (adminAssigns || []).map(
            (a: any) => a.problem_statement_id,
          );
          if (!p.problem_statement_id || !assignedIds.includes(p.problem_statement_id)) {
            return {
              profile: null,
              ai: null,
              accessDenied: true,
              reason: "This intern does not belong to your assigned problem statements.",
            };
          }
        }
      }

      return { profile: profile as any, ai: ai as any };
    },
  });

  if (q.isLoading)
    return (
      <AppShell>
        <div className="text-muted-foreground">Loading…</div>
      </AppShell>
    );

  const { profile: p, ai, accessDenied, reason } = q.data ?? {};

  if (accessDenied) {
    return (
      <AppShell>
        <div className="card-surface p-8 text-center max-w-2xl mx-auto my-12">
          <div className="font-semibold text-red-600">Access Denied</div>
          <div className="text-sm text-muted-foreground mt-1">{reason}</div>
        </div>
      </AppShell>
    );
  }

  if (!p)
    return (
      <AppShell>
        <div className="card-surface p-8 text-center">
          <div className="font-semibold">This profile is private or not found</div>
          <div className="text-sm text-muted-foreground mt-1">
            The member may have chosen not to share their profile publicly.
          </div>
        </div>
      </AppShell>
    );

  const initials = (p.full_name ?? "U")
    .split(" ")
    .map((s: string) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const showLinkedIn = !!p.linkedin_url;
  const showAI = !!ai;
  const showContact = !!p.email;

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="card-surface overflow-hidden">
          <div className="h-40 bg-surface-2 border-b border-border/50">
            {p.banner_url && (
              <img src={p.banner_url} alt="" className="w-full h-full object-cover" />
            )}
          </div>
          <div className="px-6 pb-6 -mt-12">
            <div className="flex items-end justify-between gap-4 flex-wrap">
              <div className="flex items-end gap-4">
                {p.avatar_url ? (
                  <img
                    src={p.avatar_url}
                    alt=""
                    className="size-24 rounded-2xl object-cover ring-4 ring-surface"
                  />
                ) : (
                  <div className="size-24 rounded-2xl bg-brand-orange-gradient grid place-items-center text-2xl font-bold text-white ring-4 ring-surface">
                    {initials}
                  </div>
                )}
                <div className="pb-2">
                  <div className="text-2xl font-bold">{p.full_name ?? "Member"}</div>
                  <div className="text-sm text-muted-foreground">
                    {p.linkedin_headline ?? p.degree ?? ""}
                  </div>
                </div>
              </div>
              {showLinkedIn && (
                <a
                  href={p.linkedin_url ?? "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium inline-flex items-center gap-2 hover:opacity-90"
                >
                  <Linkedin className="size-4" /> Open LinkedIn <ExternalLink className="size-3" />
                </a>
              )}
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3 text-sm">
              <Info icon={MapPin} value={p.college ?? "—"} />
              <Info
                icon={Briefcase}
                value={p.degree ? `${p.degree} · ${p.year_of_study ?? ""}` : "—"}
              />
              {showContact && <Info icon={MessageSquare} value={p.email ?? "—"} />}
            </div>

            {p.problem_statement && (
              <div className="mt-6">
                <div className="eyebrow mb-1.5">Problem Statement</div>
                <p className="text-sm">{p.problem_statement}</p>
              </div>
            )}
            {p.linkedin_about && (
              <div className="mt-5">
                <div className="eyebrow mb-1.5">About</div>
                <p className="text-sm whitespace-pre-wrap">{p.linkedin_about}</p>
              </div>
            )}
            {(p.skills?.length ?? 0) > 0 && (
              <div className="mt-5">
                <div className="eyebrow mb-2">Skills</div>
                <div className="flex flex-wrap gap-2">
                  {(p.skills ?? []).map((s: string) => (
                    <span
                      key={s}
                      className="px-3 py-1 rounded-full bg-surface-2/60 border border-border text-xs"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Stat
            icon={CalendarCheck}
            tone="success"
            value={p.attendance_points}
            label="Attendance Points"
          />
          <Stat
            icon={MessageSquare}
            tone="pink"
            value={p.community_points}
            label="Community Points"
          />
          <Stat icon={Trophy} tone="warning" value={ai?.overall_score ?? "—"} label="AI Score" />
        </div>

        {showAI && (
          <div className="card-surface p-6">
            <div className="flex items-center gap-3 mb-5">
              <IconBadge icon={Sparkles} tone="primary" />
              <div>
                <div className="font-semibold">AI Insights</div>
                <div className="text-xs text-muted-foreground">Generated by Google Gemini API</div>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <Ring label="Overall" value={ai.overall_score} />
              <Ring label="Branding" value={ai.branding_score} />
              <Ring label="Content" value={ai.content_score} />
              <Ring label="Completeness" value={ai.completeness_score} />
              <Ring label="Networking" value={ai.networking_score} />
            </div>
            {ai.summary && <p className="text-sm text-foreground/90 mt-5">{ai.summary}</p>}
            <div className="grid gap-4 md:grid-cols-2 mt-5">
              <List title="Suggested Improvements" items={ai.suggestions as string[]} />
              <List title="Skill Recommendations" items={ai.recommendations as string[]} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 pt-5 mt-5 border-t border-border">
              <Bar label="Resume Readiness" value={ai.resume_readiness} />
              <Bar label="Recruiter Readiness" value={ai.recruiter_readiness} />
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function Info({ icon: Icon, value }: any) {
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <Icon className="size-4" />
      <span className="text-foreground/90 truncate">{value}</span>
    </div>
  );
}
function Stat({ icon, tone, value, label }: any) {
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
function Ring({ label, value }: { label: string; value: number }) {
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
function List({ title, items }: { title: string; items: string[] }) {
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
