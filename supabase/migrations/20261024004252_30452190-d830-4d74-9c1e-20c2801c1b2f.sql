CREATE TABLE public.postulaciones (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id bigint NOT NULL REFERENCES public."JobsDetails"(id) ON DELETE CASCADE,
  estado text NOT NULL DEFAULT 'Enviada' CHECK (estado IN ('Enviada','En revision','Entrevista','No seleccionada')),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE (user_id, job_id)
);

CREATE INDEX postulaciones_user_created_idx ON public.postulaciones (user_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.postulaciones TO authenticated;
GRANT ALL ON public.postulaciones TO service_role;

ALTER TABLE public.postulaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "postulaciones_select_own" ON public.postulaciones
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "postulaciones_insert_own" ON public.postulaciones
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "postulaciones_update_own" ON public.postulaciones
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "postulaciones_delete_own" ON public.postulaciones
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_postulaciones_updated_at
  BEFORE UPDATE ON public.postulaciones
  FOR EACH ROW EXECUTE FUNCTION public.set_timestamp_updated_at();