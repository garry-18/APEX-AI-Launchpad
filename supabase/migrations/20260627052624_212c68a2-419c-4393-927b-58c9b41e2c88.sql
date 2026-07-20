
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  link text,
  audience text NOT NULL DEFAULT 'all' CHECK (audience IN ('all','user')),
  target_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id uuid NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_read boolean NOT NULL DEFAULT false,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (notification_id, user_id)
);
GRANT SELECT, UPDATE ON public.user_notifications TO authenticated;
GRANT ALL ON public.user_notifications TO service_role;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own notification state"
  ON public.user_notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users update own notification state"
  ON public.user_notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND is_read = true);

CREATE POLICY "Authenticated can read notifications they received"
  ON public.notifications FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_notifications un
      WHERE un.notification_id = notifications.id AND un.user_id = auth.uid()
    )
  );

CREATE INDEX idx_user_notifications_user_unread
  ON public.user_notifications (user_id, is_read, created_at DESC);
CREATE INDEX idx_user_notifications_notification
  ON public.user_notifications (notification_id);

CREATE OR REPLACE FUNCTION public.fanout_notification()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.audience = 'all' THEN
    INSERT INTO public.user_notifications (notification_id, user_id)
    SELECT NEW.id, p.id FROM public.profiles p
    ON CONFLICT (notification_id, user_id) DO NOTHING;
  ELSIF NEW.audience = 'user' AND NEW.target_user_id IS NOT NULL THEN
    INSERT INTO public.user_notifications (notification_id, user_id)
    VALUES (NEW.id, NEW.target_user_id)
    ON CONFLICT (notification_id, user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_fanout_notification
  AFTER INSERT ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.fanout_notification();

CREATE OR REPLACE FUNCTION public.send_self_notification(_title text, _message text, _link text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _id uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF coalesce(length(btrim(_title)),0) = 0 OR length(_title) > 200 THEN RAISE EXCEPTION 'Invalid title'; END IF;
  IF coalesce(length(btrim(_message)),0) = 0 OR length(_message) > 2000 THEN RAISE EXCEPTION 'Invalid message'; END IF;
  INSERT INTO public.notifications(title, message, link, audience, target_user_id, sender_id)
  VALUES (_title, _message, _link, 'user', auth.uid(), auth.uid())
  RETURNING id INTO _id;
  RETURN _id;
END; $$;
REVOKE ALL ON FUNCTION public.send_self_notification(text,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.send_self_notification(text,text,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.mark_all_notifications_read()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  UPDATE public.user_notifications
     SET is_read = true, read_at = now()
   WHERE user_id = auth.uid() AND is_read = false;
END; $$;
REVOKE ALL ON FUNCTION public.mark_all_notifications_read() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_all_notifications_read() TO authenticated;

ALTER PUBLICATION supabase_realtime ADD TABLE public.user_notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER TABLE public.user_notifications REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
