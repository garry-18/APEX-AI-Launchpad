-- Admin & Super Admin Management Database Migrations

-- 1. Problem Statements table
CREATE TABLE IF NOT EXISTS public.problem_statements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Colleges table
CREATE TABLE IF NOT EXISTS public.colleges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    city TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Admins table
CREATE TABLE IF NOT EXISTS public.admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    mobile TEXT,
    role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    assigned_problems TEXT[], -- Array of problem statement names
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Attendance Sessions table
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

-- 5. Attendance Records table
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

-- 6. Attendance Extensions table
CREATE TABLE IF NOT EXISTS public.attendance_extensions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
    minutes INTEGER NOT NULL,
    extended_by UUID REFERENCES auth.users(id),
    extended_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Attendance Holidays table
CREATE TABLE IF NOT EXISTS public.attendance_holidays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    holiday_date DATE UNIQUE NOT NULL,
    title TEXT NOT NULL,
    category TEXT CHECK (category IN ('Public Holiday', 'Sunday', 'Festival', 'College Holiday', 'Emergency Holiday', 'Custom Off Day')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Attendance Passwords table
CREATE TABLE IF NOT EXISTS public.attendance_passwords (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
    password TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Attendance Audit Logs table
CREATE TABLE IF NOT EXISTS public.attendance_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    record_id UUID REFERENCES public.attendance_records(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL, -- e.g. "manual_override"
    old_status TEXT,
    new_status TEXT,
    reason TEXT NOT NULL,
    marked_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.problem_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_extensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_passwords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_audit_logs ENABLE ROW LEVEL SECURITY;

-- 10. Configure Security Policies
-- Problem Statements RLS
CREATE POLICY "Public Read access to problem statements" ON public.problem_statements FOR SELECT USING (true);
CREATE POLICY "Super admin full write access to problem statements" ON public.problem_statements FOR ALL USING (true);

-- Colleges RLS
CREATE POLICY "Public Read access to colleges" ON public.colleges FOR SELECT USING (true);
CREATE POLICY "Super admin full write access to colleges" ON public.colleges FOR ALL USING (true);

-- Admins RLS
CREATE POLICY "Admin select own" ON public.admins FOR SELECT USING (true);
CREATE POLICY "Super Admin write admins" ON public.admins FOR ALL USING (true);

-- Attendance Sessions RLS
CREATE POLICY "Select active sessions" ON public.attendance_sessions FOR SELECT USING (true);
CREATE POLICY "Admin write sessions" ON public.attendance_sessions FOR ALL USING (true);

-- Attendance Records RLS
CREATE POLICY "Select records" ON public.attendance_records FOR SELECT USING (true);
CREATE POLICY "Insert own record" ON public.attendance_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin update records" ON public.attendance_records FOR ALL USING (true);
