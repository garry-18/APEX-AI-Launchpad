import {
  createFileRoute,
  Outlet,
  redirect,
  isRedirect,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { isRoleAllowed } from "@/lib/roles";

// custom route-level error component to handle and display auth layout errors cleanly without crashing MatchInnerImpl
function AuthRouteErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error("Auth layout route error occurred:", error);
  return (
    <div className="min-h-screen grid place-items-center bg-background p-6">
      <div className="w-full max-w-md card-surface p-8 text-center flex flex-col items-center">
        <h1 className="text-xl font-semibold text-foreground">Authentication Error</h1>
        <p className="text-muted-foreground text-sm mt-2 mb-6">
          {error instanceof Error
            ? error.message
            : String(error || "An unexpected routing or session error occurred.")}
        </p>
        <div className="flex gap-4 w-full">
          <button
            onClick={() => reset()}
            className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer"
          >
            Try Again
          </button>
          <a
            href="/auth"
            className="flex-1 h-10 rounded-xl bg-surface-2 border border-border text-foreground text-sm font-medium grid place-items-center hover:bg-surface-3 transition-colors"
          >
            Back to Login
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        console.log("[Route Debug] Unauthenticated user, redirecting to /auth");

        throw redirect({
          to: "/auth",
          replace: true,
        });
      }

      const {
        data: profile,
        error: profileError,
        status: profileStatus,
        statusText: profileStatusText,
      } = await supabase
        .from("profiles")
        .select("role, onboarding_completed, status")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error("beforeLoad profile query error:", {
          status: profileStatus,
          statusText: profileStatusText,
          code: profileError.code,
          message: profileError.message,
          details: profileError.details,
          hint: profileError.hint,
        });

        throw new Error(profileError.message || "Failed to load user profile");
      }

      if (!profile) {
        console.error("[Route Debug] No profile found for authenticated user:", user.id);

        throw redirect({
          to: "/unauthorized",
          replace: true,
        });
      }

      const role = profile.role;
      const accountStatus = profile.status ?? "active";
      const onboardingCompleted = profile.onboarding_completed ?? false;

      console.log("[Route Guard] Authorization evaluation:", {
        userId: user.id,
        pathname: location.pathname,
        role,
        accountStatus,
        onboardingCompleted,
      });

      if (accountStatus === "inactive") {
        throw redirect({
          to: "/unauthorized",
          replace: true,
        });
      }

      if (role !== "intern" && role !== "admin" && role !== "super_admin") {
        console.error("[Route Debug] Invalid role:", role);

        throw redirect({
          to: "/unauthorized",
          replace: true,
        });
      }

      /*
       * Correct users who arrive on the wrong dashboard.
       * This must run before isRoleAllowed().
       */

      if (role === "super_admin") {
        if (
          location.pathname === "/" ||
          location.pathname === "/dashboard" ||
          location.pathname.startsWith("/onboarding")
        ) {
          console.log("[Route Debug] Redirecting super_admin to /super-admin/dashboard");

          throw redirect({
            to: "/super-admin/dashboard",
            replace: true,
          });
        }
      }

      if (role === "admin") {
        if (
          location.pathname === "/" ||
          location.pathname === "/dashboard" ||
          location.pathname.startsWith("/onboarding")
        ) {
          console.log("[Route Debug] Redirecting admin to /admin/dashboard");

          throw redirect({
            to: "/admin/dashboard",
            replace: true,
          });
        }
      }

      if (role === "intern") {
        if (location.pathname === "/" && onboardingCompleted) {
          throw redirect({
            to: "/dashboard",
            replace: true,
          });
        }

        if (!onboardingCompleted && !location.pathname.startsWith("/onboarding")) {
          console.log("[Route Debug] Redirecting intern to /onboarding");

          throw redirect({
            to: "/onboarding",
            replace: true,
          });
        }

        if (onboardingCompleted && location.pathname.startsWith("/onboarding")) {
          throw redirect({
            to: "/dashboard",
            replace: true,
          });
        }
      }

      const allowed = isRoleAllowed(role, location.pathname);

      console.log("[Route Debug] Path authorization:", {
        role,
        pathname: location.pathname,
        allowed,
      });

      if (!allowed) {
        throw redirect({
          to: "/unauthorized",
          replace: true,
        });
      }

      return {
        user,
        role,
        profile,
      };
    } catch (error) {
      if (isRedirect(error)) {
        throw error;
      }

      console.error("[Route Debug] Catastrophic error in beforeLoad:", error);

      throw new Error(
        error instanceof Error ? error.message : "Authentication failed. Please reload.",
      );
    }
  },
  component: () => <Outlet />,
  errorComponent: AuthRouteErrorComponent,
});
