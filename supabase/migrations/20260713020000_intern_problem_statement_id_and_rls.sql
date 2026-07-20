-- Migration: Add problem_statement_id to profiles and secure RLS policies for interns
-- Target File: supabase/migrations/20260713020000_intern_problem_statement_id_and_rls.sql

-- 1. Add problem_statement_id to profiles referencing problem_statements
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS problem_statement_id UUID REFERENCES public.problem_statements(id) ON DELETE SET NULL;

-- 2. Backfill existing profile assignments where problem_statement text is set
UPDATE public.profiles p
SET problem_statement_id = ps.id
FROM public.problem_statements ps
WHERE (p.problem_statement = ps.name)
  AND p.problem_statement_id IS NULL;

-- 3. Drop sync_intern_profile trigger and function as public.interns table does not exist
DROP TRIGGER IF EXISTS sync_intern_profile_trigger ON public.profiles;
DROP FUNCTION IF EXISTS public.sync_intern_profile();

-- 4. Rewrite profiles policies checking role directly from profiles to bypass stale user_roles checks
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
CREATE POLICY "profiles_select_policy" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    -- Own profile
    auth.uid() = id
    -- Super Admin
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
    -- Admin with active assignment matching the profile's problem_statement_id
    OR (
      (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
      AND EXISTS (
        SELECT 1 FROM public.admin_problem_statements aps
        WHERE aps.admin_id = auth.uid()
          AND aps.is_active = true
          AND aps.problem_statement_id = public.profiles.problem_statement_id
      )
    )
    -- Publicly visible profile
    OR EXISTS (
      SELECT 1 FROM public.privacy_settings ps
      WHERE ps.user_id = id
        AND (ps.public_profile = true OR ps.show_leaderboard = true)
    )
  );

DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
CREATE POLICY "profiles_update_policy" ON public.profiles
  FOR UPDATE TO authenticated
  USING (
    -- Own profile
    auth.uid() = id
    -- Super Admin
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
    -- Admin with active assignment matching the profile's problem_statement_id
    OR (
      (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
      AND EXISTS (
        SELECT 1 FROM public.admin_problem_statements aps
        WHERE aps.admin_id = auth.uid()
          AND aps.is_active = true
          AND aps.problem_statement_id = public.profiles.problem_statement_id
      )
    )
  )
  WITH CHECK (
    -- Super Admin check
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
    -- Own profile check
    OR auth.uid() = id
    -- Admin check: matching track, AND cannot change problem_statement_id
    OR (
      (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
      AND EXISTS (
        SELECT 1 FROM public.admin_problem_statements aps
        WHERE aps.admin_id = auth.uid()
          AND aps.is_active = true
          AND aps.problem_statement_id = public.profiles.problem_statement_id
      )
      AND problem_statement_id = (
        SELECT problem_statement_id FROM public.admin_problem_statements aps
        WHERE aps.admin_id = auth.uid() AND aps.is_active = true LIMIT 1
      )
    )
  );

DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
CREATE POLICY "profiles_insert_policy" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = id
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
  );

-- 5. Rewrite public.attendance_sessions policies
DROP POLICY IF EXISTS "Super admin full access to sessions" ON public.attendance_sessions;
DROP POLICY IF EXISTS "Admin access to sessions of assigned tracks" ON public.attendance_sessions;
DROP POLICY IF EXISTS "Intern select sessions" ON public.attendance_sessions;
DROP POLICY IF EXISTS "sessions_access_policy" ON public.attendance_sessions;
DROP POLICY IF EXISTS "sessions_intern_select" ON public.attendance_sessions;

CREATE POLICY "sessions_access_policy" ON public.attendance_sessions
  FOR ALL TO authenticated
  USING (
    -- Super Admin
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
    -- Admin with matching assignment
    OR EXISTS (
      SELECT 1 FROM public.admin_problem_statements aps
      JOIN public.problem_statements ps ON aps.problem_statement_id = ps.id
      WHERE aps.admin_id = auth.uid()
        AND aps.is_active = true
        AND (ps.name = problem_statement OR problem_statement IS NULL)
    )
  )
  WITH CHECK (
    -- Super Admin
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
    -- Admin with matching assignment
    OR EXISTS (
      SELECT 1 FROM public.admin_problem_statements aps
      JOIN public.problem_statements ps ON aps.problem_statement_id = ps.id
      WHERE aps.admin_id = auth.uid()
        AND aps.is_active = true
        AND (ps.name = problem_statement OR problem_statement IS NULL)
    )
  );

CREATE POLICY "sessions_intern_select" ON public.attendance_sessions
  FOR SELECT TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'intern'
  );

-- 6. Rewrite public.attendance_records policies
DROP POLICY IF EXISTS "Super admin full access to records" ON public.attendance_records;
DROP POLICY IF EXISTS "Admin access to records of assigned tracks" ON public.attendance_records;
DROP POLICY IF EXISTS "Intern select own records" ON public.attendance_records;
DROP POLICY IF EXISTS "Intern insert own records" ON public.attendance_records;
DROP POLICY IF EXISTS "records_access_policy" ON public.attendance_records;

CREATE POLICY "records_access_policy" ON public.attendance_records
  FOR ALL TO authenticated
  USING (
    -- Super Admin
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
    -- Admin with matching assignment (access restricted to interns of their assigned track)
    OR (
      (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
      AND EXISTS (
        SELECT 1 FROM public.admin_problem_statements aps
        JOIN public.profiles ip ON ip.id = attendance_records.user_id AND ip.role = 'intern'
        WHERE aps.admin_id = auth.uid()
          AND aps.is_active = true
          AND aps.problem_statement_id = ip.problem_statement_id
      )
    )
    -- Intern's own record
    OR user_id = auth.uid()
  )
  WITH CHECK (
    -- Super Admin
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
    -- Admin with matching assignment (access restricted to interns of their assigned track)
    OR (
      (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
      AND EXISTS (
        SELECT 1 FROM public.admin_problem_statements aps
        JOIN public.profiles ip ON ip.id = attendance_records.user_id AND ip.role = 'intern'
        WHERE aps.admin_id = auth.uid()
          AND aps.is_active = true
          AND aps.problem_statement_id = ip.problem_statement_id
      )
    )
    -- Intern's own record
    OR user_id = auth.uid()
  );
