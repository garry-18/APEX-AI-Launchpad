-- 1. Add columns to public.admin_problem_statements
ALTER TABLE public.admin_problem_statements ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true NOT NULL;
ALTER TABLE public.admin_problem_statements ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;

-- 2. Ensure only one active assignment per Admin at any time
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_admin_assignment ON public.admin_problem_statements (admin_id) WHERE (is_active = true);

-- 3. Recreate the function to check admin problem statement assignment
CREATE OR REPLACE FUNCTION public.is_admin_assigned_to_problem_name(admin_uuid UUID, problem_name TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- If the user is a super_admin, they have full access to everything.
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = admin_uuid AND role = 'superadmin'::public.app_role) THEN
    RETURN TRUE;
  END IF;

  -- If the user is not an admin, return false.
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = admin_uuid AND role = 'admin'::public.app_role) THEN
    RETURN FALSE;
  END IF;

  -- If the admin is not active, return false.
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = admin_uuid AND status = 'inactive') THEN
    RETURN FALSE;
  END IF;

  -- If the problem name is NULL or empty:
  -- Only allow access if the admin has at least one active assignment.
  -- This ensures unassigned admins see NO problem-specific or general intern data.
  IF problem_name IS NULL OR problem_name = '' THEN
    RETURN EXISTS (
      SELECT 1 FROM public.admin_problem_statements aps
      WHERE aps.admin_id = admin_uuid AND aps.is_active = true
    );
  END IF;

  -- Otherwise, check if the admin is assigned to the problem statement with the given name.
  RETURN EXISTS (
    SELECT 1 FROM public.admin_problem_statements aps
    JOIN public.problem_statements ps ON aps.problem_statement_id = ps.id
    WHERE aps.admin_id = admin_uuid AND aps.is_active = true AND ps.name = problem_name
  );
END;
$$;

-- 4. Recreate RLS Policies with active assignment scoping

-- public.profiles
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
        EXISTS (
          SELECT 1 FROM public.interns i
          JOIN public.admin_problem_statements aps ON i.problem_statement_id = aps.problem_statement_id
          WHERE aps.admin_id = auth.uid() AND aps.is_active = true AND i.user_id = public.profiles.id
        )
      )
    )
    OR EXISTS (
      SELECT 1 FROM public.privacy_settings ps
      WHERE ps.user_id = id
        AND (ps.public_profile = true OR ps.show_leaderboard = true)
    )
  );

-- public.interns
DROP POLICY IF EXISTS "Admin access to interns of assigned tracks" ON public.interns;
CREATE POLICY "Admin access to interns of assigned tracks" ON public.interns
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_problem_statements aps
      WHERE aps.admin_id = auth.uid() AND aps.problem_statement_id = interns.problem_statement_id AND aps.is_active = true
    )
  );

-- public.diary_entries
DROP POLICY IF EXISTS "Admin read assigned interns diary entries" ON public.diary_entries;
CREATE POLICY "Admin read assigned interns diary entries" ON public.diary_entries
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.interns i
      JOIN public.admin_problem_statements aps ON i.problem_statement_id = aps.problem_statement_id
      WHERE aps.admin_id = auth.uid() AND aps.is_active = true AND i.user_id = diary_entries.user_id
    )
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'superadmin'::public.app_role
    )
  );

-- public.todos
DROP POLICY IF EXISTS "Admin read assigned interns todos" ON public.todos;
CREATE POLICY "Admin read assigned interns todos" ON public.todos
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.interns i
      JOIN public.admin_problem_statements aps ON i.problem_statement_id = aps.problem_statement_id
      WHERE aps.admin_id = auth.uid() AND aps.is_active = true AND i.user_id = todos.user_id
    )
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'superadmin'::public.app_role
    )
  );

-- public.ai_analysis
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
      WHERE aps.admin_id = auth.uid() AND aps.is_active = true AND i.user_id = ai_analysis.user_id
    )
  );
