-- Migration: RBAC and Problem Statement-Based Access Control
-- Target File: supabase/migrations/20260709180000_apex_access_control.sql

-- 1. Enable Cryptography Extension if not present
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Drop the redundant public.admins table
DROP TABLE IF EXISTS public.admins CASCADE;

-- 3. Modify public.profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'intern' CHECK (role IN ('intern', 'admin', 'super_admin'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive'));

-- 4. Modify public.problem_statements table
ALTER TABLE public.problem_statements ADD COLUMN IF NOT EXISTS title TEXT;
UPDATE public.problem_statements SET title = name WHERE title IS NULL;
ALTER TABLE public.problem_statements ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive'));

-- 5. Create mapping table admin_problem_statements
CREATE TABLE IF NOT EXISTS public.admin_problem_statements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    problem_statement_id UUID NOT NULL REFERENCES public.problem_statements(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (admin_id, problem_statement_id)
);

-- 6. Create interns table
CREATE TABLE IF NOT EXISTS public.interns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    problem_statement_id UUID REFERENCES public.problem_statements(id) ON DELETE SET NULL,
    UNIQUE (user_id)
);

-- 7. Grant rights to authenticated and service_role
GRANT ALL ON public.admin_problem_statements TO authenticated, service_role;
GRANT ALL ON public.interns TO authenticated, service_role;

-- 8. Create Postgres helper function to verify Admin track assignments
CREATE OR REPLACE FUNCTION public.is_admin_assigned_to_problem_name(admin_uuid UUID, problem_name TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- If the user is a super_admin, they have full access to everything.
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = admin_uuid AND role = 'super_admin') THEN
    RETURN TRUE;
  END IF;

  -- Otherwise, check if the admin is assigned to the problem statement with the given title or name.
  RETURN EXISTS (
    SELECT 1 FROM public.admin_problem_statements aps
    JOIN public.problem_statements ps ON aps.problem_statement_id = ps.id
    WHERE aps.admin_id = admin_uuid AND (ps.title = problem_name OR ps.name = problem_name)
  );
END; $$;

-- 9. Trigger to sync profiles changes with public.interns
CREATE OR REPLACE FUNCTION public.sync_intern_profile()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.role = 'intern' THEN
    INSERT INTO public.interns (user_id, name, email, problem_statement_id)
    VALUES (
      NEW.id,
      COALESCE(NEW.full_name, 'New Intern'),
      COALESCE(NEW.email, ''),
      (SELECT id FROM public.problem_statements WHERE title = NEW.problem_statement OR name = NEW.problem_statement LIMIT 1)
    )
    ON CONFLICT (user_id) DO UPDATE
    SET name = EXCLUDED.name,
        email = EXCLUDED.email,
        problem_statement_id = EXCLUDED.problem_statement_id;
  ELSE
    DELETE FROM public.interns WHERE user_id = NEW.id;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS sync_intern_profile_trigger ON public.profiles;
CREATE TRIGGER sync_intern_profile_trigger
AFTER INSERT OR UPDATE OF full_name, email, role, problem_statement ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.sync_intern_profile();

-- 10. Trigger to sync profiles.role with public.user_roles (backward compatibility)
CREATE OR REPLACE FUNCTION public.sync_user_role_table()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_db_role public.app_role;
BEGIN
  IF NEW.role = 'super_admin' THEN
    v_db_role := 'superadmin'::public.app_role;
  ELSIF NEW.role = 'admin' THEN
    v_db_role := 'admin'::public.app_role;
  ELSE
    v_db_role := 'intern'::public.app_role;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, v_db_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Delete other roles for this user to keep roles exclusive
  DELETE FROM public.user_roles WHERE user_id = NEW.id AND role != v_db_role;

  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS sync_user_role_table_trigger ON public.profiles;
CREATE TRIGGER sync_user_role_table_trigger
AFTER INSERT OR UPDATE OF role ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.sync_user_role_table();

-- 11. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.problem_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_problem_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diary_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

-- 12. Create RLS Policies
-- Profiles Policies
DROP POLICY IF EXISTS "profiles_select_authenticated" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "super_admin_all_profiles" ON public.profiles;

CREATE POLICY "profiles_select_authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "super_admin_all_profiles" ON public.profiles FOR ALL TO authenticated USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
);

-- Problem Statements Policies
DROP POLICY IF EXISTS "Public Read access to problem statements" ON public.problem_statements;
DROP POLICY IF EXISTS "Super admin full write access to problem statements" ON public.problem_statements;

CREATE POLICY "Public Read access to problem statements" ON public.problem_statements FOR SELECT USING (true);
CREATE POLICY "Super admin full write access to problem statements" ON public.problem_statements FOR ALL USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
);

-- Admin Problem Statements Policies
DROP POLICY IF EXISTS "Select admin assignments" ON public.admin_problem_statements;
DROP POLICY IF EXISTS "Super admin write admin assignments" ON public.admin_problem_statements;

CREATE POLICY "Select admin assignments" ON public.admin_problem_statements FOR SELECT USING (true);
CREATE POLICY "Super admin write admin assignments" ON public.admin_problem_statements FOR ALL USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
);

-- Interns Policies
DROP POLICY IF EXISTS "Super admin full access to interns" ON public.interns;
DROP POLICY IF EXISTS "Admin access to interns of assigned tracks" ON public.interns;
DROP POLICY IF EXISTS "Intern read own intern record" ON public.interns;

CREATE POLICY "Super admin full access to interns" ON public.interns FOR ALL USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
);
CREATE POLICY "Admin access to interns of assigned tracks" ON public.interns FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.admin_problem_statements aps
    WHERE aps.admin_id = auth.uid() AND aps.problem_statement_id = interns.problem_statement_id
  )
);
CREATE POLICY "Intern read own intern record" ON public.interns FOR SELECT USING (
  auth.uid() = user_id
);

-- Attendance Sessions Policies
DROP POLICY IF EXISTS "Select active sessions" ON public.attendance_sessions;
DROP POLICY IF EXISTS "Admin write sessions" ON public.attendance_sessions;
DROP POLICY IF EXISTS "Super admin full access to sessions" ON public.attendance_sessions;
DROP POLICY IF EXISTS "Admin access to sessions of assigned tracks" ON public.attendance_sessions;
DROP POLICY IF EXISTS "Intern select sessions" ON public.attendance_sessions;

CREATE POLICY "Super admin full access to sessions" ON public.attendance_sessions FOR ALL USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
);
CREATE POLICY "Admin access to sessions of assigned tracks" ON public.attendance_sessions FOR ALL USING (
  public.is_admin_assigned_to_problem_name(auth.uid(), problem_statement)
);
CREATE POLICY "Intern select sessions" ON public.attendance_sessions FOR SELECT USING (true);

-- Attendance Records Policies
DROP POLICY IF EXISTS "Select records" ON public.attendance_records;
DROP POLICY IF EXISTS "Insert own record" ON public.attendance_records;
DROP POLICY IF EXISTS "Admin update records" ON public.attendance_records;
DROP POLICY IF EXISTS "Super admin full access to records" ON public.attendance_records;
DROP POLICY IF EXISTS "Admin access to records of assigned tracks" ON public.attendance_records;
DROP POLICY IF EXISTS "Intern select own records" ON public.attendance_records;
DROP POLICY IF EXISTS "Intern insert own records" ON public.attendance_records;

CREATE POLICY "Super admin full access to records" ON public.attendance_records FOR ALL USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
);
CREATE POLICY "Admin access to records of assigned tracks" ON public.attendance_records FOR ALL USING (
  public.is_admin_assigned_to_problem_name(auth.uid(), problem_statement)
);
CREATE POLICY "Intern select own records" ON public.attendance_records FOR SELECT USING (
  auth.uid() = user_id
);
CREATE POLICY "Intern insert own records" ON public.attendance_records FOR INSERT WITH CHECK (
  auth.uid() = user_id
);

-- Diary Entries Policies
DROP POLICY IF EXISTS "diary_select_own" ON public.diary_entries;
DROP POLICY IF EXISTS "diary_insert_own" ON public.diary_entries;
DROP POLICY IF EXISTS "diary_update_own" ON public.diary_entries;
DROP POLICY IF EXISTS "diary_delete_own" ON public.diary_entries;
DROP POLICY IF EXISTS "Admin read assigned interns diary entries" ON public.diary_entries;

CREATE POLICY "diary_select_own" ON public.diary_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "diary_insert_own" ON public.diary_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "diary_update_own" ON public.diary_entries FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "diary_delete_own" ON public.diary_entries FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admin read assigned interns diary entries" ON public.diary_entries FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.interns i
    JOIN public.admin_problem_statements aps ON i.problem_statement_id = aps.problem_statement_id
    WHERE aps.admin_id = auth.uid() AND i.user_id = diary_entries.user_id
  )
  OR
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
);

-- Todos Policies
DROP POLICY IF EXISTS "todos_select_own" ON public.todos;
DROP POLICY IF EXISTS "Admin read assigned interns todos" ON public.todos;

CREATE POLICY "todos_select_own" ON public.todos FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admin read assigned interns todos" ON public.todos FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.interns i
    JOIN public.admin_problem_statements aps ON i.problem_statement_id = aps.problem_statement_id
    WHERE aps.admin_id = auth.uid() AND i.user_id = todos.user_id
  )
  OR
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
);

-- 13. Seed default admin & super_admin credentials securely
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
VALUES (
    'a5c8dfcd-d7ab-4b36-a363-2287f39ebdfa',
    'super@gmail.com',
    crypt('super123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Super Admin User"}'::jsonb,
    now(),
    now(),
    'authenticated',
    'authenticated'
) ON CONFLICT (email) DO NOTHING;

INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
VALUES (
    'b7b2f6ef-59db-48ef-b6b8-2a91176b9f29',
    'admin@gmail.com',
    crypt('admin123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Admin User"}'::jsonb,
    now(),
    now(),
    'authenticated',
    'authenticated'
) ON CONFLICT (email) DO NOTHING;

-- Force roles update on seeded users
UPDATE public.profiles SET role = 'super_admin', status = 'active' WHERE email = 'super@gmail.com';
UPDATE public.profiles SET role = 'admin', status = 'active' WHERE email = 'admin@gmail.com';
