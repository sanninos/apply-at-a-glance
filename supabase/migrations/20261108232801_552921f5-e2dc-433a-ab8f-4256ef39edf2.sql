REVOKE ALL ON FUNCTION public.empresa_candidatos() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.empresa_cambiar_estado(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.empresa_candidatos() TO authenticated;
GRANT EXECUTE ON FUNCTION public.empresa_cambiar_estado(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.postulaciones_guard_estado()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  -- Applicants (direct client writes) cannot change the company-controlled state.
  IF current_user = 'authenticated' THEN
    IF TG_OP = 'INSERT' THEN NEW.estado := 'Enviada';
    ELSE NEW.estado := OLD.estado; NEW.user_id := OLD.user_id; NEW.job_id := OLD.job_id;
    END IF;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS postulaciones_guard_estado ON public.postulaciones;
CREATE TRIGGER postulaciones_guard_estado BEFORE INSERT OR UPDATE ON public.postulaciones
FOR EACH ROW EXECUTE FUNCTION public.postulaciones_guard_estado();