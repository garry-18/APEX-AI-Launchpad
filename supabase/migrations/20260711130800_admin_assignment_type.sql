-- Migration: Admin Assignment Type and RLS Updates
-- Target File: supabase/migrations/20260711130800_admin_assignment_type.sql

-- 1. Add admin_type to public.profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS admin_type TEXT CHECK (admin_type IN ('problem_statement_admin', 'general_admin'));

-- Update existing admin profiles to have appropriate admin_type based on whether they have problem statement assignments
UPDATE public.profiles p
SET admin_type = CASE 
  WHEN EXISTS (SELECT 1 FROM public.admin_problem_statements WHERE admin_id = p.id) THEN 'problem_statement_admin'::TEXT
  ELSE 'general_admin'::TEXT
END
WHERE p.role = 'admin';

-- 2. Add indexes for performance and constraints
CREATE INDEX IF NOT EXISTS idx_admin_problem_statements_admin_id ON public.admin_problem_statements(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_problem_statements_problem_statement_id ON public.admin_problem_statements(problem_statement_id);
CREATE INDEX IF NOT EXISTS idx_interns_problem_statement_id ON public.interns(problem_statement_id);

-- 3. Seed canonical 12 problem statements (idempotently)
INSERT INTO public.problem_statements (name, title, category, description, status)
VALUES
  ('ASG Ecosystem', 'ASG Ecosystem', 'Web3 & Logistics', 'Decentralized ecosystem logic for ASG networks.', 'active'),
  ('Career Intelligence Platform', 'Career Intelligence Platform', 'EdTech & AI', 'Next-gen career recommendation matrices.', 'active'),
  ('Digital Economy', 'Digital Economy', 'FinTech', 'Frameworks for localized micro-transaction tracking.', 'active'),
  ('Energy as Distribution', 'Energy as Distribution', 'CleanTech', 'Distributed solar grids sharing protocols.', 'active'),
  ('Events Industry', 'Events Industry', 'Entertainment', 'Decentralized ticket validation systems.', 'active'),
  ('Gaming', 'Gaming', 'Metaverse', 'Integration of in-game assets securely.', 'active'),
  ('HoReCa', 'HoReCa', 'Hospitality', 'SaaS automation for small kitchens.', 'active'),
  ('Kids Sector', 'Kids Sector', 'EdTech', 'Interactive game mechanics for children.', 'active'),
  ('Mobility', 'Mobility', 'Logistics', 'EV routing protocols optimization.', 'active'),
  ('Social Work and Sustainability', 'Social Work and Sustainability', 'EcoTech', 'Carbon credits offsetting ledger.', 'active'),
  ('Sports and Fitness', 'Sports and Fitness', 'HealthTech', 'Gamified workout logging dashboards.', 'active'),
  ('Temple Economy', 'Temple Economy', 'CultureTech', 'Digital booking logs for places of worship.', 'active')
ON CONFLICT (name) DO UPDATE
SET title = EXCLUDED.name, status = 'active';

-- 4. Update is_admin_assigned_to_problem_name to check if admin is a general admin (they should NOT have wildcard access to specific statements)
CREATE OR REPLACE FUNCTION public.is_admin_assigned_to_problem_name(admin_uuid UUID, problem_name TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- If the user is a super_admin, they have full access to everything.
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = admin_uuid AND role = 'superadmin'::public.app_role) THEN
    RETURN TRUE;
  END IF;

  -- If the problem name is NULL or empty:
  -- Only allow access if the user is an admin. (This is for general modules).
  IF problem_name IS NULL OR problem_name = '' THEN
    RETURN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = admin_uuid AND role = 'admin'::public.app_role);
  END IF;

  -- If they are a general admin, they have no problem statement assignments and cannot access any specific problem statement data.
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = admin_uuid AND admin_type = 'general_admin') THEN
    RETURN FALSE;
  END IF;

  -- Otherwise, check if the admin is assigned to the problem statement with the given title or name.
  RETURN EXISTS (
    SELECT 1 FROM public.admin_problem_statements aps
    JOIN public.problem_statements ps ON aps.problem_statement_id = ps.id
    WHERE aps.admin_id = admin_uuid AND (ps.title = problem_name OR ps.name = problem_name)
  );
END; $$;

-- 5. Revise RLS Policies
-- Profiles Policies
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
CREATE POLICY "profiles_select_policy" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'superadmin'::public.app_role
    )
    OR (
      EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid()
          AND ur.role = 'admin'::public.app_role
      )
      AND (
        -- Admins can only see interns belonging to their assigned problem statements
        EXISTS (
          SELECT 1 FROM public.interns i
          JOIN public.admin_problem_statements aps ON i.problem_statement_id = aps.problem_statement_id
          WHERE aps.admin_id = auth.uid() AND i.user_id = public.profiles.id
        )
      )
    )
    OR EXISTS (
      SELECT 1 FROM public.privacy_settings ps
      WHERE ps.user_id = id
        AND (ps.public_profile = true OR ps.show_leaderboard = true)
    )
  );

-- Admin Problem Statements Policies
DROP POLICY IF EXISTS "Select admin assignments" ON public.admin_problem_statements;
CREATE POLICY "Select admin assignments" ON public.admin_problem_statements
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'superadmin'::public.app_role
    )
    OR admin_id = auth.uid()
  );

-- Problem Statements Policies
DROP POLICY IF EXISTS "Public Read access to problem statements" ON public.problem_statements;
CREATE POLICY "Public Read access to problem statements" ON public.problem_statements
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'superadmin'::public.app_role
    )
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'intern'::public.app_role
    )
    OR EXISTS (
      SELECT 1 FROM public.admin_problem_statements aps
      WHERE aps.problem_statement_id = id
        AND aps.admin_id = auth.uid()
    )
  );

-- User Roles Policies
DROP POLICY IF EXISTS "Super admins read all user roles" ON public.user_roles;
CREATE POLICY "Super admins read all user roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'superadmin'::public.app_role
    )
  );

DROP POLICY IF EXISTS "Admins read assigned interns roles" ON public.user_roles;
CREATE POLICY "Admins read assigned interns roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.interns i
      JOIN public.admin_problem_statements aps ON i.problem_statement_id = aps.problem_statement_id
      WHERE aps.admin_id = auth.uid() AND i.user_id = user_roles.user_id
    )
  );

-- Attendance Audit Logs Policies
DROP POLICY IF EXISTS "audits_select_admin" ON public.attendance_audit_logs;
CREATE POLICY "audits_select_admin" ON public.attendance_audit_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'superadmin'::public.app_role
    )
    OR EXISTS (
      SELECT 1 FROM public.attendance_records ar
      WHERE ar.id = record_id
        AND public.is_admin_assigned_to_problem_name(auth.uid(), ar.problem_statement)
    )
  );

DROP POLICY IF EXISTS "audits_insert_admin" ON public.attendance_audit_logs;
CREATE POLICY "audits_insert_admin" ON public.attendance_audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'superadmin'::public.app_role
    )
    OR EXISTS (
      SELECT 1 FROM public.attendance_records ar
      WHERE ar.id = record_id
        AND public.is_admin_assigned_to_problem_name(auth.uid(), ar.problem_statement)
    )
  );

-- Attendance Extensions Policies
DROP POLICY IF EXISTS "extensions_write_admin" ON public.attendance_extensions;
CREATE POLICY "extensions_write_admin" ON public.attendance_extensions
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'superadmin'::public.app_role
    )
    OR EXISTS (
      SELECT 1 FROM public.attendance_sessions s
      WHERE s.id = session_id
        AND public.is_admin_assigned_to_problem_name(auth.uid(), s.problem_statement)
    )
  );

-- Attendance Passwords Policies
DROP POLICY IF EXISTS "passwords_write_admin" ON public.attendance_passwords;
CREATE POLICY "passwords_write_admin" ON public.attendance_passwords
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'superadmin'::public.app_role
    )
    OR EXISTS (
      SELECT 1 FROM public.attendance_sessions s
      WHERE s.id = session_id
        AND public.is_admin_assigned_to_problem_name(auth.uid(), s.problem_statement)
    )
  );

-- AI Analysis Policies
DROP POLICY IF EXISTS "ai_select_policy" ON public.ai_analysis;
CREATE POLICY "ai_select_policy" ON public.ai_analysis
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'superadmin'::public.app_role
    )
    OR EXISTS (
      SELECT 1 FROM public.interns i
      JOIN public.admin_problem_statements aps ON i.problem_statement_id = aps.problem_statement_id
      WHERE aps.admin_id = auth.uid() AND i.user_id = ai_analysis.user_id
    )
  );
