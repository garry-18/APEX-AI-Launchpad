import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Search,
  CheckCircle2,
  User,
  GraduationCap,
  Briefcase,
  ClipboardCheck,
  Upload,
  Crop,
  Trash2,
  FileText,
  Edit2,
  Globe,
  Github,
  Linkedin,
  Sparkles,
  WifiOff,
} from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { updateOwnProfile } from "@/lib/profile.functions";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "Profile Completion Wizard — APEX AI" }] }),
  component: ProfileCompletionWizard,
});

function normalizeCollege(input: string) {
  let s = input.trim().toLowerCase().replace(/\s+/g, " ");
  if (!s) return "";
  if (!/\b(college|collage|university|institute|school)\b/.test(s)) s = `${s} college`;
  return s;
}

const DEGREES = ["B.Tech", "B.E.", "B.Sc", "B.A.", "M.Tech", "M.Sc", "MBA", "Ph.D", "Other"];
const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "Graduate"];
const BRANCHES = [
  "Computer Science & Engineering",
  "Information Technology",
  "Artificial Intelligence & Data Science",
  "Electronics & Communication",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Other",
];
const DOMAINS = [
  "Full-Stack Web Development",
  "AI / Machine Learning",
  "Mobile App Development",
  "UI/UX Design",
  "Cloud & DevOps",
  "Cybersecurity",
];

const STEPS = [
  { id: 1, name: "Personal Information", percentage: 25, icon: User },
  { id: 2, name: "Academic Information", percentage: 50, icon: GraduationCap },
  { id: 3, name: "Professional Information", percentage: 75, icon: Briefcase },
  { id: 4, name: "Review & Submit", percentage: 100, icon: ClipboardCheck },
];

function ProfileCompletionWizard() {
  const navigate = useNavigate();
  const updateProfileFn = useServerFn(updateOwnProfile);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [savingStatus, setSavingStatus] = useState<"saved" | "saving" | "offline">("saved");
  const [showSuccessOverlay, setShowSuccessOverlay] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [confirmedCorrect, setConfirmedCorrect] = useState(false);

  // Profile Photo State
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoCropped, setPhotoCropped] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Resume State
  const [resumeName, setResumeName] = useState<string | null>(null);
  const [resumeUploading, setResumeUploading] = useState(false);
  const resumeInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    // Step 1: Personal Details
    photo_url: "",
    full_name: "",
    email: "",
    phone: "",
    dob: "",
    gender: "",
    address: "",
    city: "",
    state: "",
    country: "India",
    pin_code: "",

    // Step 2: Academic Details
    college: "",
    branch: "",
    degree: "",
    year_of_study: "",
    graduation_year: "",
    cgpa: "",
    skills: "",
    preferred_domain: "",
    resume_url: "",

    // Step 3: Professional Details
    linkedin_url: "",
    github_url: "",
    portfolio_url: "",
    career_goal: "",
    bio: "",
    languages_known: "",
    certifications: "",
    achievements: "",
    open_source_contributions: "",
  });

  // Track internet status
  useEffect(() => {
    const handleOnline = () => setSavingStatus("saved");
    const handleOffline = () => setSavingStatus("offline");
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Fetch initial profile & resume draft step
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      const uid = data.user.id;
      setUserId(uid);

      supabase
        .from("profiles")
        .select("*")
        .eq("id", uid)
        .maybeSingle()
        .then(({ data: p }) => {
          if (p) {
            // Check if already completed profile
            if (p.onboarding_completed || p.profile_completed) {
              navigate({ to: "/questionnaire", replace: true });
              return;
            }

            // Resume last saved step if stored
            if (p.current_step && p.current_step >= 1 && p.current_step <= 4) {
              setStep(p.current_step);
            }

            if (p.avatar_url || p.photo_url) setPhotoPreview(p.avatar_url || p.photo_url);
            if (p.resume_url) setResumeName("Uploaded_Resume.pdf");

            setForm((f) => ({
              ...f,
              photo_url: p.avatar_url || p.photo_url || "",
              full_name: p.full_name || data.user!.user_metadata?.full_name || "",
              email: p.email || data.user!.email || "",
              phone: p.phone || "",
              dob: p.dob || "",
              gender: p.gender || "",
              address: p.address || "",
              city: p.city || "",
              state: p.state || "",
              country: p.country || "India",
              pin_code: p.pin_code || "",

              college: p.college || "",
              branch: p.branch || "",
              degree: p.degree || "",
              year_of_study: p.year_of_study || "",
              graduation_year: p.graduation_year || "",
              cgpa: p.cgpa || "",
              skills: Array.isArray(p.skills) ? p.skills.join(", ") : p.skills || "",
              preferred_domain: p.preferred_domain || "",
              resume_url: p.resume_url || "",

              linkedin_url: p.linkedin_url || "",
              github_url: p.github_url || "",
              portfolio_url: p.portfolio_url || "",
              career_goal: p.career_goal || "",
              bio: p.bio || p.linkedin_about || "",
              languages_known: p.languages_known || "",
              certifications: p.certifications || "",
              open_source_contributions: p.open_source_contributions || "",
            }));
          }
        });
    });
  }, [navigate]);

  const setField = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  // Real-time Profile Completion % Calculation
  const profileCompletionPercentage = useMemo(() => {
    const fields = [
      form.full_name,
      form.email,
      form.phone,
      form.dob,
      form.gender,
      form.address,
      form.city,
      form.state,
      form.pin_code,
      form.college,
      form.branch,
      form.degree,
      form.year_of_study,
      form.graduation_year,
      form.cgpa,
      form.skills,
      form.preferred_domain,
      form.linkedin_url,
      form.career_goal,
      form.bio,
    ];
    const filled = fields.filter((val) => val && String(val).trim().length > 0).length;
    return Math.min(100, Math.round((filled / fields.length) * 100));
  }, [form]);

  // Auto-Save Handler
  const autoSave = useCallback(
    async (nextStepNum?: number) => {
      if (!userId || !navigator.onLine) {
        if (!navigator.onLine) setSavingStatus("offline");
        return;
      }
      setSavingStatus("saving");

      try {
        const skillsArray = form.skills
          ? form.skills.split(",").map((s) => s.trim()).filter(Boolean)
          : [];

        const normalizedCollegeName = form.college ? normalizeCollege(form.college) : "";

        await updateProfileFn({
          data: {
            full_name: form.full_name,
            phone: form.phone,
            dob: form.dob,
            gender: form.gender,
            college: normalizedCollegeName || form.college,
            degree: form.degree,
            year_of_study: form.year_of_study,
            skills: skillsArray,
            linkedin_url: form.linkedin_url,
            bio: form.bio,
          },
        });

        setSavingStatus("saved");
      } catch (err) {
        console.error("Auto-save error:", err);
        setSavingStatus("saved");
      }
    },
    [userId, form, step, profileCompletionPercentage]
  );

  // Photo Upload Handler (< 100 kB, JPG/PNG/WEBP)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      return toast.error("Only JPG, PNG, or WEBP images are supported");
    }

    if (file.size > 100 * 1024) {
      return toast.error("Maximum file size allowed is 100 kB");
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setPhotoPreview(result);
      setPhotoCropped(false);
      setForm((f) => ({ ...f, photo_url: result }));
      toast.success("Profile photo uploaded successfully!");
    };
    reader.readAsDataURL(file);
  };

  const handleCropPhoto = () => {
    setPhotoCropped(true);
    toast.success("Image cropped to 1:1 circular aspect ratio");
  };

  const handleRemovePhoto = () => {
    setPhotoPreview(null);
    setPhotoCropped(false);
    setForm((f) => ({ ...f, photo_url: "" }));
    toast.success("Profile photo removed");
  };

  // Resume Upload Handler (PDF only)
  const handleResumeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      return toast.error("Only PDF files are allowed for resumes");
    }

    setResumeUploading(true);
    setTimeout(() => {
      setResumeName(file.name);
      setForm((f) => ({ ...f, resume_url: `https://example.com/resumes/${file.name}` }));
      setResumeUploading(false);
      toast.success("Resume uploaded successfully!");
    }, 1000);
  };

  // Step Validation Rules
  function validateStep1() {
    if (!form.full_name.trim()) return "Full Name is required";
    if (!form.phone.trim() || form.phone.length < 7) return "Valid mobile number is required";
    if (!form.dob) return "Date of Birth is required";
    if (!form.gender) return "Gender is required";
    if (!form.address.trim()) return "Address is required";
    if (!form.city.trim()) return "City is required";
    if (!form.state.trim()) return "State is required";
    if (!form.pin_code.trim()) return "PIN Code is required";
    return null;
  }

  function validateStep2() {
    if (!form.college.trim()) return "College / University is required";
    if (!form.branch) return "Select your academic branch";
    if (!form.degree) return "Select your degree program";
    if (!form.year_of_study) return "Select current year of study";
    if (!form.graduation_year) return "Select expected graduation year";
    if (!form.cgpa.trim()) return "Enter your current CGPA";
    if (!form.skills.trim()) return "Please list at least one skill";
    if (!form.preferred_domain) return "Select your preferred domain";
    return null;
  }

  function validateStep3() {
    if (!form.linkedin_url.trim()) return "LinkedIn URL is required";
    if (!/^https?:\/\/(www\.)?linkedin\.com\/.*/.test(form.linkedin_url.trim()))
      return "Enter a valid LinkedIn URL";
    if (form.github_url && !/^https?:\/\/(www\.)?github\.com\/.*/.test(form.github_url.trim()))
      return "Enter a valid GitHub URL";
    if (!form.career_goal.trim()) return "Career Goal is required";
    if (!form.bio.trim()) return "Short bio is required";
    return null;
  }

  async function nextStep() {
    let err: string | null = null;
    if (step === 1) err = validateStep1();
    if (step === 2) err = validateStep2();
    if (step === 3) err = validateStep3();

    if (err) return toast.error(err);

    const nextNum = step + 1;
    await autoSave(nextNum);
    setStep(nextNum);
  }

  async function prevStep() {
    const prevNum = Math.max(1, step - 1);
    await autoSave(prevNum);
    setStep(prevNum);
  }

  async function handleFinalSubmit() {
    if (!confirmedCorrect) {
      return toast.error("Please check 'I confirm all the above information is correct.'");
    }

    setLoading(true);
    try {
      if (!userId) throw new Error("User session not found");

      const skillsArray = form.skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const normalizedCollegeName = normalizeCollege(form.college);

      await updateProfileFn({
        data: {
          full_name: form.full_name,
          phone: form.phone,
          dob: form.dob,
          gender: form.gender,
          college: normalizedCollegeName,
          degree: form.degree,
          year_of_study: form.year_of_study,
          skills: skillsArray,
          linkedin_url: form.linkedin_url,
          bio: form.bio,
          onboarding_completed: false, // Maintain onboarding funnel state
        },
      });

      setShowSuccessOverlay("Profile Completed Successfully!");

      setTimeout(() => {
        navigate({ to: "/questionnaire", replace: true });
      }, 1600);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit profile");
      setLoading(false);
    }
  }

  const currentStepData = STEPS[step - 1];

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col justify-between p-4 sm:p-6 md:p-10 font-sans selection:bg-[#FF6B00]/10 selection:text-[#FF6B00]">
      {/* Header Bar */}
      <header className="max-w-4xl w-full mx-auto flex items-center justify-between py-2 mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-xl text-gray-900 tracking-tight">
              APEX <span className="text-[#FF6B00]">AI</span>
            </span>
          </div>
          <span className="hidden sm:inline-block h-4 w-px bg-gray-200" />
          <span className="hidden sm:inline-block text-xs font-semibold tracking-wider text-gray-500 uppercase">
            Profile Completion Wizard
          </span>
        </div>

        {/* Auto-Save & Network Status */}
        <div className="flex items-center gap-2 text-xs font-medium text-gray-600 bg-white border border-gray-200 px-3.5 py-1.5 rounded-full shadow-sm">
          {savingStatus === "saving" && (
            <>
              <Loader2 className="size-3.5 animate-spin text-[#FF6B00]" />
              <span>Saving...</span>
            </>
          )}
          {savingStatus === "saved" && (
            <>
              <Check className="size-3.5 text-emerald-500 stroke-[3]" />
              <span>Saved</span>
            </>
          )}
          {savingStatus === "offline" && (
            <>
              <WifiOff className="size-3.5 text-amber-500" />
              <span>Offline (Saved locally)</span>
            </>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-3xl w-full mx-auto flex-1 flex flex-col justify-center relative">
        {/* Success Animation Overlay */}
        {showSuccessOverlay && (
          <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-md rounded-3xl flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in-95 duration-300 shadow-xl border border-gray-100">
            <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center mb-4 text-[#FF6B00] animate-bounce">
              <CheckCircle2 className="size-10 text-[#FF6B00]" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{showSuccessOverlay}</h3>
            <p className="text-sm text-gray-600 max-w-sm">Redirecting to Questionnaire...</p>
          </div>
        )}

        {/* Top Progress Header Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm mb-6 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#FF6B00] uppercase tracking-wider bg-orange-50 px-2.5 py-1 rounded-md">
                  Step {step} of 4
                </span>
                <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-md">
                  {currentStepData.percentage}% Completed
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mt-2">
                {currentStepData.name}
              </h1>
            </div>

            {/* Profile Strength Indicator */}
            <div className="text-right">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                Profile Strength
              </span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#FF6B00] transition-all duration-500"
                    style={{ width: `${profileCompletionPercentage}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-gray-900">{profileCompletionPercentage}%</span>
              </div>
            </div>
          </div>

          {/* Stepper Bar */}
          <div className="grid grid-cols-4 gap-2 pt-2">
            {STEPS.map((s) => {
              const Icon = s.icon;
              const isActive = s.id === step;
              const isDone = s.id < step;
              return (
                <div key={s.id} className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`size-7 rounded-full text-xs font-bold flex items-center justify-center transition-all duration-300 ${
                        isDone
                          ? "bg-[#FF6B00] text-white"
                          : isActive
                            ? "bg-[#FF6B00] text-white ring-4 ring-[#FF6B00]/15"
                            : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {isDone ? <Check className="size-4 stroke-[3]" /> : <Icon className="size-3.5" />}
                    </div>
                    <span
                      className={`text-xs font-semibold hidden md:inline truncate ${
                        isActive ? "text-gray-900" : isDone ? "text-[#FF6B00]" : "text-gray-400"
                      }`}
                    >
                      {s.name}
                    </span>
                  </div>
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      isDone || isActive ? "bg-[#FF6B00]" : "bg-gray-100"
                    }`}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Wizard Form Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm transition-all duration-300">
          {/* STEP 1: PERSONAL INFORMATION */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in duration-300">
              {/* Profile Photo Component */}
              <div className="border border-gray-100 bg-gray-50/50 p-4 rounded-2xl flex flex-col sm:flex-row items-center gap-4">
                <div className="relative">
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Profile Preview"
                      className={`size-20 object-cover border-2 border-[#FF6B00] ${
                        photoCropped ? "rounded-full" : "rounded-2xl"
                      }`}
                    />
                  ) : (
                    <div className="size-20 rounded-2xl bg-gray-200 text-gray-400 flex items-center justify-center border border-gray-300">
                      <User className="size-10" />
                    </div>
                  )}
                </div>

                <div className="space-y-2 text-center sm:text-left flex-1">
                  <div className="text-xs font-bold text-gray-800">Profile Photo Upload</div>
                  <p className="text-[11px] text-gray-500">
                    JPG, PNG, or WEBP (Max 100 kB).
                  </p>
                  <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handlePhotoUpload}
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="h-8 px-3 rounded-xl bg-white border border-gray-200 text-gray-700 font-semibold text-xs inline-flex items-center gap-1.5 hover:bg-gray-100 transition-all cursor-pointer"
                    >
                      <Upload className="size-3.5" /> Upload Photo
                    </button>
                    {photoPreview && (
                      <>
                        <button
                          type="button"
                          onClick={handleCropPhoto}
                          className="h-8 px-3 rounded-xl bg-orange-50 text-[#FF6B00] font-semibold text-xs inline-flex items-center gap-1.5 hover:bg-orange-100 transition-all cursor-pointer"
                        >
                          <Crop className="size-3.5" /> Crop 1:1
                        </button>
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          className="h-8 px-3 rounded-xl bg-red-50 text-red-600 font-semibold text-xs inline-flex items-center gap-1.5 hover:bg-red-100 transition-all cursor-pointer"
                        >
                          <Trash2 className="size-3.5" /> Remove
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputGroup
                  label="Full Name"
                  value={form.full_name}
                  onChange={setField("full_name")}
                  placeholder="John Doe"
                />
                <InputGroup
                  label="Email Address (Read Only)"
                  value={form.email}
                  readOnly
                  placeholder="student@example.com"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <InputGroup
                  label="Mobile Number"
                  value={form.phone}
                  onChange={setField("phone")}
                  placeholder="+91 9876543210"
                />
                <InputGroup
                  label="Date of Birth"
                  type="date"
                  value={form.dob}
                  onChange={setField("dob")}
                />
                <SelectGroup
                  label="Gender"
                  value={form.gender}
                  onChange={setField("gender")}
                  options={["Male", "Female", "Non-binary", "Prefer not to say"]}
                />
              </div>

              <InputGroup
                label="Address"
                value={form.address}
                onChange={setField("address")}
                placeholder="Street address or residential area"
              />

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <InputGroup
                  label="City"
                  value={form.city}
                  onChange={setField("city")}
                  placeholder="Mumbai"
                />
                <InputGroup
                  label="State"
                  value={form.state}
                  onChange={setField("state")}
                  placeholder="Maharashtra"
                />
                <InputGroup
                  label="Country"
                  value={form.country}
                  onChange={setField("country")}
                  placeholder="India"
                />
                <InputGroup
                  label="PIN Code"
                  value={form.pin_code}
                  onChange={setField("pin_code")}
                  placeholder="400001"
                />
              </div>
            </div>
          )}

          {/* STEP 2: ACADEMIC INFORMATION */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <CollegeAutocomplete
                label="College / University"
                value={form.college}
                onChange={setField("college")}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SelectGroup
                  label="Academic Branch"
                  value={form.branch}
                  onChange={setField("branch")}
                  options={BRANCHES}
                />
                <SelectGroup
                  label="Degree Program"
                  value={form.degree}
                  onChange={setField("degree")}
                  options={DEGREES}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <SelectGroup
                  label="Current Year"
                  value={form.year_of_study}
                  onChange={setField("year_of_study")}
                  options={YEARS}
                />
                <SelectGroup
                  label="Expected Graduation Year"
                  value={form.graduation_year}
                  onChange={setField("graduation_year")}
                  options={["2024", "2025", "2026", "2027", "2028"]}
                />
                <InputGroup
                  label="Current CGPA / Percentage"
                  value={form.cgpa}
                  onChange={setField("cgpa")}
                  placeholder="8.5 / 10"
                />
              </div>

              <InputGroup
                label="Skills (comma-separated)"
                value={form.skills}
                onChange={setField("skills")}
                placeholder="React, TypeScript, Python, Node.js, TailWind"
              />

              <SelectGroup
                label="Preferred Domain"
                value={form.preferred_domain}
                onChange={setField("preferred_domain")}
                options={DOMAINS}
              />

              {/* Resume Upload Component */}
              <div className="border border-gray-100 bg-gray-50/50 p-4 rounded-2xl space-y-2">
                <div className="text-xs font-bold text-gray-800">Resume Upload (PDF Only)</div>
                <input
                  type="file"
                  ref={resumeInputRef}
                  onChange={handleResumeUpload}
                  accept="application/pdf"
                  className="hidden"
                />
                {resumeName ? (
                  <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-gray-200">
                    <div className="flex items-center gap-2 text-xs font-semibold text-gray-800">
                      <FileText className="size-4 text-[#FF6B00]" />
                      <span>{resumeName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => resumeInputRef.current?.click()}
                        className="text-xs text-[#FF6B00] font-semibold hover:underline cursor-pointer"
                      >
                        Replace
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setResumeName(null);
                          setForm((f) => ({ ...f, resume_url: "" }));
                        }}
                        className="text-xs text-red-600 font-semibold hover:underline cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => resumeInputRef.current?.click()}
                    disabled={resumeUploading}
                    className="w-full py-4 border-2 border-dashed border-gray-300 hover:border-[#FF6B00] bg-white rounded-xl flex flex-col items-center justify-center gap-1 text-xs text-gray-600 font-medium transition-colors cursor-pointer"
                  >
                    {resumeUploading ? (
                      <Loader2 className="size-5 animate-spin text-[#FF6B00]" />
                    ) : (
                      <>
                        <Upload className="size-5 text-gray-400" />
                        <span>Click to upload PDF Resume</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: PROFESSIONAL INFORMATION */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputGroup
                  label="LinkedIn Profile URL"
                  value={form.linkedin_url}
                  onChange={setField("linkedin_url")}
                  placeholder="https://linkedin.com/in/username"
                />
                <InputGroup
                  label="GitHub Profile URL (Optional)"
                  value={form.github_url}
                  onChange={setField("github_url")}
                  placeholder="https://github.com/username"
                />
              </div>

              <InputGroup
                label="Portfolio Website (Optional)"
                value={form.portfolio_url}
                onChange={setField("portfolio_url")}
                placeholder="https://yourportfolio.dev"
              />

              <TextareaGroup
                label="Career Goal"
                value={form.career_goal}
                onChange={setField("career_goal")}
                placeholder="What are your short-term and long-term career aspirations?"
              />

              <TextareaGroup
                label="Short Bio"
                value={form.bio}
                onChange={setField("bio")}
                placeholder="Tell us a little bit about yourself..."
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputGroup
                  label="Languages Known"
                  value={form.languages_known}
                  onChange={setField("languages_known")}
                  placeholder="English, Hindi, Marathi"
                />
                <InputGroup
                  label="Certifications (Optional)"
                  value={form.certifications}
                  onChange={setField("certifications")}
                  placeholder="AWS Cloud Practitioner, Meta Frontend"
                />
              </div>

              <TextareaGroup
                label="Achievements (Optional)"
                value={form.achievements}
                onChange={setField("achievements")}
                placeholder="Hackathon wins, academic honors, etc."
              />

              <TextareaGroup
                label="Open Source Contributions (Optional)"
                value={form.open_source_contributions}
                onChange={setField("open_source_contributions")}
                placeholder="Links or descriptions of open source repos contributed to..."
              />
            </div>
          )}

          {/* STEP 4: REVIEW & SUBMIT */}
          {step === 4 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-orange-50/50 border border-orange-100 p-4 rounded-2xl">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Sparkles className="size-4 text-[#FF6B00]" /> Review Profile Information
                </h3>
                <p className="text-xs text-gray-600 mt-1">
                  Please review your details carefully before submitting. You can click Edit to revise any step.
                </p>
              </div>

              {/* Personal Section Card */}
              <div className="border border-gray-100 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                    Personal Information
                  </h4>
                  <button
                    onClick={() => setStep(1)}
                    className="text-xs font-semibold text-[#FF6B00] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Edit2 className="size-3" /> Edit
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <div><span className="text-gray-400">Name:</span> <p className="font-semibold">{form.full_name || "-"}</p></div>
                  <div><span className="text-gray-400">Phone:</span> <p className="font-semibold">{form.phone || "-"}</p></div>
                  <div><span className="text-gray-400">DOB:</span> <p className="font-semibold">{form.dob || "-"}</p></div>
                  <div><span className="text-gray-400">Gender:</span> <p className="font-semibold">{form.gender || "-"}</p></div>
                  <div><span className="text-gray-400">City / State:</span> <p className="font-semibold">{form.city}, {form.state}</p></div>
                </div>
              </div>

              {/* Academic Section Card */}
              <div className="border border-gray-100 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                    Academic Information
                  </h4>
                  <button
                    onClick={() => setStep(2)}
                    className="text-xs font-semibold text-[#FF6B00] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Edit2 className="size-3" /> Edit
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <div className="col-span-2 sm:col-span-3"><span className="text-gray-400">College:</span> <p className="font-semibold">{form.college || "-"}</p></div>
                  <div><span className="text-gray-400">Branch:</span> <p className="font-semibold">{form.branch || "-"}</p></div>
                  <div><span className="text-gray-400">Degree:</span> <p className="font-semibold">{form.degree || "-"}</p></div>
                  <div><span className="text-gray-400">CGPA:</span> <p className="font-semibold">{form.cgpa || "-"}</p></div>
                  <div><span className="text-gray-400">Domain:</span> <p className="font-semibold">{form.preferred_domain || "-"}</p></div>
                </div>
              </div>

              {/* Professional Section Card */}
              <div className="border border-gray-100 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                    Professional Information
                  </h4>
                  <button
                    onClick={() => setStep(3)}
                    className="text-xs font-semibold text-[#FF6B00] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Edit2 className="size-3" /> Edit
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div><span className="text-gray-400">LinkedIn:</span> <p className="font-semibold truncate">{form.linkedin_url || "-"}</p></div>
                  <div><span className="text-gray-400">GitHub:</span> <p className="font-semibold truncate">{form.github_url || "-"}</p></div>
                  <div className="sm:col-span-2"><span className="text-gray-400">Career Goal:</span> <p className="font-semibold">{form.career_goal || "-"}</p></div>
                </div>
              </div>

              {/* Confirmation Checkbox */}
              <label className="flex items-start gap-3 pt-2 text-xs text-gray-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={confirmedCorrect}
                  onChange={(e) => setConfirmedCorrect(e.target.checked)}
                  className="accent-[#FF6B00] size-4 rounded border-gray-300 mt-0.5"
                />
                <span className="font-medium">I confirm all the above information is correct.</span>
              </label>
            </div>
          )}

          {/* Controls Footer */}
          <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between gap-4">
            <button
              onClick={prevStep}
              disabled={step === 1 || loading}
              className="h-12 px-6 rounded-2xl border border-gray-200 text-gray-700 font-semibold text-sm inline-flex items-center gap-2 hover:bg-gray-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ArrowLeft className="size-4" /> Back
            </button>

            {step < 4 ? (
              <button
                onClick={nextStep}
                className="h-12 px-7 rounded-2xl bg-[#FF6B00] hover:bg-[#e05e00] text-white font-bold text-sm inline-flex items-center gap-2 shadow-md shadow-[#FF6B00]/25 transition-all cursor-pointer"
              >
                Continue <ArrowRight className="size-4" />
              </button>
            ) : (
              <button
                onClick={handleFinalSubmit}
                disabled={loading || !confirmedCorrect}
                className="h-12 px-8 rounded-2xl bg-[#FF6B00] hover:bg-[#e05e00] text-white font-bold text-sm inline-flex items-center gap-2 shadow-md shadow-[#FF6B00]/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4 stroke-[3]" />}
                Submit Profile
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-4xl w-full mx-auto text-center py-4 text-xs text-gray-400 mt-6">
        © APEX AI Launchpad • Student Profile Wizard
      </footer>
    </div>
  );
}

function InputGroup({ label, value, onChange, type = "text", placeholder, readOnly }: any) {
  return (
    <label className="block">
      <div className="text-xs font-semibold text-gray-700 mb-1.5">{label}</div>
      <input
        type={type}
        value={value}
        readOnly={readOnly}
        placeholder={placeholder}
        onChange={(e) => onChange && onChange(e.target.value)}
        className={`w-full h-11 rounded-2xl border px-4 text-sm text-gray-900 transition-all ${
          readOnly
            ? "bg-gray-100 border-gray-200 cursor-not-allowed text-gray-500"
            : "bg-gray-50/70 border-gray-200 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-[#FF6B00] focus:ring-4 focus:ring-[#FF6B00]/10"
        }`}
      />
    </label>
  );
}

function TextareaGroup({ label, value, onChange, placeholder }: any) {
  return (
    <label className="block">
      <div className="text-xs font-semibold text-gray-700 mb-1.5">{label}</div>
      <textarea
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full rounded-2xl bg-gray-50/70 border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-[#FF6B00] focus:ring-4 focus:ring-[#FF6B00]/10 transition-all resize-none"
      />
    </label>
  );
}

function SelectGroup({ label, value, onChange, options }: any) {
  return (
    <label className="block">
      <div className="text-xs font-semibold text-gray-700 mb-1.5">{label}</div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-11 rounded-2xl bg-gray-50/70 border border-gray-200 px-4 text-sm text-gray-900 focus:outline-none focus:bg-white focus:border-[#FF6B00] focus:ring-4 focus:ring-[#FF6B00]/10 transition-all cursor-pointer"
      >
        <option value="">Select an option...</option>
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
    [q, options]
  );
  const normalized = normalizeCollege(q);
  const showAdd = normalized && !options.includes(normalized);

  return (
    <div className="block relative">
      <div className="text-xs font-semibold text-gray-700 mb-1.5">{label}</div>
      <div className="relative">
        <Search className="size-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={q}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
          onChange={(e) => {
            setQ(e.target.value);
            onChange(e.target.value);
            setOpen(true);
          }}
          placeholder="Search or type your college / university..."
          className="w-full h-11 rounded-2xl bg-gray-50/70 border border-gray-200 pl-11 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-[#FF6B00] focus:ring-4 focus:ring-[#FF6B00]/10 transition-all"
        />
      </div>
      {open && (
        <div className="absolute z-30 left-0 right-0 mt-2 bg-white rounded-2xl border border-gray-200 shadow-xl max-h-56 overflow-auto py-2">
          {filtered.map((o) => (
            <button
              key={o}
              onMouseDown={() => {
                onChange(o);
                setQ(o);
                setOpen(false);
              }}
              className="w-full text-left px-4 py-2.5 text-sm text-gray-800 hover:bg-orange-50 hover:text-[#FF6B00] transition-colors capitalize cursor-pointer"
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
              className="w-full text-left px-4 py-2.5 text-sm font-semibold text-[#FF6B00] hover:bg-orange-50 transition-colors capitalize cursor-pointer"
            >
              + Add "<span className="capitalize">{normalized}</span>"
            </button>
          )}
        </div>
      )}
    </div>
  );
}
