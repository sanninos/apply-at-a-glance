ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS busqueda_activa_hasta timestamptz;
DROP FUNCTION IF EXISTS public.empresa_candidatos();
CREATE FUNCTION public.empresa_candidatos()
 RETURNS TABLE(postulacion_id uuid, job_id bigint, titulo text, candidato text, estado text, created_at timestamptz, updated_at timestamptz, mensaje text, cv_snapshot jsonb, disponible boolean)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT p.id, j.id, j.titulo, COALESCE(pr.full_name, 'Candidato'), p.estado, p.created_at, p.updated_at, p.mensaje, p.cv_snapshot,
    COALESCE(pr.busqueda_activa_hasta > now(), false)
  FROM public.postulaciones p
  JOIN public."JobsDetails" j ON j.id = p.job_id
  JOIN public."Empresa" e ON e.id = j.empresa_id
  LEFT JOIN public.profiles pr ON pr.id = p.user_id
  WHERE e.owner_id = auth.uid()
  ORDER BY p.created_at DESC
$$;
REVOKE ALL ON FUNCTION public.empresa_candidatos() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.empresa_candidatos() TO authenticated;