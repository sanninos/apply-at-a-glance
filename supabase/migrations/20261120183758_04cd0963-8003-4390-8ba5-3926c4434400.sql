ALTER FUNCTION public.trigger_scrape_si_falta() SET search_path = '';

DROP POLICY IF EXISTS "insert public" ON public.deletion_requests;
CREATE POLICY "Signed-in users request deletion of their own email"
ON public.deletion_requests FOR INSERT TO authenticated
WITH CHECK (
  lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  AND status = 'pending'
  AND processed_at IS NULL
  AND processed_by IS NULL
  AND (reason IS NULL OR length(reason) <= 1000)
);