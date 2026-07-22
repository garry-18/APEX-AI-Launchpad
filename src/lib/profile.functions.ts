import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const updateOwnProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    (d: {
      full_name?: string;
      phone?: string;
      dob?: string;
      gender?: string;
      college?: string;
      degree?: string;
      year_of_study?: string;
      skills?: string[];
      linkedin_url?: string;
      bio?: string;
      onboarding_completed?: boolean;
    }) => d
  )
  .handler(async ({ data: input, context }) => {
    const { userId } = context;

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) {
      throw new Error(error.message);
    }

    return { ok: true };
  });
