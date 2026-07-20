
DROP POLICY IF EXISTS profiles_select_authenticated ON public.profiles;
DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (
  full_name, email, phone, dob, gender, college, degree, year_of_study,
  problem_statement, skills, linkedin_url, linkedin_headline, linkedin_about,
  linkedin_experience, linkedin_education, avatar_url, banner_url, bio,
  onboarding_completed
) ON public.profiles TO authenticated;

DROP POLICY IF EXISTS ai_select_authenticated ON public.ai_analysis;
DROP POLICY IF EXISTS ai_modify_own ON public.ai_analysis;
DROP POLICY IF EXISTS ai_select_own ON public.ai_analysis;
CREATE POLICY ai_select_own ON public.ai_analysis
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
REVOKE INSERT, UPDATE, DELETE ON public.ai_analysis FROM authenticated;

DROP POLICY IF EXISTS privacy_select_authenticated ON public.privacy_settings;
DROP POLICY IF EXISTS privacy_select_own ON public.privacy_settings;
CREATE POLICY privacy_select_own ON public.privacy_settings
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS colleges_insert_auth ON public.colleges;
DROP POLICY IF EXISTS colleges_insert_validated ON public.colleges;
CREATE POLICY colleges_insert_validated ON public.colleges
  FOR INSERT TO authenticated
  WITH CHECK (
    name IS NOT NULL
    AND length(name) BETWEEN 2 AND 100
    AND name = lower(name)
    AND name ~ '^[a-z0-9 .,''&()/-]+$'
  );

CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = false) AS
SELECT
  p.id, p.full_name, p.avatar_url, p.banner_url, p.college, p.degree,
  p.year_of_study, p.problem_statement, p.skills, p.linkedin_headline,
  p.linkedin_about, p.community_points, p.attendance_points,
  CASE WHEN COALESCE(s.show_linkedin, true) THEN p.linkedin_url ELSE NULL END AS linkedin_url,
  CASE WHEN COALESCE(s.show_contact, false) THEN p.email        ELSE NULL END AS email,
  COALESCE(s.public_profile, true)   AS public_profile,
  COALESCE(s.show_ai_analysis, true) AS show_ai_analysis,
  COALESCE(s.show_leaderboard, true) AS show_leaderboard
FROM public.profiles p
LEFT JOIN public.privacy_settings s ON s.user_id = p.id
WHERE COALESCE(s.public_profile, true) = true OR p.id = auth.uid();
GRANT SELECT ON public.public_profiles TO authenticated;

CREATE OR REPLACE VIEW public.public_ai_analysis
WITH (security_invoker = false) AS
SELECT a.*
FROM public.ai_analysis a
LEFT JOIN public.privacy_settings s ON s.user_id = a.user_id
WHERE a.user_id = auth.uid()
   OR (COALESCE(s.public_profile, true) AND COALESCE(s.show_ai_analysis, true));
GRANT SELECT ON public.public_ai_analysis TO authenticated;

CREATE OR REPLACE VIEW public.public_leaderboard
WITH (security_invoker = false) AS
SELECT
  p.id, p.full_name, p.avatar_url, p.college, p.problem_statement,
  p.community_points, p.attendance_points,
  COALESCE(a.overall_score, 0)  AS overall_score,
  COALESCE(a.branding_score, 0) AS branding_score
FROM public.profiles p
LEFT JOIN public.privacy_settings s ON s.user_id = p.id
LEFT JOIN public.ai_analysis a ON a.user_id = p.id
WHERE COALESCE(s.show_leaderboard, true) = true;
GRANT SELECT ON public.public_leaderboard TO authenticated;

CREATE OR REPLACE FUNCTION public.award_community_points()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  UPDATE public.profiles SET community_points = COALESCE(community_points, 0) + 5 WHERE id = auth.uid();
END; $$;

CREATE OR REPLACE FUNCTION public.award_attendance_points()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  UPDATE public.profiles SET attendance_points = COALESCE(attendance_points, 0) + 10 WHERE id = auth.uid();
END; $$;

REVOKE ALL ON FUNCTION public.award_community_points() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.award_attendance_points() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.award_community_points()  TO authenticated;
GRANT EXECUTE ON FUNCTION public.award_attendance_points() TO authenticated;
