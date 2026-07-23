import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Mail,
  Lock,
  Loader2,
  CheckCircle2,
  Eye,
  EyeOff,
  User,
  Phone,
  ArrowLeft,
  Check,
  X,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ApexLogo } from "@/components/ApexLogo";
import { fetchUserRole, ROLE_HOME } from "@/lib/roles";

type AuthSearch = {
  mode?: "login" | "register" | "forgot";
};

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Student Authentication — APEX AI" },
      { name: "description", content: "Student login, registration and password recovery portal." },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): AuthSearch => {
    return {
      mode: (search.mode as any) || "login",
    };
  },
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/auth" });

  const [mode, setMode] = useState<"login" | "register" | "forgot">(search.mode || "login");

  // Login States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Register States
  const [fullName, setFullName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);

  // Forgot States
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSubmitted, setForgotSubmitted] = useState(false);

  // UI status
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (search.mode && search.mode !== mode) {
      setMode(search.mode);
    }
  }, [search.mode]);

  // Check if session already active
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("onboarding_completed, role")
          .eq("id", data.user.id)
          .maybeSingle();

        const userRole = profile?.role || "intern";
        const onboardingCompleted = profile?.onboarding_completed ?? false;

        if (userRole === "super_admin") {
          navigate({ to: "/super-admin/dashboard", replace: true });
        } else if (userRole === "admin") {
          navigate({ to: "/admin/dashboard", replace: true });
        } else if (userRole === "intern") {
          if (!onboardingCompleted) {
            navigate({ to: "/onboarding", replace: true });
          } else {
            navigate({ to: "/dashboard", replace: true });
          }
        } else {
          navigate({ to: "/unauthorized", replace: true });
        }
      }
    });
  }, [navigate]);

  // Password Strength Calculation
  const passwordStrength = useMemo(() => {
    if (!regPassword) return { score: 0, label: "", color: "" };
    let score = 0;
    if (regPassword.length >= 8) score++;
    if (/[A-Z]/.test(regPassword)) score++;
    if (/[0-9]/.test(regPassword)) score++;
    if (/[^A-Za-z0-9]/.test(regPassword)) score++;

    if (score <= 1) return { score: 1, label: "Weak", color: "bg-red-500" };
    if (score === 2 || score === 3) return { score: 2, label: "Medium", color: "bg-amber-500" };
    return { score: 3, label: "Strong", color: "bg-emerald-500" };
  }, [regPassword]);

  // Handle Login Submission
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return toast.error("Email address is required");
    if (!password) return toast.error("Password is required");

    setLoading(true);
    try {
      const { data: signIn, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        toast.error(error.message || "Invalid credentials. Please try again.");
        setLoading(false);
        return;
      }

      const userId = signIn.user!.id;
      const role = await fetchUserRole(userId);

      // Check onboarding_completed status from database
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed, role")
        .eq("id", userId)
        .maybeSingle();

      const userRole = profile?.role || role || "intern";
      const onboardingCompleted = profile?.onboarding_completed ?? false;

      setSuccessMessage("Login Successful! Directing you...");

      setTimeout(() => {
        if (userRole === "super_admin") {
          navigate({ to: "/super-admin/dashboard", replace: true });
        } else if (userRole === "admin") {
          navigate({ to: "/admin/dashboard", replace: true });
        } else if (userRole === "intern") {
          if (!onboardingCompleted) {
            navigate({ to: "/onboarding", replace: true });
          } else {
            navigate({ to: "/dashboard", replace: true });
          }
        } else {
          navigate({ to: "/unauthorized", replace: true });
        }
      }, 1000);
    } catch (err: any) {
      toast.error(err.message ?? "An error occurred during login");
      setLoading(false);
    }
  }

  // Handle Registration Submission
  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();

    if (!fullName.trim()) return toast.error("Full Name is required");
    if (!regEmail.trim() || !regEmail.includes("@")) return toast.error("Valid email is required");
    if (!phone.trim() || phone.length < 7) return toast.error("Valid mobile number is required");
    if (!regPassword || regPassword.length < 6) return toast.error("Password must be at least 6 characters");
    if (regPassword !== confirmPassword) return toast.error("Passwords do not match");
    if (!agreeTerms || !agreePrivacy)
      return toast.error("Please agree to the Terms & Conditions and Privacy Policy");

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: regEmail.trim(),
        password: regPassword,
        options: {
          data: {
            full_name: fullName.trim(),
            phone: phone.trim(),
          },
        },
      });

      if (error) {
        if (error.message.toLowerCase().includes("already registered")) {
          toast.error("An account with this email already exists. Please log in.");
        } else {
          toast.error(error.message);
        }
        setLoading(false);
        return;
      }

      if (data.user) {
        // Explicitly store profile with onboarding_completed = false
        await supabase
          .from("profiles")
          .upsert({
            id: data.user.id,
            full_name: fullName.trim(),
            email: regEmail.trim(),
            phone: phone.trim(),
            role: "intern",
            onboarding_completed: false,
          })
          .catch((e) => console.warn("Profile init warning:", e));
      }

      setSuccessMessage("Registration Successful! Please login to continue.");
      setTimeout(() => {
        setSuccessMessage(null);
        setMode("login");
        setEmail(regEmail.trim());
        setPassword("");
        setLoading(false);
      }, 1800);
    } catch (err: any) {
      toast.error(err.message ?? "Registration failed");
      setLoading(false);
    }
  }

  // Handle Forgot Password Submission
  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    if (!forgotEmail.trim() || !forgotEmail.includes("@"))
      return toast.error("Enter a valid email address");

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail.trim(), {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }

      setForgotSubmitted(true);
      setLoading(false);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to send reset link");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col justify-between p-4 sm:p-6 md:p-10 font-sans selection:bg-[#FF6B00]/10 selection:text-[#FF6B00]">
      {/* Header */}
      <header className="max-w-4xl w-full mx-auto flex items-center justify-between py-2 mb-4">
        <a href="/" className="flex items-center gap-2">
          <ApexLogo size="md" />
        </a>
        <a
          href="/"
          className="text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-1"
        >
          <ArrowLeft className="size-3.5" /> Back to Home
        </a>
      </header>

      {/* Main Form Container */}
      <main className="max-w-md w-full mx-auto my-auto relative">
        {/* Animated Success Overlay */}
        {successMessage && (
          <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-md rounded-3xl flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in-95 duration-300 shadow-xl border border-gray-100">
            <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center mb-4 text-[#FF6B00] animate-bounce">
              <CheckCircle2 className="size-10 text-[#FF6B00]" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">Success!</h3>
            <p className="text-sm text-gray-600 max-w-sm">{successMessage}</p>
          </div>
        )}

        {/* Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm transition-all duration-300">
          {/* LOGIN FORM */}
          {mode === "login" && (
            <div className="animate-in fade-in duration-300">
              <div className="mb-6">
                <span className="text-xs font-bold text-[#FF6B00] uppercase tracking-wider bg-orange-50 px-2.5 py-1 rounded-md">
                  Student Portal
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mt-2">
                  Student Login
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Enter your credentials to access your launchpad dashboard.
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <InputGroup
                  icon={Mail}
                  label="Email Address"
                  type="email"
                  placeholder="student@example.com"
                  value={email}
                  onChange={setEmail}
                  required
                />

                <InputGroup
                  icon={Lock}
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={setPassword}
                  required
                  rightAction={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-gray-400 hover:text-gray-600 p-1"
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  }
                />

                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="inline-flex items-center gap-2 text-gray-600 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="accent-[#FF6B00] size-4 rounded border-gray-300"
                    />
                    Remember Me
                  </label>
                  <button
                    type="button"
                    onClick={() => setMode("forgot")}
                    className="font-semibold text-[#FF6B00] hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-2xl bg-[#FF6B00] hover:bg-[#e05e00] active:bg-[#c95400] text-white font-bold text-sm inline-flex items-center justify-center gap-2 shadow-md shadow-[#FF6B00]/25 hover:shadow-lg transition-all cursor-pointer mt-2"
                >
                  {loading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    "Login"
                  )}
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-gray-100 text-center text-sm text-gray-500">
                Don't have an account?{" "}
                <button
                  onClick={() => setMode("register")}
                  className="font-bold text-[#FF6B00] hover:underline cursor-pointer"
                >
                  Register Now
                </button>
              </div>
            </div>
          )}

          {/* REGISTER FORM */}
          {mode === "register" && (
            <div className="animate-in fade-in duration-300">
              <div className="mb-6">
                <span className="text-xs font-bold text-[#FF6B00] uppercase tracking-wider bg-orange-50 px-2.5 py-1 rounded-md">
                  New Student Registration
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mt-2">
                  Create Account
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Join APEX AI Launchpad and start your internship journey.
                </p>
              </div>

              <form onSubmit={handleRegister} className="space-y-4">
                <InputGroup
                  icon={User}
                  label="Full Name"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={setFullName}
                  required
                />

                <InputGroup
                  icon={Mail}
                  label="Email Address"
                  type="email"
                  placeholder="john@example.com"
                  value={regEmail}
                  onChange={setRegEmail}
                  required
                />

                <InputGroup
                  icon={Phone}
                  label="Mobile Number"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={phone}
                  onChange={setPhone}
                  required
                />

                <InputGroup
                  icon={Lock}
                  label="Password"
                  type={showRegPassword ? "text" : "password"}
                  placeholder="At least 6 characters"
                  value={regPassword}
                  onChange={setRegPassword}
                  required
                  rightAction={
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="text-gray-400 hover:text-gray-600 p-1"
                    >
                      {showRegPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  }
                />

                {/* Password Strength Indicator */}
                {regPassword && (
                  <div className="-mt-1 space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-gray-500">
                      <span>Strength:</span>
                      <span className="capitalize">{passwordStrength.label}</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden flex gap-1">
                      <div
                        className={`h-full flex-1 transition-all ${
                          passwordStrength.score >= 1 ? passwordStrength.color : "bg-transparent"
                        }`}
                      />
                      <div
                        className={`h-full flex-1 transition-all ${
                          passwordStrength.score >= 2 ? passwordStrength.color : "bg-transparent"
                        }`}
                      />
                      <div
                        className={`h-full flex-1 transition-all ${
                          passwordStrength.score >= 3 ? passwordStrength.color : "bg-transparent"
                        }`}
                      />
                    </div>
                  </div>
                )}

                <InputGroup
                  icon={Lock}
                  label="Confirm Password"
                  type={showRegPassword ? "text" : "password"}
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  required
                />

                {/* Confirm match hint */}
                {confirmPassword && (
                  <div className="text-[11px] font-semibold -mt-2">
                    {regPassword === confirmPassword ? (
                      <span className="text-emerald-600 flex items-center gap-1">
                        <Check className="size-3" /> Passwords match
                      </span>
                    ) : (
                      <span className="text-red-500 flex items-center gap-1">
                        <X className="size-3" /> Passwords do not match
                      </span>
                    )}
                  </div>
                )}

                {/* Terms & Conditions Checkboxes */}
                <div className="space-y-2 pt-1">
                  <label className="flex items-start gap-2 text-xs text-gray-600 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="accent-[#FF6B00] size-4 rounded border-gray-300 mt-0.5"
                    />
                    <span>I agree to the <a href="#" className="text-[#FF6B00] underline font-medium">Terms & Conditions</a></span>
                  </label>

                  <label className="flex items-start gap-2 text-xs text-gray-600 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={agreePrivacy}
                      onChange={(e) => setAgreePrivacy(e.target.checked)}
                      className="accent-[#FF6B00] size-4 rounded border-gray-300 mt-0.5"
                    />
                    <span>I agree to the <a href="#" className="text-[#FF6B00] underline font-medium">Privacy Policy</a></span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-2xl bg-[#FF6B00] hover:bg-[#e05e00] active:bg-[#c95400] text-white font-bold text-sm inline-flex items-center justify-center gap-2 shadow-md shadow-[#FF6B00]/25 hover:shadow-lg transition-all cursor-pointer mt-2"
                >
                  {loading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    "Create Account"
                  )}
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-gray-100 text-center text-sm text-gray-500">
                Already registered?{" "}
                <button
                  onClick={() => setMode("login")}
                  className="font-bold text-[#FF6B00] hover:underline cursor-pointer"
                >
                  Login Here
                </button>
              </div>
            </div>
          )}

          {/* FORGOT PASSWORD FORM */}
          {mode === "forgot" && (
            <div className="animate-in fade-in duration-300">
              <div className="mb-6">
                <span className="text-xs font-bold text-[#FF6B00] uppercase tracking-wider bg-orange-50 px-2.5 py-1 rounded-md">
                  Password Recovery
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mt-2">
                  Forgot Password
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Enter your registered email to receive a password reset link.
                </p>
              </div>

              {forgotSubmitted ? (
                <div className="bg-orange-50/50 border border-orange-100 rounded-2xl p-6 text-center space-y-3">
                  <div className="size-12 rounded-full bg-orange-100 text-[#FF6B00] mx-auto flex items-center justify-center">
                    <Mail className="size-6" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900">Check Your Email</h3>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    A password reset link has been sent to your email. Please check your inbox and follow instructions.
                  </p>
                  <button
                    onClick={() => {
                      setForgotSubmitted(false);
                      setMode("login");
                    }}
                    className="mt-2 h-10 px-5 rounded-xl bg-white border border-gray-200 text-gray-800 font-semibold text-xs hover:bg-gray-50 transition-all cursor-pointer"
                  >
                    Back to Login
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgot} className="space-y-4">
                  <InputGroup
                    icon={Mail}
                    label="Email Address"
                    type="email"
                    placeholder="student@example.com"
                    value={forgotEmail}
                    onChange={setForgotEmail}
                    required
                  />

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 rounded-2xl bg-[#FF6B00] hover:bg-[#e05e00] active:bg-[#c95400] text-white font-bold text-sm inline-flex items-center justify-center gap-2 shadow-md shadow-[#FF6B00]/25 hover:shadow-lg transition-all cursor-pointer mt-2"
                  >
                    {loading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      "Send Reset Link"
                    )}
                  </button>
                </form>
              )}

              <div className="mt-6 pt-6 border-t border-gray-100 text-center text-sm text-gray-500">
                Remember your password?{" "}
                <button
                  onClick={() => setMode("login")}
                  className="font-bold text-[#FF6B00] hover:underline cursor-pointer"
                >
                  Return to Login
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-4xl w-full mx-auto text-center py-4 text-xs text-gray-400">
        © APEX AI Launchpad • Secure Authentication Portal
      </footer>
    </div>
  );
}

function InputGroup({
  icon: Icon,
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  required,
  rightAction,
}: any) {
  return (
    <label className="block">
      <div className="text-xs font-semibold text-gray-700 mb-1.5">{label}</div>
      <div className="relative">
        <Icon className="size-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className="w-full h-11 rounded-2xl bg-gray-50/70 border border-gray-200 pl-11 pr-11 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-[#FF6B00] focus:ring-4 focus:ring-[#FF6B00]/10 transition-all"
        />
        {rightAction && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
            {rightAction}
          </div>
        )}
      </div>
    </label>
  );
}

function useMemo<T>(factory: () => T, deps: any[]): T {
  const [val, setVal] = useState<T>(factory);
  useEffect(() => {
    setVal(factory());
  }, deps);
  return val;
}
