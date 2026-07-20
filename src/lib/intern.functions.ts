import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { fetchUserRole } from "@/lib/roles";

export const createInternUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    (d: {
      fullName: string;
      email: string;
      phone: string;
      gender: string;
      college: string;
      department: string;
      academicYear: string;
      problemStatementId: string | null;
      status: "Active" | "Completed" | "On Leave" | "Terminated";
      password?: string;
    }) => d,
  )
  .handler(async ({ data: input, context }) => {
    const { userId } = context;
    const callerRole = await fetchUserRole(userId, context.supabase);

    if (callerRole !== "super_admin") {
      throw new Error("Unauthorized: Only super admins can create intern accounts.");
    }

    const password = input.password || "Intern@123";
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

    // Retrieve the problem statement name if UUID is set
    let problemStatementName = "";
    if (input.problemStatementId) {
      const { data: ps } = await supabaseAdmin
        .from("problem_statements")
        .select("name")
        .eq("id", input.problemStatementId)
        .maybeSingle();
      if (ps) {
        problemStatementName = ps.name;
      }
    }

    // Update profiles details
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({
        full_name: input.fullName,
        phone: input.phone,
        gender: input.gender,
        college: input.college,
        degree: input.department,
        year_of_study: input.academicYear,
        problem_statement: problemStatementName || null,
        problem_statement_id: input.problemStatementId || null,
        status: input.status,
        role: "intern",
      } as any)
      .eq("id", newUserId);

    if (profileError) {
      // Cleanup created auth user if profile setup fails
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      throw new Error(profileError.message);
    }

    return { ok: true, userId: newUserId };
  });

export const updateInternUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    (d: {
      id: string;
      fullName: string;
      email: string;
      phone: string;
      gender: string;
      college: string;
      department: string;
      academicYear: string;
      problemStatementId: string | null;
      status: "Active" | "Completed" | "On Leave" | "Terminated";
      password?: string;
    }) => d,
  )
  .handler(async ({ data: input, context }) => {
    const { userId } = context;
    const callerRole = await fetchUserRole(userId, context.supabase);

    // Get current intern record to check their current problem statement
    const { data: currentIntern, error: fetchErr } = await supabaseAdmin
      .from("profiles")
      .select("problem_statement_id")
      .eq("id", input.id)
      .eq("role", "intern")
      .maybeSingle();

    if (fetchErr || !currentIntern) {
      throw new Error("Target intern not found.");
    }

    if (callerRole === "admin") {
      // Find the admin's active problem statement assignment
      const { data: adminAssigns } = await supabaseAdmin
        .from("admin_problem_statements" as any)
        .select("problem_statement_id")
        .eq("admin_id", userId)
        .eq("is_active", true);

      const assignedIds = (adminAssigns || []).map((a: any) => a.problem_statement_id).filter(Boolean);

      // Verify that the target intern belongs to this admin's assigned statement
      if (!currentIntern.problem_statement_id || !assignedIds.includes(currentIntern.problem_statement_id)) {
        throw new Error("Unauthorized: You do not have permission to manage this intern.");
      }

      // Admins cannot change the problem statement assignment!
      if (input.problemStatementId !== currentIntern.problem_statement_id) {
        throw new Error("Unauthorized: Admins cannot change an intern's problem statement tracks.");
      }
    } else if (callerRole !== "super_admin") {
      throw new Error("Unauthorized: Only admins and super admins can manage intern accounts.");
    }

    // Resolve problem statement name
    let problemStatementName = "";
    if (input.problemStatementId) {
      const { data: ps } = await supabaseAdmin
        .from("problem_statements")
        .select("name")
        .eq("id", input.problemStatementId)
        .maybeSingle();
      if (ps) {
        problemStatementName = ps.name;
      }
    }

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({
        full_name: input.fullName,
        phone: input.phone,
        gender: input.gender,
        college: input.college,
        degree: input.department,
        year_of_study: input.academicYear,
        problem_statement: problemStatementName || null,
        problem_statement_id: input.problemStatementId || null,
        status: input.status,
      } as any)
      .eq("id", input.id);

    if (profileError) {
      throw new Error(profileError.message);
    }

    // Update password if provided
    if (input.password && input.password !== "dummy-password") {
      const { error: passwordError } = await supabaseAdmin.auth.admin.updateUserById(input.id, {
        password: input.password,
      });
      if (passwordError) {
        throw new Error(`Failed to update password: ${passwordError.message}`);
      }
    }

    return { ok: true };
  });

export const deleteInternUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: { id: string }) => d)
  .handler(async ({ data: input, context }) => {
    const { userId } = context;
    const callerRole = await fetchUserRole(userId, context.supabase);

    if (callerRole !== "super_admin") {
      throw new Error("Unauthorized: Only super admins can delete intern accounts.");
    }

    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(input.id);
    if (authError) {
      throw new Error(authError.message);
    }

    return { ok: true };
  });
