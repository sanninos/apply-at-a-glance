GRANT INSERT (nombre, descripcion, sector, rut, email, telefono, sitio_web, direccion, ciudad, departamento, pais, imagen, "cantidadEmpleados", owner_id), UPDATE (nombre, descripcion, sector, rut, email, telefono, sitio_web, direccion, ciudad, departamento, pais, imagen, "cantidadEmpleados") ON public."Empresa" TO authenticated;
GRANT SELECT (id, nombre, descripcion, sector, rut, email, telefono, sitio_web, direccion, ciudad, departamento, pais, imagen, "cantidadEmpleados", owner_id) ON public."Empresa" TO authenticated;
CREATE UNIQUE INDEX IF NOT EXISTS empresa_owner_unique ON public."Empresa"(owner_id) WHERE owner_id IS NOT NULL;
CREATE POLICY empresa_insert_own ON public."Empresa" FOR INSERT TO authenticated WITH CHECK (owner_id = (SELECT auth.uid()));
CREATE POLICY empresa_update_own ON public."Empresa" FOR UPDATE TO authenticated USING (owner_id = (SELECT auth.uid())) WITH CHECK (owner_id = (SELECT auth.uid()));
GRANT INSERT (titulo, descripcion, "Empresa", ubicacion, ciudad, jornada, "tipoContrato", salario, requisitos, puesto, "fotoEmpresa", empresa_id, "isLlamado", estado_postulacion),
  UPDATE (titulo, descripcion, "Empresa", ubicacion, ciudad, jornada, "tipoContrato", salario, requisitos, puesto, "fotoEmpresa", estado_postulacion),
  DELETE ON public."JobsDetails" TO authenticated;
GRANT SELECT (empresa_id) ON public."JobsDetails" TO authenticated;
CREATE OR REPLACE FUNCTION public.owns_empresa(_empresa_id bigint) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public."Empresa" WHERE id = _empresa_id AND owner_id = auth.uid())
$$;
REVOKE ALL ON FUNCTION public.owns_empresa(bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.owns_empresa(bigint) TO authenticated;
CREATE POLICY jobs_owner_insert ON public."JobsDetails" FOR INSERT TO authenticated WITH CHECK ("isLlamado" = false AND public.owns_empresa(empresa_id));
CREATE POLICY jobs_owner_update ON public."JobsDetails" FOR UPDATE TO authenticated USING (public.owns_empresa(empresa_id)) WITH CHECK (public.owns_empresa(empresa_id));
CREATE POLICY jobs_owner_delete ON public."JobsDetails" FOR DELETE TO authenticated USING (public.owns_empresa(empresa_id));