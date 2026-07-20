import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const awardCommunityPointsForCurrentUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const {
      data: row,
      error: selErr,
      status: selStatus,
      statusText: selStatusText,
    } = await supabaseAdmin
      .from("profiles")
      .select("community_points")
      .eq("id", userId)
      .maybeSingle();

    if (selErr) {
      console.error("awardCommunityPointsForCurrentUser SELECT error:", {
        status: selStatus,
        statusText: selStatusText,
        error: {
          code: selErr.code,
          message: selErr.message,
          details: selErr.details,
          hint: selErr.hint,
        },
      });
      throw new Error(selErr.message);
    }

    const current = Number(row?.community_points ?? 0);
    const {
      error: upErr,
      status: upStatus,
      statusText: upStatusText,
    } = await supabaseAdmin
      .from("profiles")
      .update({ community_points: current + 5 } as any)
      .eq("id", userId);

    if (upErr) {
      console.error("awardCommunityPointsForCurrentUser UPDATE error:", {
        status: upStatus,
        statusText: upStatusText,
        error: {
          code: upErr.code,
          message: upErr.message,
          details: upErr.details,
          hint: upErr.hint,
        },
      });
      throw new Error(upErr.message);
    }
    return { ok: true };
  });
