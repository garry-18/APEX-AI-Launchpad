-- Migration: Redefine public_leaderboard view and add points_audit_logs
-- Target File: supabase/migrations/20260713030000_leaderboard_enhancements.sql

-- 1. Recreate the public_leaderboard view to filter role = 'intern'
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

-- 2. Create points_audit_logs table
CREATE TABLE IF NOT EXISTS public.points_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    intern_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    points_type TEXT NOT NULL, -- 'community' or 'attendance'
    amount INTEGER NOT NULL,
    reason TEXT NOT NULL,
    adjusted_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Grant access
GRANT ALL ON public.points_audit_logs TO authenticated, service_role;

-- Enable Row Level Security
ALTER TABLE public.points_audit_logs ENABLE ROW LEVEL SECURITY;

-- SELECT policy for point logs
DROP POLICY IF EXISTS "points_audit_logs_select" ON public.points_audit_logs;
CREATE POLICY "points_audit_logs_select" ON public.points_audit_logs
    FOR SELECT TO authenticated
    USING (
        -- Super Admin
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
        -- Intern checking own history
        OR intern_id = auth.uid()
        -- Admin checking scoped history
        OR (
            (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
            AND EXISTS (
                SELECT 1 FROM public.admin_problem_statements aps
                JOIN public.profiles ip ON ip.id = intern_id
                WHERE aps.admin_id = auth.uid()
                  AND aps.is_active = true
                  AND aps.problem_statement_id = ip.problem_statement_id
            )
        )
    );
