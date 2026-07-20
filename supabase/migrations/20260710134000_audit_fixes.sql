-- Migration: AI Apex Launchpad Production Audit Fixes
-- Target File: supabase/migrations/20260710134000_audit_fixes.sql

-- 1. Secure colleges write policy (restrict from public to super_admin only)
DROP POLICY IF EXISTS "Super admin full write access to colleges" ON public.colleges;
CREATE POLICY "Super admin full write access to colleges" ON public.colleges
  FOR ALL TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
  );

-- 2. Restrict profiles SELECT policy (admins and super_admins read all; interns read own / opted-in)
DROP POLICY IF EXISTS "profiles_select_authenticated" ON public.profiles;
CREATE POLICY "admin_select_all_profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin')
  );

-- 3. Adjust is_admin_assigned_to_problem_name to support General/NULL sessions for admins
CREATE OR REPLACE FUNCTION public.is_admin_assigned_to_problem_name(admin_uuid UUID, problem_name TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- If the user is a super_admin, they have full access to everything.
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = admin_uuid AND role = 'super_admin') THEN
    RETURN TRUE;
  END IF;

  -- If the problem name is NULL or empty, allow access if the user is an admin.
  IF problem_name IS NULL OR problem_name = '' THEN
    RETURN EXISTS (SELECT 1 FROM public.profiles WHERE id = admin_uuid AND role = 'admin');
  END IF;

  -- Otherwise, check if the admin is assigned to the problem statement with the given title or name.
  RETURN EXISTS (
    SELECT 1 FROM public.admin_problem_statements aps
    JOIN public.problem_statements ps ON aps.problem_statement_id = ps.id
    WHERE aps.admin_id = admin_uuid AND (ps.title = problem_name OR ps.name = problem_name)
  );
END; $$;

-- 4. Drop legacy daily check-in UNIQUE (user_id, date) constraint and add UNIQUE (user_id, session_id)
ALTER TABLE public.attendance_records DROP CONSTRAINT IF EXISTS attendance_records_user_id_date_key;
ALTER TABLE public.attendance_records ADD CONSTRAINT attendance_records_user_id_session_id_key UNIQUE (user_id, session_id);

-- 5. Add missing RLS policies for attendance helper tables
-- attendance_extensions
DROP POLICY IF EXISTS "extensions_select_authenticated" ON public.attendance_extensions;
CREATE POLICY "extensions_select_authenticated" ON public.attendance_extensions
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "extensions_write_admin" ON public.attendance_extensions;
CREATE POLICY "extensions_write_admin" ON public.attendance_extensions
  FOR ALL TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin'));

-- attendance_holidays
DROP POLICY IF EXISTS "holidays_select_authenticated" ON public.attendance_holidays;
CREATE POLICY "holidays_select_authenticated" ON public.attendance_holidays
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "holidays_write_super_admin" ON public.attendance_holidays;
CREATE POLICY "holidays_write_super_admin" ON public.attendance_holidays
  FOR ALL TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin');

-- attendance_passwords
DROP POLICY IF EXISTS "passwords_select_authenticated" ON public.attendance_passwords;
CREATE POLICY "passwords_select_authenticated" ON public.attendance_passwords
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "passwords_write_admin" ON public.attendance_passwords;
CREATE POLICY "passwords_write_admin" ON public.attendance_passwords
  FOR ALL TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin'));

-- attendance_audit_logs
DROP POLICY IF EXISTS "audits_select_admin" ON public.attendance_audit_logs;
CREATE POLICY "audits_select_admin" ON public.attendance_audit_logs
  FOR SELECT TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin'));
DROP POLICY IF EXISTS "audits_write_admin" ON public.attendance_audit_logs;
CREATE POLICY "audits_write_admin" ON public.attendance_audit_logs
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin'));

-- 6. Add direct foreign key constraints from community tables to public.profiles to enable PostgREST relation joins
ALTER TABLE public.community_posts DROP CONSTRAINT IF EXISTS community_posts_user_id_profiles_fkey;
ALTER TABLE public.community_posts ADD CONSTRAINT community_posts_user_id_profiles_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.community_comments DROP CONSTRAINT IF EXISTS community_comments_user_id_profiles_fkey;
ALTER TABLE public.community_comments ADD CONSTRAINT community_comments_user_id_profiles_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
