-- Read-only regression checks: all six blockers must remain closed.
SELECT 'Empresa: access rules enabled and anonymous access blocked' AS rule,
  (SELECT relrowsecurity FROM pg_class WHERE oid='public."Empresa"'::regclass)
  AND NOT has_table_privilege('anon','public."Empresa"','SELECT,INSERT,UPDATE,DELETE,TRUNCATE') AS passed
UNION ALL
SELECT 'JobsDetails: display-only public reads, no applicant data or writes',
  (SELECT relrowsecurity FROM pg_class WHERE oid='public."JobsDetails"'::regclass)
  AND has_column_privilege('anon','public."JobsDetails"','titulo','SELECT')
  AND NOT has_column_privilege('anon','public."JobsDetails"','postulantes_cvs_ids','SELECT')
  AND NOT has_column_privilege('authenticated','public."JobsDetails"','postulantes_ids','SELECT')
  AND NOT has_table_privilege('authenticated','public."JobsDetails"','INSERT,UPDATE,DELETE,TRUNCATE')
UNION ALL
SELECT 'Usuario: access rules enabled, no anonymous read',
  (SELECT relrowsecurity FROM pg_class WHERE oid='public."Usuario"'::regclass)
  AND NOT has_table_privilege('anon','public."Usuario"','SELECT')
  AND EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='Usuario' AND cmd='SELECT' AND qual LIKE '%auth.uid()%')
UNION ALL
SELECT 'EntesPublicos: access rules enabled, no public writes',
  (SELECT relrowsecurity FROM pg_class WHERE oid='public."EntesPublicos"'::regclass)
  AND NOT has_table_privilege('anon','public."EntesPublicos"','INSERT,UPDATE,DELETE,TRUNCATE')
  AND NOT has_table_privilege('authenticated','public."EntesPublicos"','INSERT,UPDATE,DELETE,TRUNCATE')
UNION ALL
SELECT 'Usuario: unrestricted insert rule removed, account privileges not writable',
  NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='Usuario' AND cmd='INSERT' AND with_check='true')
  AND NOT has_column_privilege('authenticated','public."Usuario"','membresia_usuario','UPDATE')
  AND NOT has_table_privilege('authenticated','public."Usuario"','INSERT')
UNION ALL
SELECT 'visibility_settings: no anonymous or ordinary account access',
  NOT has_table_privilege('anon','public.visibility_settings','SELECT,INSERT,UPDATE,DELETE,TRUNCATE')
  AND NOT has_table_privilege('authenticated','public.visibility_settings','SELECT,INSERT,UPDATE,DELETE,TRUNCATE');