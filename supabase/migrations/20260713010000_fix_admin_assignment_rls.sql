-- 1. Fix admin_problem_statements RLS write and read policies
DROP POLICY IF EXISTS "Select admin assignments" ON public.admin_problem_statements;
DROP POLICY IF EXISTS "Super admin write admin assignments" ON public.admin_problem_statements;
DROP POLICY IF EXISTS "Insert admin assignments" ON public.admin_problem_statements;

-- Allow select for all authenticated users
CREATE POLICY "Select admin assignments" ON public.admin_problem_statements
    FOR SELECT TO authenticated USING (true);

-- Allow all write operations (INSERT, UPDATE, DELETE) for authenticated users whose profile role is 'super_admin'
CREATE POLICY "Super admin write admin assignments" ON public.admin_problem_statements
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid()
              AND p.role = 'super_admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid()
              AND p.role = 'super_admin'
        )
    );

-- 2. Fix problem_statements RLS read policy
DROP POLICY IF EXISTS "Public Read access to problem statements" ON public.problem_statements;

CREATE POLICY "Public Read access to problem statements" ON public.problem_statements
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid()
              AND p.role IN ('super_admin', 'intern')
        )
        OR EXISTS (
            SELECT 1 FROM public.admin_problem_statements aps
            WHERE aps.problem_statement_id = id
              AND aps.admin_id = auth.uid()
        )
    );
