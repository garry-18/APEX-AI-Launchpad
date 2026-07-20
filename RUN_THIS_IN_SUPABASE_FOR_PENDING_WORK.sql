-- =========================================================================
-- APEX AI LAUNCHPAD - PENDING WORK REVIEW & SUBMISSION WORKFLOW SCHEMA
-- RUN THIS IN THE SUPABASE SQL EDITOR TO CREATE TABLES & POLICIES
-- =========================================================================

-- -------------------------------------------------------------------------
-- STEP 1: CREATE TABLES
-- -------------------------------------------------------------------------

-- 1a. Pending Work Activities Table
CREATE TABLE IF NOT EXISTS public.pending_work_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    problem_statement_id UUID NOT NULL REFERENCES public.problem_statements(id) ON DELETE CASCADE,
    assigned_admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT,
    submission_type TEXT,
    file_url TEXT,
    external_link TEXT,
    remarks TEXT,
    status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Pending', 'Submitted', 'Viewed', 'Under Review', 'Changes Requested', 'Resubmitted', 'Approved', 'Rejected')),
    is_draft BOOLEAN NOT NULL DEFAULT true,
    submitted_at TIMESTAMP WITH TIME ZONE,
    approved_at TIMESTAMP WITH TIME ZONE,
    rejected_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1b. Activity Comments Table
CREATE TABLE IF NOT EXISTS public.activity_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID NOT NULL REFERENCES public.pending_work_activities(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    attachment_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1c. Activity History Table (Timeline Log)
CREATE TABLE IF NOT EXISTS public.activity_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID NOT NULL REFERENCES public.pending_work_activities(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    performed_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    previous_status TEXT,
    new_status TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1d. Activity Notifications Table
CREATE TABLE IF NOT EXISTS public.activity_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    activity_id UUID NOT NULL REFERENCES public.pending_work_activities(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- -------------------------------------------------------------------------
-- STEP 2: CREATE INDEXES FOR PERFORMANCE
-- -------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_activities_student_id ON public.pending_work_activities(student_id);
CREATE INDEX IF NOT EXISTS idx_activities_prob_stmt_id ON public.pending_work_activities(problem_statement_id);
CREATE INDEX IF NOT EXISTS idx_activities_assigned_admin_id ON public.pending_work_activities(assigned_admin_id);
CREATE INDEX IF NOT EXISTS idx_comments_activity_id ON public.activity_comments(activity_id);
CREATE INDEX IF NOT EXISTS idx_history_activity_id ON public.activity_history(activity_id);
CREATE INDEX IF NOT EXISTS idx_notifications_receiver_id ON public.activity_notifications(receiver_id);

-- -------------------------------------------------------------------------
-- STEP 3: CREATE TRIGGERS & FUNCTIONS
-- -------------------------------------------------------------------------

-- 3a. Auto-assign admin matching active admin_problem_statements assignment
CREATE OR REPLACE FUNCTION public.sync_assigned_admin()
RETURNS TRIGGER AS $$
BEGIN
  NEW.assigned_admin_id := (
    SELECT admin_id FROM public.admin_problem_statements
    WHERE problem_statement_id = NEW.problem_statement_id
      AND is_active = true
    LIMIT 1
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS sync_assigned_admin_trigger ON public.pending_work_activities;
CREATE TRIGGER sync_assigned_admin_trigger
BEFORE INSERT ON public.pending_work_activities
FOR EACH ROW EXECUTE FUNCTION public.sync_assigned_admin();

-- 3b. Auto-log activity history log events
CREATE OR REPLACE FUNCTION public.log_activity_history()
RETURNS TRIGGER AS $$
DECLARE
  v_action TEXT;
BEGIN
  IF (TG_OP = 'INSERT') THEN
    v_action := CASE WHEN NEW.is_draft THEN 'Created Draft' ELSE 'Submitted' END;
    INSERT INTO public.activity_history (activity_id, action, performed_by, previous_status, new_status)
    VALUES (NEW.id, v_action, NEW.student_id, NULL, NEW.status);
  ELSIF (TG_OP = 'UPDATE') THEN
    IF (OLD.is_draft = true AND NEW.is_draft = false) THEN
      INSERT INTO public.activity_history (activity_id, action, performed_by, previous_status, new_status)
      VALUES (NEW.id, 'Submitted', NEW.student_id, OLD.status, NEW.status);
    ELSIF (OLD.status IS DISTINCT FROM NEW.status) THEN
      v_action := CASE 
        WHEN NEW.status = 'Pending' THEN 'Resubmitted'
        WHEN NEW.status = 'Submitted' THEN 'Submitted'
        WHEN NEW.status = 'Viewed' THEN 'Viewed by Admin'
        WHEN NEW.status = 'Under Review' THEN 'Placed Under Review'
        WHEN NEW.status = 'Changes Requested' THEN 'Changes Requested'
        WHEN NEW.status = 'Approved' THEN 'Approved'
        WHEN NEW.status = 'Rejected' THEN 'Rejected'
        ELSE 'Status Updated'
      END;
      
      INSERT INTO public.activity_history (activity_id, action, performed_by, previous_status, new_status)
      VALUES (NEW.id, v_action, COALESCE(auth.uid(), NEW.student_id), OLD.status, NEW.status);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS log_activity_history_trigger ON public.pending_work_activities;
CREATE TRIGGER log_activity_history_trigger
AFTER INSERT OR UPDATE ON public.pending_work_activities
FOR EACH ROW EXECUTE FUNCTION public.log_activity_history();

-- 3c. Auto-notify on activity status or submission update
CREATE OR REPLACE FUNCTION public.notify_on_activity_change()
RETURNS TRIGGER AS $$
DECLARE
  v_super_admin_id UUID;
BEGIN
  -- Retrieve the super admin ID
  SELECT id INTO v_super_admin_id FROM public.profiles WHERE role = 'super_admin' LIMIT 1;
  
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    -- Trigger notification when transitioning from draft -> submitted
    IF (NEW.is_draft = false AND (TG_OP = 'INSERT' OR OLD.is_draft = true OR OLD.status = 'Changes Requested')) THEN
      -- Notify assigned track admin
      IF (NEW.assigned_admin_id IS NOT NULL) THEN
        INSERT INTO public.activity_notifications (receiver_id, activity_id, title, message)
        VALUES (
          NEW.assigned_admin_id,
          NEW.id,
          'New Activity Submission',
          (SELECT full_name FROM public.profiles WHERE id = NEW.student_id) || ' submitted activity: ' || NEW.title
        );
      END IF;
      
      -- Notify Super Admin
      IF (v_super_admin_id IS NOT NULL AND v_super_admin_id != COALESCE(NEW.assigned_admin_id, gen_random_uuid())) THEN
        INSERT INTO public.activity_notifications (receiver_id, activity_id, title, message)
        VALUES (
          v_super_admin_id,
          NEW.id,
          'New Activity Submission (Super)',
          (SELECT full_name FROM public.profiles WHERE id = NEW.student_id) || ' submitted activity: ' || NEW.title
        );
      END IF;
    END IF;

    -- Trigger notification to student when status is changed by reviewer
    IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status AND NEW.status IN ('Approved', 'Rejected', 'Changes Requested')) THEN
      INSERT INTO public.activity_notifications (receiver_id, activity_id, title, message)
      VALUES (
        NEW.student_id,
        NEW.id,
        'Activity Status Update: ' || NEW.status,
        'Your activity "' || NEW.title || '" status has been updated to ' || NEW.status
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS notify_on_activity_change_trigger ON public.pending_work_activities;
CREATE TRIGGER notify_on_activity_change_trigger
AFTER INSERT OR UPDATE ON public.pending_work_activities
FOR EACH ROW EXECUTE FUNCTION public.notify_on_activity_change();

-- 3d. Auto-log comment activity log history & notify
CREATE OR REPLACE FUNCTION public.notify_on_comment()
RETURNS TRIGGER AS $$
DECLARE
  v_activity RECORD;
  v_super_admin_id UUID;
BEGIN
  SELECT * INTO v_activity FROM public.pending_work_activities WHERE id = NEW.activity_id;
  SELECT id INTO v_super_admin_id FROM public.profiles WHERE role = 'super_admin' LIMIT 1;
  
  -- Add comment to activity timeline log
  INSERT INTO public.activity_history (activity_id, action, performed_by, previous_status, new_status)
  VALUES (NEW.activity_id, 'Comment Added', NEW.sender_id, v_activity.status, v_activity.status);

  -- Notify based on comment sender role
  IF (NEW.sender_id = v_activity.student_id) THEN
    -- Student commented, notify assigned admin
    IF (v_activity.assigned_admin_id IS NOT NULL) THEN
      INSERT INTO public.activity_notifications (receiver_id, activity_id, title, message)
      VALUES (
        v_activity.assigned_admin_id,
        v_activity.id,
        'New Comment from Intern',
        (SELECT full_name FROM public.profiles WHERE id = NEW.sender_id) || ' commented on "' || v_activity.title || '"'
      );
    END IF;
    -- Student commented, notify super admin
    IF (v_super_admin_id IS NOT NULL AND v_super_admin_id != COALESCE(v_activity.assigned_admin_id, gen_random_uuid())) THEN
      INSERT INTO public.activity_notifications (receiver_id, activity_id, title, message)
      VALUES (
        v_super_admin_id,
        v_activity.id,
        'New Comment from Intern (Super)',
        (SELECT full_name FROM public.profiles WHERE id = NEW.sender_id) || ' commented on "' || v_activity.title || '"'
      );
    END IF;
  ELSE
    -- Admin/Super admin commented, notify student
    INSERT INTO public.activity_notifications (receiver_id, activity_id, title, message)
    VALUES (
      v_activity.student_id,
      v_activity.id,
      'New Comment from Admin',
      'An admin commented on your activity "' || v_activity.title || '"'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS notify_on_comment_trigger ON public.activity_comments;
CREATE TRIGGER notify_on_comment_trigger
AFTER INSERT ON public.activity_comments
FOR EACH ROW EXECUTE FUNCTION public.notify_on_comment();

-- -------------------------------------------------------------------------
-- STEP 4: ENABLE ROW LEVEL SECURITY (RLS) & GRANT ROLES
-- -------------------------------------------------------------------------
ALTER TABLE public.pending_work_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_notifications ENABLE ROW LEVEL SECURITY;

GRANT ALL ON public.pending_work_activities TO authenticated, service_role;
GRANT ALL ON public.activity_comments TO authenticated, service_role;
GRANT ALL ON public.activity_history TO authenticated, service_role;
GRANT ALL ON public.activity_notifications TO authenticated, service_role;

-- -------------------------------------------------------------------------
-- STEP 5: DEFINE RLS POLICIES (BYPASSING RECURSION VIA GET_USER_ROLE)
-- -------------------------------------------------------------------------

-- 5a. pending_work_activities Policies
DROP POLICY IF EXISTS "activities_select_policy" ON public.pending_work_activities;
CREATE POLICY "activities_select_policy" ON public.pending_work_activities
  FOR SELECT TO authenticated
  USING (
    student_id = auth.uid()
    OR public.get_user_role(auth.uid()) = 'super_admin'
    OR (
      public.get_user_role(auth.uid()) = 'admin'
      AND EXISTS (
        SELECT 1 FROM public.admin_problem_statements aps
        WHERE aps.admin_id = auth.uid()
          AND aps.is_active = true
          AND aps.problem_statement_id = pending_work_activities.problem_statement_id
      )
    )
  );

DROP POLICY IF EXISTS "activities_insert_policy" ON public.pending_work_activities;
CREATE POLICY "activities_insert_policy" ON public.pending_work_activities
  FOR INSERT TO authenticated
  WITH CHECK (
    student_id = auth.uid()
    OR public.get_user_role(auth.uid()) = 'super_admin'
  );

DROP POLICY IF EXISTS "activities_update_policy" ON public.pending_work_activities;
CREATE POLICY "activities_update_policy" ON public.pending_work_activities
  FOR UPDATE TO authenticated
  USING (
    (student_id = auth.uid() AND status != 'Approved')
    OR public.get_user_role(auth.uid()) = 'super_admin'
    OR (
      public.get_user_role(auth.uid()) = 'admin'
      AND EXISTS (
        SELECT 1 FROM public.admin_problem_statements aps
        WHERE aps.admin_id = auth.uid()
          AND aps.is_active = true
          AND aps.problem_statement_id = pending_work_activities.problem_statement_id
      )
    )
  )
  WITH CHECK (
    (student_id = auth.uid() AND status != 'Approved')
    OR public.get_user_role(auth.uid()) = 'super_admin'
    OR (
      public.get_user_role(auth.uid()) = 'admin'
      AND EXISTS (
        SELECT 1 FROM public.admin_problem_statements aps
        WHERE aps.admin_id = auth.uid()
          AND aps.is_active = true
          AND aps.problem_statement_id = pending_work_activities.problem_statement_id
      )
    )
  );

DROP POLICY IF EXISTS "activities_delete_policy" ON public.pending_work_activities;
CREATE POLICY "activities_delete_policy" ON public.pending_work_activities
  FOR DELETE TO authenticated
  USING (
    (student_id = auth.uid() AND status = 'Draft')
    OR public.get_user_role(auth.uid()) = 'super_admin'
  );

-- 5b. activity_comments Policies
DROP POLICY IF EXISTS "comments_select_policy" ON public.activity_comments;
CREATE POLICY "comments_select_policy" ON public.activity_comments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pending_work_activities a
      WHERE a.id = activity_comments.activity_id
        AND (
          a.student_id = auth.uid()
          OR public.get_user_role(auth.uid()) = 'super_admin'
          OR (
            public.get_user_role(auth.uid()) = 'admin'
            AND EXISTS (
              SELECT 1 FROM public.admin_problem_statements aps
              WHERE aps.admin_id = auth.uid()
                AND aps.is_active = true
                AND aps.problem_statement_id = a.problem_statement_id
            )
          )
        )
    )
  );

DROP POLICY IF EXISTS "comments_insert_policy" ON public.activity_comments;
CREATE POLICY "comments_insert_policy" ON public.activity_comments
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.pending_work_activities a
      WHERE a.id = activity_comments.activity_id
        AND (
          a.student_id = auth.uid()
          OR public.get_user_role(auth.uid()) = 'super_admin'
          OR (
            public.get_user_role(auth.uid()) = 'admin'
            AND EXISTS (
              SELECT 1 FROM public.admin_problem_statements aps
              WHERE aps.admin_id = auth.uid()
                AND aps.is_active = true
                AND aps.problem_statement_id = a.problem_statement_id
            )
          )
        )
    )
  );

-- 5c. activity_history Policies
DROP POLICY IF EXISTS "history_select_policy" ON public.activity_history;
CREATE POLICY "history_select_policy" ON public.activity_history
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pending_work_activities a
      WHERE a.id = activity_history.activity_id
        AND (
          a.student_id = auth.uid()
          OR public.get_user_role(auth.uid()) = 'super_admin'
          OR (
            public.get_user_role(auth.uid()) = 'admin'
            AND EXISTS (
              SELECT 1 FROM public.admin_problem_statements aps
              WHERE aps.admin_id = auth.uid()
                AND aps.is_active = true
                AND aps.problem_statement_id = a.problem_statement_id
            )
          )
        )
    )
  );

-- 5d. activity_notifications Policies
DROP POLICY IF EXISTS "notifications_select_policy" ON public.activity_notifications;
CREATE POLICY "notifications_select_policy" ON public.activity_notifications
  FOR SELECT TO authenticated
  USING (receiver_id = auth.uid());

DROP POLICY IF EXISTS "notifications_update_policy" ON public.activity_notifications;
CREATE POLICY "notifications_update_policy" ON public.activity_notifications
  FOR UPDATE TO authenticated
  USING (receiver_id = auth.uid())
  WITH CHECK (receiver_id = auth.uid());

-- -------------------------------------------------------------------------
-- STEP 6: CREATE STORAGE BUCKET FOR UPLOADS
-- -------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public) VALUES ('pending-work-files', 'pending-work-files', true) ON CONFLICT (id) DO NOTHING;

-- RLS policies for storage bucket
DROP POLICY IF EXISTS "Allow public select on pending-work-files" ON storage.objects;
CREATE POLICY "Allow public select on pending-work-files" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'pending-work-files');

DROP POLICY IF EXISTS "Allow authenticated upload to pending-work-files" ON storage.objects;
CREATE POLICY "Allow authenticated upload to pending-work-files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'pending-work-files');
