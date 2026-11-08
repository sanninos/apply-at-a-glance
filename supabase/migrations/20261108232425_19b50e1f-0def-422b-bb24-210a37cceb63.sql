ALTER TABLE public.postulaciones ADD COLUMN IF NOT EXISTS mensaje text, ADD COLUMN IF NOT EXISTS cv_snapshot jsonb;
ALTER TABLE public.postulaciones ADD CONSTRAINT postulaciones_mensaje_len CHECK (mensaje IS NULL OR char_length(mensaje) <= 300);
DROP FUNCTION IF EXISTS public.empresa_candidatos();
CREATE FUNCTION public.empresa_candidatos()
RETURNS TABLE(postulacion_id uuid, job_id bigint, titulo text, candidato text, estado text, created_at timestamptz, updated_at timestamptz, mensaje text, cv_snapshot jsonb)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, j.id, j.titulo, COALESCE(pr.full_name, 'Candidato'), p.estado, p.created_at, p.updated_at, p.mensaje, p.cv_snapshot
  FROM public.postulaciones p
  JOIN public."JobsDetails" j ON j.id = p.job_id
  JOIN public."Empresa" e ON e.id = j.empresa_id
  LEFT JOIN public.profiles pr ON pr.id = p.user_id
  WHERE e.owner_id = auth.uid()
  ORDER BY p.created_at DESC
$$;
REVOKE ALL ON FUNCTION public.empresa_candidatos() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.empresa_candidatos() TO authenticated;