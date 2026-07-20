import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { fetchUserRole } from "@/lib/roles";

export const adjustInternPoints = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    (d: {
      internId: string;
      pointsType: "community" | "attendance";
      amount: number;
      reason: string;
    }) => d,
  )
  .handler(async ({ data: input, context }) => {
    const { userId } = context;
    const callerRole = await fetchUserRole(userId, context.supabase);

    // 1. Validate caller role and unassigned admin blocks
    if (callerRole === "intern") {
      throw new Error("Unauthorized: Interns cannot adjust points.");
    }

    // 2. Fetch target intern's profile
    const { data: intern, error: fetchErr } = await supabaseAdmin
      .from("profiles")
      .select("id, problem_statement_id, community_points, attendance_points")
      .eq("id", input.internId)
      .eq("role", "intern")
      .maybeSingle();

    if (fetchErr || !intern) {
      throw new Error("Target intern not found.");
    }

    if (callerRole === "admin") {
      // Find admin's active problem statement tracks
      const { data: adminAssigns } = await supabaseAdmin
        .from("admin_problem_statements" as any)
        .select("problem_statement_id")
        .eq("admin_id", userId)
        .eq("is_active", true);

      const assignedIds = (adminAssigns || []).map((a: any) => a.problem_statement_id).filter(Boolean);

      // Verify that the target intern belongs to this admin's assigned statement
      if (!intern.problem_statement_id || !assignedIds.includes(intern.problem_statement_id)) {
        throw new Error("Unauthorized: You can only adjust points for interns on your assigned track.");
      }
    } else if (callerRole !== "super_admin") {
      throw new Error("Unauthorized: Access denied.");
    }

    // 3. Perform points adjustment in profiles
    const pointsColumn = input.pointsType === "community" ? "community_points" : "attendance_points";
    const currentPoints = Number((intern as any)[pointsColumn] ?? 0);
    const newPoints = currentPoints + input.amount;

    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({ [pointsColumn]: newPoints } as any)
      .eq("id", input.internId);

    if (updateError) {
      throw new Error(`Failed to adjust points: ${updateError.message}`);
    }

    // 4. Log the audit details in points_audit_logs
    const { error: logError } = await supabaseAdmin
      .from("points_audit_logs" as any)
      .insert({
        intern_id: input.internId,
        points_type: input.pointsType,
        amount: input.amount,
        reason: input.reason.trim(),
        adjusted_by: userId,
      });

    if (logError) {
      console.error("[AUDIT LOG ERROR] Failed to record points audit entry:", logError);
    }

    return { ok: true, newPoints };
  });
