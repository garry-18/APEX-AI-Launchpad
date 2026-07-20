import { supabase } from "@/integrations/supabase/client";

export const ROLES = {
  INTERN: "intern",
  ADMIN: "admin",
  SUPERADMIN: "super_admin",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_HOME: Record<Role, string> = {
  intern: "/dashboard",
  admin: "/admin/dashboard",
  super_admin: "/super-admin/dashboard",
};

export async function fetchUserRole(userId: string, supabaseClient?: any): Promise<Role | null> {
  try {
    console.log("[fetchUserRole] Fetching role for user id:", userId);

    const client = supabaseClient || supabase;
    // Single source of truth: public.profiles.role
    const {
      data: profile,
      error,
      status,
      statusText,
    } = await client.from("profiles").select("role").eq("id", userId).maybeSingle();

    if (error) {
      console.error("[fetchUserRole] Query error:", {
        status,
        statusText,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        },
      });
      return null;
    }

    const dbRole = profile?.role;
    console.log("[fetchUserRole] Raw role from profiles:", dbRole);

    if (dbRole === "super_admin") {
      console.log("[fetchUserRole] Resolved role: super_admin");
      return ROLES.SUPERADMIN;
    }

    if (dbRole === "admin") {
      console.log("[fetchUserRole] Resolved role: admin");
      return ROLES.ADMIN;
    }

    if (dbRole === "intern") {
      console.log("[fetchUserRole] Resolved role: intern");
      return ROLES.INTERN;
    }

    // Do NOT silently default to intern — return null for missing/invalid role
    console.warn("[fetchUserRole] Missing or unrecognized role:", dbRole, "returning null");
    return null;
  } catch (err) {
    console.error("[fetchUserRole] Catastrophic exception:", err);
    return null;
  }
}

export function isRoleAllowed(role: Role | null, pathname: string): boolean {
  if (!role) return false;

  // Shared paths accessible by all authenticated roles
  const isSharedPath =
    pathname.startsWith("/profile") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/pending-work") ||
    pathname.startsWith("/feedback-suggestions") ||
    pathname.startsWith("/leaderboard") ||
    pathname.startsWith("/u/");

  if (isSharedPath) return true;

  if (role === ROLES.ADMIN) {
    // Admin: own dashboard routes only (not intern-only or super-admin routes)
    return pathname.startsWith("/admin");
  }

  if (role === ROLES.SUPERADMIN) {
    // Super admin: own dashboard routes only (not intern-only or admin routes)
    return pathname.startsWith("/super-admin");
  }

  if (role === ROLES.INTERN) {
    // Intern: any non-admin, non-super-admin path (including /dashboard, /, /todo, etc.)
    return !pathname.startsWith("/admin") && !pathname.startsWith("/super-admin");
  }

  return false;
}
