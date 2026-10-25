-- Ampliar la lectura pública de JobsDetails a ofertas y llamados (columnas de exhibición ya concedidas; nunca campos de postulantes).
DROP POLICY IF EXISTS "jobs_public_offers" ON public."JobsDetails";
CREATE POLICY "jobs_public_offers"
  ON public."JobsDetails"
  FOR SELECT
  TO anon, authenticated
  USING (id IS NOT NULL);