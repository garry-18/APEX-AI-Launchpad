import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — APEX AI" }] }),
  component: SettingsPage,
});

type Privacy = {
  public_profile: boolean;
  show_linkedin: boolean;
  show_ai_analysis: boolean;
  show_contact: boolean;
  show_leaderboard: boolean;
};

const DEFAULTS: Privacy = {
  public_profile: true,
  show_linkedin: true,
  show_ai_analysis: true,
  show_contact: false,
  show_leaderboard: true,
};

function SettingsPage() {
  const [privacy, setPrivacy] = useState<Privacy>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data } = await supabase
        .from("privacy_settings")
        .select("*")
        .eq("user_id", u.user.id)
        .maybeSingle();
      if (data)
        setPrivacy({
          public_profile: data.public_profile,
          show_linkedin: data.show_linkedin,
          show_ai_analysis: data.show_ai_analysis,
          show_contact: data.show_contact,
          show_leaderboard: data.show_leaderboard,
        });
      setLoading(false);
    })();
  }, []);

  async function update(patch: Partial<Privacy>) {
    const next = { ...privacy, ...patch };
    setPrivacy(next);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { error } = await supabase
      .from("privacy_settings")
      .upsert({ user_id: u.user.id, ...next });
    if (error) toast.error(error.message);
    else toast.success("Saved");
  }

  if (loading)
    return (
      <AppShell>
        <div className="text-muted-foreground text-sm">Loading…</div>
      </AppShell>
    );

  return (
    <AppShell>
      <div className="max-w-2xl space-y-3">
        <div className="eyebrow">Privacy Controls</div>
        <Row
          title="Public profile"
          desc="Allow other members to view your profile page."
          value={privacy.public_profile}
          onChange={(v) => update({ public_profile: v })}
        />
        <Row
          title="Show LinkedIn link"
          desc="Display your LinkedIn URL on your public profile."
          value={privacy.show_linkedin}
          onChange={(v) => update({ show_linkedin: v })}
        />
        <Row
          title="Show AI analysis"
          desc="Display AI insights and scores on your public profile."
          value={privacy.show_ai_analysis}
          onChange={(v) => update({ show_ai_analysis: v })}
        />
        <Row
          title="Show contact information"
          desc="Display your email address on your public profile."
          value={privacy.show_contact}
          onChange={(v) => update({ show_contact: v })}
        />
        <Row
          title="Show on leaderboard"
          desc="Include yourself in the global leaderboard rankings."
          value={privacy.show_leaderboard}
          onChange={(v) => update({ show_leaderboard: v })}
        />
      </div>
    </AppShell>
  );
}

function Row({
  title,
  desc,
  value,
  onChange,
}: {
  title: string;
  desc: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="card-surface p-5 flex items-center justify-between gap-6">
      <div>
        <div className="font-medium">{title}</div>
        <div className="text-sm text-muted-foreground mt-1">{desc}</div>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative h-6 w-11 rounded-full transition ${value ? "bg-primary" : "bg-surface-2 border border-border"}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-white transition-transform ${value ? "translate-x-5" : ""}`}
        />
      </button>
    </div>
  );
}
