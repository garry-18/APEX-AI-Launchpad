
ALTER VIEW public.ai_analysis_public SET (security_invoker = true);
ALTER VIEW public.profiles_public SET (security_invoker = true);
ALTER VIEW public.public_leaderboard SET (security_invoker = true);
ALTER VIEW public.public_profiles SET (security_invoker = true);
ALTER VIEW public.public_ai_analysis SET (security_invoker = true);

REVOKE ALL ON FUNCTION public.award_community_points() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.award_community_points(integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.award_attendance_points() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.award_attendance_points(integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.add_college(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.award_community_points() TO service_role;
GRANT EXECUTE ON FUNCTION public.award_community_points(integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.award_attendance_points() TO service_role;
GRANT EXECUTE ON FUNCTION public.award_attendance_points(integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.add_college(text) TO service_role;

DROP POLICY IF EXISTS attendance_own ON public.attendance_records;
CREATE POLICY attendance_select_own ON public.attendance_records
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
REVOKE INSERT, UPDATE, DELETE ON public.attendance_records FROM authenticated, anon;
GRANT SELECT ON public.attendance_records TO authenticated;
GRANT ALL ON public.attendance_records TO service_role;

REVOKE UPDATE ON public.profiles FROM authenticated, anon;
GRANT UPDATE (
  email, full_name, avatar_url, banner_url, bio, phone, dob, gender,
  college, degree, year_of_study, problem_statement, skills,
  linkedin_url, linkedin_headline, linkedin_about,
  linkedin_experience, linkedin_education, onboarding_completed
) ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

REVOKE INSERT, UPDATE, DELETE ON public.ai_analysis FROM authenticated, anon;
GRANT SELECT ON public.ai_analysis TO authenticated;
GRANT ALL ON public.ai_analysis TO service_role;
