-- Migration: Create and Seed Problem Statements Table
-- Target File: supabase/migrations/20260711142214_create_problem_statements.sql

-- 1. Create problem_statements table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.problem_statements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Seed exactly these 12 rows idempotently
INSERT INTO public.problem_statements (name) VALUES
('ASG Ecosystem'),
('Career Intelligence Platform'),
('Digital Economy'),
('Energy as Distribution'),
('Events Industry'),
('Gaming'),
('HoReCa'),
('Kids Sector'),
('Mobility'),
('Social Work and Sustainability'),
('Sports and Fitness'),
('Temple Economy')
ON CONFLICT (name) DO NOTHING;

-- 3. Create admin_problem_statements mapping table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.admin_problem_statements (
    admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    problem_statement_id UUID NOT NULL REFERENCES public.problem_statements(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (admin_id, problem_statement_id)
);

-- 4. Create Indexes
CREATE INDEX IF NOT EXISTS idx_admin_problem_statements_admin_id ON public.admin_problem_statements(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_problem_statements_problem_statement_id ON public.admin_problem_statements(problem_statement_id);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.problem_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_problem_statements ENABLE ROW LEVEL SECURITY;

-- 6. Apply RLS policies
-- Authenticated users should be able to read problem_statements
DROP POLICY IF EXISTS "Public Read access to problem statements" ON public.problem_statements;
CREATE POLICY "Public Read access to problem statements" ON public.problem_statements
    FOR SELECT TO authenticated USING (true);

-- Only Super Admin should create/write problem statements
DROP POLICY IF EXISTS "Super admin full write access to problem statements" ON public.problem_statements;
CREATE POLICY "Super admin full write access to problem statements" ON public.problem_statements
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid() AND ur.role = 'superadmin'::public.app_role
        )
    );

-- Authenticated users should be able to read assignments
DROP POLICY IF EXISTS "Select admin assignments" ON public.admin_problem_statements;
CREATE POLICY "Select admin assignments" ON public.admin_problem_statements
    FOR SELECT TO authenticated USING (true);

-- Only Super Admin should write/create admin assignments
DROP POLICY IF EXISTS "Super admin write admin assignments" ON public.admin_problem_statements;
CREATE POLICY "Super admin write admin assignments" ON public.admin_problem_statements
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid() AND ur.role = 'superadmin'::public.app_role
        )
    );
