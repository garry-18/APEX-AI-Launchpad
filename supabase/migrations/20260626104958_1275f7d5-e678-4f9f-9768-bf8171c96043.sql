
-- Public read access for opted-in profiles (required because views now run as the invoker).
CREATE POLICY profiles_public_read ON public.profiles
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.privacy_settings s
      WHERE s.user_id = profiles.id
        AND (COALESCE(s.public_profile, true) OR COALESCE(s.show_leaderboard, true))
    )
    OR NOT EXISTS (SELECT 1 FROM public.privacy_settings s WHERE s.user_id = profiles.id)
  );

-- Public read access for opted-in AI analysis (for public_ai_analysis / ai_analysis_public views).
CREATE POLICY ai_analysis_public_read ON public.ai_analysis
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.privacy_settings s
      WHERE s.user_id = ai_analysis.user_id
        AND COALESCE(s.show_ai_analysis, true)
    )
    OR NOT EXISTS (SELECT 1 FROM public.privacy_settings s WHERE s.user_id = ai_analysis.user_id)
  );

-- Allow authenticated users to read privacy_settings rows referenced by the public views (needed for the EXISTS join + view JOIN).
DROP POLICY IF EXISTS privacy_public_read ON public.privacy_settings;
CREATE POLICY privacy_public_read ON public.privacy_settings
  FOR SELECT TO authenticated USING (true);
