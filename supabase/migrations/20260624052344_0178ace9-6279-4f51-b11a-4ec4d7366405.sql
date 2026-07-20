
CREATE TABLE public.diary_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  mood TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  entry_date DATE NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  entry_time TIME NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::time,
  pinned BOOLEAN NOT NULL DEFAULT false,
  is_draft BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.diary_entries TO authenticated;
GRANT ALL ON public.diary_entries TO service_role;

ALTER TABLE public.diary_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "diary_select_own" ON public.diary_entries
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "diary_insert_own" ON public.diary_entries
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "diary_update_own" ON public.diary_entries
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "diary_delete_own" ON public.diary_entries
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX diary_entries_user_date_idx ON public.diary_entries (user_id, entry_date DESC);

CREATE TRIGGER diary_entries_set_updated_at
  BEFORE UPDATE ON public.diary_entries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
