-- =========================================================================
-- APEX AI LAUNCHPAD - CONSOLIDATED DATABASE SCHEMAS & POLICIES MIGRATION
-- RUN THIS IN THE SUPABASE SQL EDITOR TO FIX THE LEADERBOARD & REALTIME
-- =========================================================================

-- -------------------------------------------------------------------------
-- STEP 0: ENSURE BASE TABLES EXIST BEFORE APPLYING POLICIES/INDEXES
-- -------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.problem_statements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.colleges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    city TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.admin_problem_statements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    problem_statement_id UUID NOT NULL REFERENCES public.problem_statements(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (admin_id, problem_statement_id)
);

CREATE TABLE IF NOT EXISTS public.attendance_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    session_date DATE NOT NULL,
    problem_statement TEXT, -- Can be General / null
    college TEXT,           -- Can be General / null
    start_time TIME NOT NULL DEFAULT '10:00:00',
    end_time TIME NOT NULL DEFAULT '10:30:00',
    latitude NUMERIC NOT NULL,
    longitude NUMERIC NOT NULL,
    radius INTEGER DEFAULT 100, -- in meters: 50, 100, 200
    gps_verification BOOLEAN DEFAULT TRUE,
    password_verification BOOLEAN DEFAULT TRUE,
    password TEXT,
    status TEXT DEFAULT 'Scheduled' CHECK (status IN ('Draft', 'Scheduled', 'Live', 'Closed')),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    intern_name TEXT NOT NULL,
    college TEXT NOT NULL,
    city TEXT NOT NULL,
    problem_statement TEXT NOT NULL,
    status TEXT CHECK (status IN ('Present', 'Absent', 'Late', 'Leave', 'Excused')),
    latitude NUMERIC,
    longitude NUMERIC,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- -------------------------------------------------------------------------
-- STEP 1: ADD COLUMNS TO ADMIN PROBLEM STATEMENTS
-- -------------------------------------------------------------------------
ALTER TABLE public.admin_problem_statements ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true NOT NULL;
ALTER TABLE public.admin_problem_statements ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;

-- Drop index if it exists before creating it to prevent errors
DROP INDEX IF EXISTS unique_active_admin_assignment;
CREATE UNIQUE INDEX unique_active_admin_assignment ON public.admin_problem_statements (admin_id) WHERE (is_active = true);

-- -------------------------------------------------------------------------
-- STEP 2: CREATE HELPER FUNCTIONS (INCLUDING NON-RECURSIVE ROLE GETTER)
-- -------------------------------------------------------------------------

-- 2a. Function to get user role directly from profiles bypassing RLS recursion
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.profiles WHERE id = user_id;
$$;

-- 2b. Function to check admin problem statement assignment
CREATE OR REPLACE FUNCTION public.is_admin_assigned_to_problem_name(admin_uuid UUID, problem_name TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- If the user is a super_admin, they have full access to everything.
  IF public.get_user_role(admin_uuid) = 'super_admin' THEN
    RETURN TRUE;
  END IF;

  -- If the user is not an admin, return false.
  IF public.get_user_role(admin_uuid) != 'admin' THEN
    RETURN FALSE;
  END IF;

  -- If the admin is not active, return false.
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = admin_uuid AND status = 'inactive') THEN
    RETURN FALSE;
  END IF;

  -- If the problem name is NULL or empty:
  -- Only allow access if the admin has at least one active assignment.
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

-- -------------------------------------------------------------------------
-- STEP 3: FIX ADMIN ASSIGNMENTS & PROBLEM STATEMENTS RLS POLICIES
-- -------------------------------------------------------------------------
DROP POLICY IF EXISTS "Select admin assignments" ON public.admin_problem_statements;
DROP POLICY IF EXISTS "Super admin write admin assignments" ON public.admin_problem_statements;
DROP POLICY IF EXISTS "Insert admin assignments" ON public.admin_problem_statements;

CREATE POLICY "Select admin assignments" ON public.admin_problem_statements
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Super admin write admin assignments" ON public.admin_problem_statements
    FOR ALL TO authenticated
    USING (
        public.get_user_role(auth.uid()) = 'super_admin'
    )
    WITH CHECK (
        public.get_user_role(auth.uid()) = 'super_admin'
    );

DROP POLICY IF EXISTS "Public Read access to problem statements" ON public.problem_statements;
CREATE POLICY "Public Read access to problem statements" ON public.problem_statements
    FOR SELECT TO authenticated
    USING (
        public.get_user_role(auth.uid()) IN ('super_admin', 'intern')
        OR EXISTS (
            SELECT 1 FROM public.admin_problem_statements aps
            WHERE aps.problem_statement_id = id
              AND aps.admin_id = auth.uid()
        )
    );

-- -------------------------------------------------------------------------
-- STEP 4: ADD PROBLEM_STATEMENT_ID TO PROFILES
-- -------------------------------------------------------------------------
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS problem_statement_id UUID REFERENCES public.problem_statements(id) ON DELETE SET NULL;

UPDATE public.profiles p
SET problem_statement_id = ps.id
FROM public.problem_statements ps
WHERE (p.problem_statement = ps.name)
  AND p.problem_statement_id IS NULL;

DROP TRIGGER IF EXISTS sync_intern_profile_trigger ON public.profiles;
DROP FUNCTION IF EXISTS public.sync_intern_profile();

-- -------------------------------------------------------------------------
-- STEP 5: UPDATE PROFILES RLS POLICIES (BYPASSING RLS RECURSION)
-- -------------------------------------------------------------------------
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
CREATE POLICY "profiles_select_policy" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    auth.uid() = id
    OR public.get_user_role(auth.uid()) = 'super_admin'
    OR (
      public.get_user_role(auth.uid()) = 'admin'
      AND EXISTS (
        SELECT 1 FROM public.admin_problem_statements aps
        WHERE aps.admin_id = auth.uid()
          AND aps.is_active = true
          AND aps.problem_statement_id = public.profiles.problem_statement_id
      )
    )
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
    auth.uid() = id
    OR public.get_user_role(auth.uid()) = 'super_admin'
    OR (
      public.get_user_role(auth.uid()) = 'admin'
      AND EXISTS (
        SELECT 1 FROM public.admin_problem_statements aps
        WHERE aps.admin_id = auth.uid()
          AND aps.is_active = true
          AND aps.problem_statement_id = public.profiles.problem_statement_id
      )
    )
  )
  WITH CHECK (
    public.get_user_role(auth.uid()) = 'super_admin'
    OR auth.uid() = id
    OR (
      public.get_user_role(auth.uid()) = 'admin'
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
    OR public.get_user_role(auth.uid()) = 'super_admin'
  );

-- -------------------------------------------------------------------------
-- STEP 6: REWRITE ATTENDANCE POLICIES
-- -------------------------------------------------------------------------
DROP POLICY IF EXISTS "Super admin full access to sessions" ON public.attendance_sessions;
DROP POLICY IF EXISTS "Admin access to sessions of assigned tracks" ON public.attendance_sessions;
DROP POLICY IF EXISTS "Intern select sessions" ON public.attendance_sessions;
DROP POLICY IF EXISTS "sessions_access_policy" ON public.attendance_sessions;
DROP POLICY IF EXISTS "sessions_intern_select" ON public.attendance_sessions;

CREATE POLICY "sessions_access_policy" ON public.attendance_sessions
  FOR ALL TO authenticated
  USING (
    public.get_user_role(auth.uid()) = 'super_admin'
    OR EXISTS (
      SELECT 1 FROM public.admin_problem_statements aps
      JOIN public.problem_statements ps ON aps.problem_statement_id = ps.id
      WHERE aps.admin_id = auth.uid()
        AND aps.is_active = true
        AND (ps.name = problem_statement OR problem_statement IS NULL)
    )
  )
  WITH CHECK (
    public.get_user_role(auth.uid()) = 'super_admin'
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
    public.get_user_role(auth.uid()) = 'intern'
  );

DROP POLICY IF EXISTS "Super admin full access to records" ON public.attendance_records;
DROP POLICY IF EXISTS "Admin access to records of assigned tracks" ON public.attendance_records;
DROP POLICY IF EXISTS "Intern select own records" ON public.attendance_records;
DROP POLICY IF EXISTS "Intern insert own records" ON public.attendance_records;
DROP POLICY IF EXISTS "records_access_policy" ON public.attendance_records;

CREATE POLICY "records_access_policy" ON public.attendance_records
  FOR ALL TO authenticated
  USING (
    public.get_user_role(auth.uid()) = 'super_admin'
    OR (
      public.get_user_role(auth.uid()) = 'admin'
      AND EXISTS (
        SELECT 1 FROM public.admin_problem_statements aps
        JOIN public.profiles ip ON ip.id = attendance_records.user_id AND ip.role = 'intern'
        WHERE aps.admin_id = auth.uid()
          AND aps.is_active = true
          AND aps.problem_statement_id = ip.problem_statement_id
      )
    )
    OR user_id = auth.uid()
  )
  WITH CHECK (
    public.get_user_role(auth.uid()) = 'super_admin'
    OR (
      public.get_user_role(auth.uid()) = 'admin'
      AND EXISTS (
        SELECT 1 FROM public.admin_problem_statements aps
        JOIN public.profiles ip ON ip.id = attendance_records.user_id AND ip.role = 'intern'
        WHERE aps.admin_id = auth.uid()
          AND aps.is_active = true
          AND aps.problem_statement_id = ip.problem_statement_id
      )
    )
    OR user_id = auth.uid()
  );

-- -------------------------------------------------------------------------
-- STEP 7: RECREATE THE PUBLIC LEADERBOARD VIEW
-- -------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.public_leaderboard
WITH (security_invoker = true) AS
SELECT
  p.id,
  p.full_name,
  p.avatar_url,
  p.college,
  p.problem_statement,
  p.community_points,
  p.attendance_points,
  COALESCE(a.overall_score, 0)  AS overall_score,
  COALESCE(a.branding_score, 0) AS branding_score,
  p.role,                  -- Include role for frontend checks
  p.problem_statement_id,   -- Include problem_statement_id for track filters
  p.created_at             -- Include created_at for time calculations if needed
FROM public.profiles p
LEFT JOIN public.privacy_settings s ON s.user_id = p.id
LEFT JOIN public.ai_analysis a ON a.user_id = p.id
WHERE COALESCE(s.show_leaderboard, true) = true
  AND p.role = 'intern';

-- -------------------------------------------------------------------------
-- STEP 8: CREATE POINTS AUDIT LOGS TABLE & SCORING RLS
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.points_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    intern_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    points_type TEXT NOT NULL, -- 'community' or 'attendance'
    amount INTEGER NOT NULL,
    reason TEXT NOT NULL,
    adjusted_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

GRANT ALL ON public.points_audit_logs TO authenticated, service_role;
ALTER TABLE public.points_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "points_audit_logs_select" ON public.points_audit_logs;
CREATE POLICY "points_audit_logs_select" ON public.points_audit_logs
    FOR SELECT TO authenticated
    USING (
        public.get_user_role(auth.uid()) = 'super_admin'
        OR intern_id = auth.uid()
        OR (
            public.get_user_role(auth.uid()) = 'admin'
            AND EXISTS (
                SELECT 1 FROM public.admin_problem_statements aps
                JOIN public.profiles ip ON ip.id = intern_id
                WHERE aps.admin_id = auth.uid()
                  AND aps.is_active = true
                  AND aps.problem_statement_id = ip.problem_statement_id
            )
        )
    );

-- -------------------------------------------------------------------------
-- STEP 9: ENABLE REALTIME REPLICATION FOR PROFILES AND AUDIT LOGS
-- -------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'points_audit_logs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.points_audit_logs;
  END IF;
END $$;

ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.points_audit_logs REPLICA IDENTITY FULL;
