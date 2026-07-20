CREATE TABLE public.colleges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.colleges TO authenticated;
GRANT ALL ON public.colleges TO service_role;
ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "colleges_select_all" ON public.colleges FOR SELECT TO authenticated USING (true);
CREATE POLICY "colleges_insert_auth" ON public.colleges FOR INSERT TO authenticated WITH CHECK (true);
INSERT INTO public.colleges (name) VALUES
  ('iit bombay'),('iit delhi'),('iit madras'),('bits pilani'),('nit trichy'),
  ('stanford university'),('mit'),('harvard university'),('uc berkeley')
ON CONFLICT (name) DO NOTHING;