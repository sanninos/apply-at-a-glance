CREATE OR REPLACE FUNCTION public.empresa_candidatos()
RETURNS TABLE(postulacion_id uuid, job_id bigint, titulo text, candidato text, estado text, created_at timestamptz, updated_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, j.id, j.titulo, COALESCE(pr.full_name, 'Candidato'), p.estado, p.created_at, p.updated_at
  FROM public.postulaciones p
  JOIN public."JobsDetails" j ON j.id = p.job_id
  JOIN public."Empresa" e ON e.id = j.empresa_id
  LEFT JOIN public.profiles pr ON pr.id = p.user_id
  WHERE e.owner_id = auth.uid()
  ORDER BY p.created_at DESC
$$;
CREATE OR REPLACE FUNCTION public.empresa_cambiar_estado(_postulacion_id uuid, _estado text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF _estado NOT IN ('En revision','Entrevista','Seleccionada','No seleccionada') THEN RAISE EXCEPTION 'Estado inválido'; END IF;
  UPDATE public.postulaciones p SET estado = _estado
  FROM public."JobsDetails" j JOIN public."Empresa" e ON e.id = j.empresa_id
  WHERE p.id = _postulacion_id AND j.id = p.job_id AND e.owner_id = auth.uid();
  IF NOT FOUND THEN RAISE EXCEPTION 'No autorizado'; END IF;
END $$;
REVOKE ALL ON FUNCTION public.empresa_candidatos() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.empresa_cambiar_estado(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.empresa_candidatos() TO authenticated;
GRANT EXECUTE ON FUNCTION public.empresa_cambiar_estado(uuid, text) TO authenticated;