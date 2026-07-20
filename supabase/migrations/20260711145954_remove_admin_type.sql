-- Migration: Remove Admin Type Column and Simplify Access Checking
-- Target File: supabase/migrations/20260711145954_remove_admin_type.sql

-- 1. Drop admin_type column from public.profiles table
ALTER TABLE public.profiles DROP COLUMN IF EXISTS admin_type;

-- 2. Recreate function is_admin_assigned_to_problem_name without admin_type
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

  -- Otherwise, check if the admin is assigned to the problem statement with the given name.
  RETURN EXISTS (
    SELECT 1 FROM public.admin_problem_statements aps
    JOIN public.problem_statements ps ON aps.problem_statement_id = ps.id
    WHERE aps.admin_id = admin_uuid AND ps.name = problem_name
  );
END;
$$;
