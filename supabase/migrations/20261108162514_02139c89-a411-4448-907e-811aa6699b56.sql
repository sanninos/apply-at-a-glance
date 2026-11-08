CREATE TABLE public.postulaciones_historial (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  postulacion_id uuid NOT NULL REFERENCES public.postulaciones(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id bigint NOT NULL,
  estado text NOT NULL,
  changed_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX postulaciones_historial_post_idx ON public.postulaciones_historial(postulacion_id, changed_at);
GRANT SELECT ON public.postulaciones_historial TO authenticated;
GRANT ALL ON public.postulaciones_historial TO service_role;
ALTER TABLE public.postulaciones_historial ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own application history" ON public.postulaciones_historial
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.log_postulacion_estado()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' OR NEW.estado IS DISTINCT FROM OLD.estado THEN
    INSERT INTO public.postulaciones_historial(postulacion_id, user_id, job_id, estado, changed_at)
    VALUES (NEW.id, NEW.user_id, NEW.job_id, NEW.estado, now());
  END IF;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.log_postulacion_estado() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER postulaciones_log_estado AFTER INSERT OR UPDATE OF estado ON public.postulaciones
  FOR EACH ROW EXECUTE FUNCTION public.log_postulacion_estado();

INSERT INTO public.postulaciones_historial(postulacion_id, user_id, job_id, estado, changed_at)
SELECT id, user_id, job_id, estado, CASE WHEN estado = 'Enviada' THEN created_at ELSE updated_at END FROM public.postulaciones;