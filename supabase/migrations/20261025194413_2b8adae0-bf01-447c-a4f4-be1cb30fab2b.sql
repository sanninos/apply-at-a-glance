ALTER TABLE public."Empresa" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."EntesPublicos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."JobsDetails" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Usuario" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura autenticada" ON public."JobsDetails";
DROP POLICY IF EXISTS "Sin update directo" ON public."JobsDetails";
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public."Usuario";
DROP POLICY IF EXISTS "Policy to implement Time To Live (TTL)" ON public."Usuario";
DROP POLICY IF EXISTS visibility_settings_select_all ON public.visibility_settings;
DROP POLICY IF EXISTS visibility_settings_insert_all ON public.visibility_settings;
DROP POLICY IF EXISTS visibility_settings_update_all ON public.visibility_settings;
DROP POLICY IF EXISTS visibility_settings_delete_all ON public.visibility_settings;

-- Remove legacy table AND column grants, including TRUNCATE which bypasses RLS.
DO $$
DECLARE t text; cols text;
BEGIN
 FOREACH t IN ARRAY ARRAY['Empresa','EntesPublicos','JobsDetails','Usuario','visibility_settings'] LOOP
  EXECUTE format('REVOKE ALL PRIVILEGES ON TABLE public.%I FROM PUBLIC, anon, authenticated', t);
  SELECT string_agg(format('%I', column_name), ', ') INTO cols FROM information_schema.columns WHERE table_schema='public' AND table_name=t;
  EXECUTE format('REVOKE SELECT (%s), INSERT (%s), UPDATE (%s), REFERENCES (%s) ON public.%I FROM PUBLIC, anon, authenticated', cols, cols, cols, cols, t);
  EXECUTE format('GRANT ALL ON TABLE public.%I TO service_role', t);
 END LOOP;
END $$;

GRANT SELECT ON public."Usuario" TO authenticated;
CREATE POLICY usuario_read_own ON public."Usuario" FOR SELECT TO authenticated
 USING (coalesce(auth_id, user_id) = (SELECT auth.uid()));
-- No client write grants: membership, identity and account type cannot be self-escalated.
GRANT SELECT ON public."Empresa" TO authenticated;
CREATE POLICY empresa_read_own ON public."Empresa" FOR SELECT TO authenticated
 USING (owner_id = (SELECT auth.uid()));

GRANT SELECT (id, "Inciso", imagen, created_at) ON public."EntesPublicos" TO anon, authenticated;
CREATE POLICY entes_public_display ON public."EntesPublicos" FOR SELECT TO anon, authenticated USING (id IS NOT NULL);

GRANT SELECT (id, titulo, descripcion, "Empresa", "Inciso", "UnidadEjecutora", ubicacion, ciudad, jornada, "tipoContrato", salario, "llamadoFechaInicio", "llamadoFechaCierre", "cantidadCupos", requisitos, empleabilidad, "fotoEmpresa", image, categoria, puesto, estado_postulacion, "isLlamado", created_at, "isFeatured", poster, "latLong") ON public."JobsDetails" TO anon, authenticated;
CREATE POLICY jobs_public_offers ON public."JobsDetails" FOR SELECT TO anon, authenticated USING ("isLlamado" = false);

ALTER TABLE public.visibility_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY visibility_no_client_access ON public.visibility_settings FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

-- These unused legacy privileged functions must not bypass the new protections.
REVOKE EXECUTE ON FUNCTION public.postular_cv(bigint,text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
ALTER FUNCTION public.postular_cv(bigint,text) SET search_path = '';
ALTER FUNCTION public.actualizar_timestamp() SET search_path = '';
ALTER FUNCTION public.set_timestamp_updated_at() SET search_path = '';

DO $$
DECLARE r text; t text;
BEGIN
 FOREACH r IN ARRAY ARRAY['anon','authenticated'] LOOP
  FOREACH t IN ARRAY ARRAY['Empresa','EntesPublicos','JobsDetails','Usuario','visibility_settings'] LOOP
   IF has_table_privilege(r,format('public.%I',t),'INSERT') OR has_table_privilege(r,format('public.%I',t),'UPDATE') OR has_table_privilege(r,format('public.%I',t),'DELETE') OR has_table_privilege(r,format('public.%I',t),'TRUNCATE') THEN RAISE EXCEPTION 'Unexpected write privilege: % %',r,t; END IF;
  END LOOP;
  IF has_column_privilege(r,'public."JobsDetails"','postulantes_ids','SELECT') OR has_column_privilege(r,'public."JobsDetails"','postulantes_cvs_ids','SELECT') OR has_column_privilege(r,'public."JobsDetails"','email_postulacion','SELECT') THEN RAISE EXCEPTION 'Applicant data exposed to %',r; END IF;
  IF NOT has_column_privilege(r,'public."JobsDetails"','titulo','SELECT') THEN RAISE EXCEPTION 'Public offer access missing: %',r; END IF;
 END LOOP;
 IF has_table_privilege('anon','public."Usuario"','SELECT') OR has_table_privilege('authenticated','public.visibility_settings','SELECT') THEN RAISE EXCEPTION 'Private table exposed'; END IF;
END $$;