import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const analyzeProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const {
      data: profile,
      error,
      status,
      statusText,
    } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();

    if (error) {
      console.error("analyzeProfile profiles query error:", {
        status,
        statusText,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        },
      });
      throw new Error(error.message);
    }
    if (!profile) throw new Error("Profile not found");

    const { callGemini } = await import("@/lib/gemini.server");

    const system = `You are an expert career and LinkedIn coach. Analyze the user's profile and return ONLY valid JSON matching this schema:
{
  "overall_score": number 0-100,
  "branding_score": number 0-100,
  "content_score": number 0-100,
  "completeness_score": number 0-100,
  "networking_score": number 0-100,
  "resume_readiness": number 0-100,
  "recruiter_readiness": number 0-100,
  "summary": string (2-3 sentences),
  "suggestions": string[] (3-6 specific, actionable improvements),
  "missing_sections": string[] (sections of the profile that are weak or missing),
  "recommendations": string[] (3-6 concrete next steps to improve visibility)
}
Score rigorously. Penalize empty/short fields. Reward specificity and clarity.`;

    const user = `Analyze this profile:
Name: ${profile.full_name ?? ""}
College: ${profile.college ?? ""}
Degree: ${profile.degree ?? ""} (${profile.year_of_study ?? ""})
Problem statement: ${profile.problem_statement ?? ""}
Skills: ${(profile.skills ?? []).join(", ")}
LinkedIn URL: ${profile.linkedin_url ?? ""}
Headline: ${profile.linkedin_headline ?? ""}
About: ${profile.linkedin_about ?? ""}
Experience: ${profile.linkedin_experience ?? ""}
Education: ${profile.linkedin_education ?? ""}`;

    const content = await callGemini(
      [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      { json: true },
    );

    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new Error("AI returned invalid JSON");
    }

    const clamp = (n: any) => Math.max(0, Math.min(100, Math.round(Number(n) || 0)));
    const row = {
      user_id: userId,
      overall_score: clamp(parsed.overall_score),
      branding_score: clamp(parsed.branding_score),
      content_score: clamp(parsed.content_score),
      completeness_score: clamp(parsed.completeness_score),
      networking_score: clamp(parsed.networking_score),
      resume_readiness: clamp(parsed.resume_readiness),
      recruiter_readiness: clamp(parsed.recruiter_readiness),
      summary: String(parsed.summary ?? ""),
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
      missing_sections: Array.isArray(parsed.missing_sections) ? parsed.missing_sections : [],
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
      generated_at: new Date().toISOString(),
    };

    // ai_analysis writes are restricted from authenticated; use service role.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const {
      error: upErr,
      status: upStatus,
      statusText: upStatusText,
    } = await supabaseAdmin.from("ai_analysis").upsert(row);
    if (upErr) {
      console.error("analyzeProfile ai_analysis upsert error:", {
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
    return row;
  });
