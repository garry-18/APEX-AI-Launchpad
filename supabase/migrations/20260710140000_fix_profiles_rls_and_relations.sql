-- Migration: Fix profiles RLS recursion and user_roles relation joins
-- Target File: supabase/migrations/20260710140000_fix_profiles_rls_and_relations.sql

-- 1. Re-link public.user_roles to public.profiles instead of auth.users
-- This allows PostgREST to automatically recognize relationship joins between profiles and user_roles.
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_profiles_fkey;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_profiles_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 2. Adjust is_admin_assigned_to_problem_name to check roles via user_roles instead of profiles
CREATE OR REPLACE FUNCTION public.is_admin_assigned_to_problem_name(admin_uuid UUID, problem_name TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- If the user is a super_admin, they have full access to everything.
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = admin_uuid AND role = 'superadmin'::public.app_role) THEN
    RETURN TRUE;
  END IF;

  -- If the problem name is NULL or empty, allow access if the user is an admin.
  IF problem_name IS NULL OR problem_name = '' THEN
    RETURN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = admin_uuid AND role = 'admin'::public.app_role);
  END IF;

  -- Otherwise, check if the admin is assigned to the problem statement with the given title or name.
  RETURN EXISTS (
    SELECT 1 FROM public.admin_problem_statements aps
    JOIN public.problem_statements ps ON aps.problem_statement_id = ps.id
    WHERE aps.admin_id = admin_uuid AND (ps.title = problem_name OR ps.name = problem_name)
  );
END; $$;

-- 3. Rewrite public.profiles RLS policies using user_roles to prevent infinite recursion
DROP POLICY IF EXISTS "profiles_select_authenticated" ON public.profiles;
DROP POLICY IF EXISTS "admin_select_all_profiles" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "super_admin_all_profiles" ON public.profiles;

-- SELECT policy: Admins and super_admins can read all profiles; interns can read their own or any opted-in profiles.
CREATE POLICY "profiles_select_policy" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin'::public.app_role, 'superadmin'::public.app_role)
    )
    OR EXISTS (
      SELECT 1 FROM public.privacy_settings ps
      WHERE ps.user_id = id
        AND (ps.public_profile = true OR ps.show_leaderboard = true)
    )
  );

-- UPDATE policy: Users can update their own profile, or super_admins can update any profile.
CREATE POLICY "profiles_update_policy" ON public.profiles
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'superadmin'::public.app_role
    )
  )
  WITH CHECK (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'superadmin'::public.app_role
    )
  );

-- INSERT policy: Users can insert their own profile, or super_admins can insert any profile.
CREATE POLICY "profiles_insert_policy" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'superadmin'::public.app_role
    )
  );

-- ALL policy for super admins:
CREATE POLICY "profiles_super_admin_policy" ON public.profiles
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'superadmin'::public.app_role
    )
  );

-- 4. Rewrite other tables' policies that queried profiles.role to use user_roles

-- Colleges table
DROP POLICY IF EXISTS "Super admin full write access to colleges" ON public.colleges;
CREATE POLICY "Super admin full write access to colleges" ON public.colleges
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'superadmin'::public.app_role
    )
  );

-- Problem statements table
DROP POLICY IF EXISTS "Super admin full write access to problem statements" ON public.problem_statements;
CREATE POLICY "Super admin full write access to problem statements" ON public.problem_statements
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'superadmin'::public.app_role
    )
  );

-- Admin problem statements table
DROP POLICY IF EXISTS "Super admin write admin assignments" ON public.admin_problem_statements;
CREATE POLICY "Super admin write admin assignments" ON public.admin_problem_statements
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'superadmin'::public.app_role
    )
  );

-- Interns table
DROP POLICY IF EXISTS "Super admin full access to interns" ON public.interns;
CREATE POLICY "Super admin full access to interns" ON public.interns
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'superadmin'::public.app_role
    )
  );

-- Attendance sessions table
DROP POLICY IF EXISTS "Super admin full access to sessions" ON public.attendance_sessions;
CREATE POLICY "Super admin full access to sessions" ON public.attendance_sessions
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'superadmin'::public.app_role
    )
  );

-- Attendance records table
DROP POLICY IF EXISTS "Super admin full access to records" ON public.attendance_records;
CREATE POLICY "Super admin full access to records" ON public.attendance_records
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'superadmin'::public.app_role
    )
  );

-- Diary entries table
DROP POLICY IF EXISTS "Admin read assigned interns diary entries" ON public.diary_entries;
CREATE POLICY "Admin read assigned interns diary entries" ON public.diary_entries
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.interns i
      JOIN public.admin_problem_statements aps ON i.problem_statement_id = aps.problem_statement_id
      WHERE aps.admin_id = auth.uid() AND i.user_id = diary_entries.user_id
    )
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'superadmin'::public.app_role
    )
  );

-- Todos table
DROP POLICY IF EXISTS "Admin read assigned interns todos" ON public.todos;
CREATE POLICY "Admin read assigned interns todos" ON public.todos
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.interns i
      JOIN public.admin_problem_statements aps ON i.problem_statement_id = aps.problem_statement_id
      WHERE aps.admin_id = auth.uid() AND i.user_id = todos.user_id
    )
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'superadmin'::public.app_role
    )
  );

-- Attendance extensions table
DROP POLICY IF EXISTS "extensions_write_admin" ON public.attendance_extensions;
CREATE POLICY "extensions_write_admin" ON public.attendance_extensions
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin'::public.app_role, 'superadmin'::public.app_role)
    )
  );

-- Attendance holidays table
DROP POLICY IF EXISTS "holidays_write_super_admin" ON public.attendance_holidays;
CREATE POLICY "holidays_write_super_admin" ON public.attendance_holidays
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'superadmin'::public.app_role
    )
  );

-- Attendance passwords table
DROP POLICY IF EXISTS "passwords_write_admin" ON public.attendance_passwords;
CREATE POLICY "passwords_write_admin" ON public.attendance_passwords
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin'::public.app_role, 'superadmin'::public.app_role)
    )
  );

-- Attendance audit logs table
DROP POLICY IF EXISTS "audits_select_admin" ON public.attendance_audit_logs;
CREATE POLICY "audits_select_admin" ON public.attendance_audit_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin'::public.app_role, 'superadmin'::public.app_role)
    )
  );

DROP POLICY IF EXISTS "audits_write_admin" ON public.attendance_audit_logs;
CREATE POLICY "audits_write_admin" ON public.attendance_audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin'::public.app_role, 'superadmin'::public.app_role)
    )
  );
