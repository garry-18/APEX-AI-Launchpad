import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useRef } from "react";
import { ArrowLeft, ArrowRight, Check, Loader2, Sparkles, Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { analyzeProfile } from "@/lib/ai-analysis.functions";
import { ApexLogo } from "@/components/ApexLogo";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "Onboarding — APEX AI" }] }),
  component: Onboarding,
});

function normalizeCollege(input: string) {
  let s = input.trim().toLowerCase().replace(/\s+/g, " ");
  if (!s) return "";
  if (!/\b(college|collage|university|institute|school)\b/.test(s)) s = `${s} college`;
  return s;
}
const DEGREES = ["B.Tech", "B.E.", "B.Sc", "B.A.", "M.Tech", "M.Sc", "MBA", "Ph.D", "Other"];
const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "Graduate"];

function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    dob: "",
    gender: "",
    college: "",
    degree: "",
    year_of_study: "",
    problem_statement: "",
    skills: "",
    linkedin_url: "",
    linkedin_headline: "",
    linkedin_about: "",
    linkedin_experience: "",
    linkedin_education: "",
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      setForm((f) => ({
        ...f,
        full_name:
          f.full_name ||
          data.user!.user_metadata?.full_name ||
          data.user!.user_metadata?.name ||
          "",
        email: f.email || data.user!.email || "",
      }));
    });
  }, []);

  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  function validateStep1() {
    if (!form.full_name.trim()) return "Full name is required";
    if (!form.email.trim() || !form.email.includes("@")) return "Valid email is required";
    if (!form.phone.trim() || form.phone.length < 7) return "Valid phone number is required";
    if (!form.dob) return "Date of birth is required";
    if (!form.gender) return "Gender is required";
    return null;
  }
  function validateStep2() {
    if (!form.college) return "Select your college";
    if (!form.degree) return "Select your degree";
    if (!form.year_of_study) return "Select your year of study";
    if (!form.problem_statement.trim()) return "Problem statement is required";
    return null;
  }
  function validateStep3() {
    const url = form.linkedin_url.trim();
    if (!url) return "LinkedIn URL is required";
    if (!/^https?:\/\/(www\.)?linkedin\.com\/in\/[A-Za-z0-9-_%]+\/?/.test(url))
      return "Enter a valid LinkedIn profile URL";
    return null;
  }

  async function next() {
    const err = step === 1 ? validateStep1() : step === 2 ? validateStep2() : null;
    if (err) return toast.error(err);
    setStep(step + 1);
  }

  async function finish() {
    const err = validateStep3();
    if (err) return toast.error(err);
    setLoading(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const skills = form.skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const collegeName = normalizeCollege(form.college);
      if (collegeName) {
        await supabase.from("colleges" as any).insert({ name: collegeName, city: "General" });
      }
      const { error, status, statusText } = await supabase
        .from("profiles")
        .update({
          full_name: form.full_name,
          email: form.email,
          phone: form.phone,
          dob: form.dob,
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
          onboarding_completed: true,
        })
        .eq("id", u.user.id);

      if (error) {
        console.error("Onboarding profile update query error:", {
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

      toast.success("Profile saved — generating AI analysis…");
      try {
        await analyzeProfile();
        toast.success("AI analysis complete");
      } catch (e: any) {
        toast.error("AI analysis failed — you can retry from your profile");
      }
      navigate({ to: "/profile" });
    } catch (e: any) {
      toast.error(e.message ?? "Failed to save");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background p-6 grid place-items-center">
      <div className="w-full max-w-2xl card-surface p-8">
        <div className="flex items-start justify-between gap-4 mb-6">
          <ApexLogo size="md" />
          <div className="text-right">
            <div className="text-xs text-muted-foreground uppercase tracking-wider">
              Step {step} of 3
            </div>
            <h1 className="text-lg font-bold text-foreground">
              {step === 1
                ? "Basic Information"
                : step === 2
                  ? "Academic Information"
                  : "LinkedIn Profile"}
            </h1>
          </div>
        </div>

        <Progress step={step} />

        <div className="mt-6 space-y-4">
          {step === 1 && (
            <>
              <Input label="Full Name" value={form.full_name} onChange={set("full_name")} />
              <Input
                label="Email Address"
                type="email"
                value={form.email}
                onChange={set("email")}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Phone Number" value={form.phone} onChange={set("phone")} />
                <Input label="Date of Birth" type="date" value={form.dob} onChange={set("dob")} />
              </div>
              <Select
                label="Gender"
                value={form.gender}
                onChange={set("gender")}
                options={["Male", "Female", "Non-binary", "Prefer not to say"]}
              />
            </>
          )}
          {step === 2 && (
            <>
              <CollegeAutocomplete
                label="College Name"
                value={form.college}
                onChange={set("college")}
              />
              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Degree"
                  value={form.degree}
                  onChange={set("degree")}
                  options={DEGREES}
                />
                <Select
                  label="Year of Study"
                  value={form.year_of_study}
                  onChange={set("year_of_study")}
                  options={YEARS}
                />
              </div>
              <Textarea
                label="Problem Statement"
                value={form.problem_statement}
                onChange={set("problem_statement")}
                placeholder="What problem are you trying to solve?"
              />
              <Input
                label="Skills (comma-separated, optional)"
                value={form.skills}
                onChange={set("skills")}
                placeholder="React, Python, Design Systems"
              />
            </>
          )}
          {step === 3 && (
            <>
              <Input
                label="LinkedIn Profile URL"
                value={form.linkedin_url}
                onChange={set("linkedin_url")}
                placeholder="https://www.linkedin.com/in/your-handle"
              />
              <p className="text-xs text-muted-foreground -mt-2">
                Manual import below. LinkedIn API requires partner approval for automatic photo,
                banner, experience, and post imports.
              </p>
              <Input
                label="Professional Headline"
                value={form.linkedin_headline}
                onChange={set("linkedin_headline")}
                placeholder="Product Engineer @ Apex"
              />
              <Textarea
                label="About"
                value={form.linkedin_about}
                onChange={set("linkedin_about")}
                placeholder="Tell us about yourself"
              />
              <Textarea
                label="Experience"
                value={form.linkedin_experience}
                onChange={set("linkedin_experience")}
                placeholder="Brief summary of work experience"
              />
              <Textarea
                label="Education"
                value={form.linkedin_education}
                onChange={set("linkedin_education")}
                placeholder="Recent education"
              />
            </>
          )}
        </div>

        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1 || loading}
            className="h-10 px-4 rounded-xl border border-border text-sm inline-flex items-center gap-2 hover:bg-surface-2/60 disabled:opacity-40"
          >
            <ArrowLeft className="size-[18px]" /> Back
          </button>
          {step < 3 ? (
            <button
              onClick={next}
              className="h-10 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-medium inline-flex items-center gap-2 hover:opacity-90"
            >
              Continue <ArrowRight className="size-[18px]" />
            </button>
          ) : (
            <button
              onClick={finish}
              disabled={loading}
              className="h-10 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-medium inline-flex items-center gap-2 hover:opacity-90"
            >
              {loading ? (
                <Loader2 className="size-[18px] animate-spin" />
              ) : (
                <Check className="size-[18px]" />
              )}{" "}
              Finish & Analyze
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Progress({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-2">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className={`h-1.5 flex-1 rounded-full transition ${i <= step ? "bg-primary" : "bg-surface-2"}`}
        />
      ))}
    </div>
  );
}

function Input({ label, value, onChange, type = "text", placeholder }: any) {
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

function Textarea({ label, value, onChange, placeholder }: any) {
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

function Select({ label, value, onChange, options }: any) {
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

function CollegeAutocomplete({ label, value, onChange }: any) {
  const [q, setQ] = useState(value || "");
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<string[]>([]);

  useEffect(() => {
    supabase
      .from("colleges" as any)
      .select("name")
      .order("name")
      .then(({ data }) => {
        if (data) setOptions((data as any[]).map((r) => r.name));
      });
  }, []);

  useEffect(() => {
    setQ(value || "");
  }, [value]);

  const filtered = useMemo(
    () => options.filter((o) => o.toLowerCase().includes(q.toLowerCase())).slice(0, 50),
    [q, options],
  );
  const normalized = normalizeCollege(q);
  const showAdd = normalized && !options.includes(normalized);

  return (
    <div className="block relative">
      <div className="text-xs text-muted-foreground mb-1.5">{label}</div>
      <div className="relative">
        <Search className="size-[18px] absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onChange={(e) => {
            setQ(e.target.value);
            onChange(e.target.value);
            setOpen(true);
          }}
          placeholder="Type or search your college…"
          className="w-full h-10 rounded-xl bg-surface-2/60 border border-border pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>
      {open && (
        <div className="absolute z-10 left-0 right-0 mt-1 card-surface max-h-56 overflow-auto py-1">
          {filtered.map((o) => (
            <button
              key={o}
              onMouseDown={() => {
                onChange(o);
                setQ(o);
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-surface-2/60 capitalize"
            >
              {o}
            </button>
          ))}
          {showAdd && (
            <button
              onMouseDown={() => {
                onChange(normalized);
                setQ(normalized);
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-surface-2/60 text-primary"
            >
              + Add "<span className="capitalize">{normalized}</span>"
            </button>
          )}
          {filtered.length === 0 && !showAdd && (
            <div className="px-3 py-2 text-sm text-muted-foreground">Keep typing…</div>
          )}
        </div>
      )}
    </div>
  );
}
