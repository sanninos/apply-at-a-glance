CREATE TABLE public.curriculums (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  phone text,
  summary text,
  experiences jsonb NOT NULL DEFAULT '[]'::jsonb,
  education jsonb NOT NULL DEFAULT '[]'::jsonb,
  skills jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_curriculums_user ON public.curriculums(user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.curriculums TO authenticated;
GRANT ALL ON public.curriculums TO service_role;

ALTER TABLE public.curriculums ENABLE ROW LEVEL SECURITY;

CREATE POLICY "curriculum_read_own" ON public.curriculums FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "curriculum_insert_own" ON public.curriculums FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "curriculum_update_own" ON public.curriculums FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "curriculum_delete_own" ON public.curriculums FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TRIGGER set_curriculums_updated_at BEFORE UPDATE ON public.curriculums
FOR EACH ROW EXECUTE FUNCTION public.set_timestamp_updated_at();