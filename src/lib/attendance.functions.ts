import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export const checkInToday = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const date = todayStr();
    const { data: existing } = await supabaseAdmin
      .from("attendance_records")
      .select("id, check_in")
      .eq("user_id", userId)
      .eq("date", date)
      .maybeSingle();
    if (existing?.check_in) return { ok: true };
    const { error } = await supabaseAdmin
      .from("attendance_records")
      .upsert(
        { user_id: userId, date, check_in: new Date().toISOString() },
        { onConflict: "user_id,date" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const checkOutToday = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const date = todayStr();
    const { data: row, error: selErr } = await supabaseAdmin
      .from("attendance_records")
      .select("id, check_in, check_out")
      .eq("user_id", userId)
      .eq("date", date)
      .maybeSingle();
    if (selErr) throw new Error(selErr.message);
    if (!row?.check_in) throw new Error("Not checked in");
    if (row.check_out) return { ok: true, alreadyOut: true };
    const seconds = Math.max(0, Math.floor((Date.now() - new Date(row.check_in).getTime()) / 1000));
    const { error: upErr } = await supabaseAdmin
      .from("attendance_records")
      .update({ check_out: new Date().toISOString(), seconds })
      .eq("id", row.id);
    if (upErr) throw new Error(upErr.message);

    // Award daily attendance points (server-side, service role)
    const {
      data: prof,
      error: profErr,
      status: profStat,
      statusText: profText,
    } = await supabaseAdmin
      .from("profiles")
      .select("attendance_points")
      .eq("id", userId)
      .maybeSingle();

    if (profErr) {
      console.error("attendance checkOut select profiles query error:", {
        status: profStat,
        statusText: profText,
        error: {
          code: profErr.code,
          message: profErr.message,
          details: profErr.details,
          hint: profErr.hint,
        },
      });
    }

    const current = Number(prof?.attendance_points ?? 0);
    const {
      error: ptsErr,
      status: ptsStat,
      statusText: ptsText,
    } = await supabaseAdmin
      .from("profiles")
      .update({ attendance_points: current + 10 } as any)
      .eq("id", userId);

    if (ptsErr) {
      console.error("attendance checkOut update profiles query error:", {
        status: ptsStat,
        statusText: ptsText,
        error: {
          code: ptsErr.code,
          message: ptsErr.message,
          details: ptsErr.details,
          hint: ptsErr.hint,
        },
      });
      throw new Error(ptsErr.message);
    }
    return { ok: true };
  });
