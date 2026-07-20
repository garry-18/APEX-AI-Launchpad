import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { fetchUserRole } from "@/lib/roles";

export const createAdminUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    (d: {
      fullName: string;
      email: string;
      mobile: string;
      role: "admin" | "super_admin";
      status: "active" | "inactive";
      assignedProblems: string[];
      password?: string;
    }) => d,
  )
  .handler(async ({ data: input, context }) => {
    const { userId } = context;
    const {
      data: { user: authUserObj },
    } = await context.supabase.auth.getUser();
    const authUid = authUserObj?.id;
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, role")
      .eq("id", userId)
      .maybeSingle();

    console.log("[SERVER LOGGING] createAdminUser auth details:", {
      authUid,
      contextUserId: userId,
      fetchedProfileId: profile?.id,
      fetchedRole: profile?.role,
    });

    const callerRole = await fetchUserRole(userId, context.supabase);

    if (callerRole !== "super_admin") {
      throw new Error("Unauthorized: Only super admins can manage admin accounts.");
    }

    const password = input.password || "Admin@123";
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: input.email,
      password: password,
      email_confirm: true,
      user_metadata: { full_name: input.fullName },
    });

    if (authError) {
      throw new Error(authError.message);
    }

    const newUserId = authUser.user.id;

    // The handles_new_user trigger automatically inserts a profiles row.
    // We update it with name, mobile, role, admin_type and status.
    const {
      error: profileError,
      status: profileStatus,
      statusText: profileStatusText,
    } = await supabaseAdmin
      .from("profiles")
      .update({
        full_name: input.fullName,
        phone: input.mobile,
        role: input.role,
        status: input.status,
      } as any)
      .eq("id", newUserId);

    if (profileError) {
      console.error("createAdminUser profiles update query error:", {
        status: profileStatus,
        statusText: profileStatusText,
        error: {
          code: profileError.code,
          message: profileError.message,
          details: profileError.details,
          hint: profileError.hint,
        },
      });
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      throw new Error(profileError.message);
    }

    // Insert admin problem statement assignments
    if (input.role === "admin" && input.assignedProblems && input.assignedProblems.length > 0) {
      const mappings = input.assignedProblems.map((probId: string) => ({
        admin_id: newUserId,
        problem_statement_id: probId,
        assigned_by: userId,
        is_active: true,
      }));

      const { error: mapError } = await supabaseAdmin
        .from("admin_problem_statements" as any)
        .insert(mappings);

      if (mapError) {
        throw new Error(`Failed to save admin assignments: ${mapError.message}`);
      }
    }

    return { ok: true, userId: newUserId };
  });

export const updateAdminUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    (d: {
      id: string;
      fullName: string;
      email: string;
      mobile: string;
      role: "admin" | "super_admin";
      status: "active" | "inactive";
      assignedProblems: string[];
      password?: string;
    }) => d,
  )
  .handler(async ({ data: input, context }) => {
    const { userId } = context;
    const {
      data: { user: authUserObj },
    } = await context.supabase.auth.getUser();
    const authUid = authUserObj?.id;
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, role")
      .eq("id", userId)
      .maybeSingle();

    console.log("[SERVER LOGGING] updateAdminUser auth details:", {
      authUid,
      contextUserId: userId,
      fetchedProfileId: profile?.id,
      fetchedRole: profile?.role,
    });

    const callerRole = await fetchUserRole(userId, context.supabase);

    if (callerRole !== "super_admin") {
      throw new Error("Unauthorized: Only super admins can manage admin accounts.");
    }

    const updatePayload: any = { email: input.email };
    if (input.password && input.password !== "dummy-password") {
      updatePayload.password = input.password;
    }

    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      input.id,
      updatePayload,
    );
    if (authError) {
      throw new Error(authError.message);
    }

    const {
      error: profileError,
      status: profileStatus,
      statusText: profileStatusText,
    } = await supabaseAdmin
      .from("profiles")
      .update({
        full_name: input.fullName,
        phone: input.mobile,
        role: input.role,
        status: input.status,
        email: input.email,
      } as any)
      .eq("id", input.id);

    if (profileError) {
      console.error("updateAdminUser profiles update query error:", {
        status: profileStatus,
        statusText: profileStatusText,
        error: {
          code: profileError.code,
          message: profileError.message,
          details: profileError.details,
          hint: profileError.hint,
        },
      });
      throw new Error(profileError.message);
    }

    // Deactivate the Admin's previous active assignment
    const { error: deactivateError } = await supabaseAdmin
      .from("admin_problem_statements" as any)
      .update({ is_active: false })
      .eq("admin_id", input.id)
      .eq("is_active", true);

    if (deactivateError) {
      throw new Error(`Failed to deactivate previous assignments: ${deactivateError.message}`);
    }

    // If a new problem_statement_id exists, insert a new active row into admin_problem_statements
    if (input.role === "admin" && input.assignedProblems && input.assignedProblems.length > 0) {
      // Delete any existing mapping for this admin and problem statement to avoid primary key conflict
      const { error: clearError } = await supabaseAdmin
        .from("admin_problem_statements" as any)
        .delete()
        .eq("admin_id", input.id)
        .in("problem_statement_id", input.assignedProblems);

      if (clearError) {
        throw new Error(`Failed to clear duplicate assignment rows: ${clearError.message}`);
      }

      const mappings = input.assignedProblems.map((probId: string) => ({
        admin_id: input.id,
        problem_statement_id: probId,
        assigned_by: userId,
        is_active: true,
      }));

      const { error: mapError } = await supabaseAdmin
        .from("admin_problem_statements" as any)
        .insert(mappings);

      if (mapError) {
        throw new Error(`Failed to insert new assignments: ${mapError.message}`);
      }
    }

    return { ok: true };
  });

export const deleteAdminUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: { id: string }) => d)
  .handler(async ({ data: input, context }) => {
    const { userId } = context;
    const {
      data: { user: authUserObj },
    } = await context.supabase.auth.getUser();
    const authUid = authUserObj?.id;
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, role")
      .eq("id", userId)
      .maybeSingle();

    console.log("[SERVER LOGGING] deleteAdminUser auth details:", {
      authUid,
      contextUserId: userId,
      fetchedProfileId: profile?.id,
      fetchedRole: profile?.role,
    });

    const callerRole = await fetchUserRole(userId, context.supabase);

    if (callerRole !== "super_admin") {
      throw new Error("Unauthorized: Only super admins can manage admin accounts.");
    }

    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(input.id);
    if (authError) {
      throw new Error(authError.message);
    }

    return { ok: true };
  });
