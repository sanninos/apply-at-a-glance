CREATE TABLE public.ofertas_guardadas (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL,
 job_id bigint NOT NULL REFERENCES public."JobsDetails"(id) ON DELETE CASCADE,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(user_id, job_id)
);
GRANT SELECT, INSERT, DELETE ON public.ofertas_guardadas TO authenticated;
GRANT ALL ON public.ofertas_guardadas TO service_role;
ALTER TABLE public.ofertas_guardadas ENABLE ROW LEVEL SECURITY;
CREATE POLICY guardadas_read_own ON public.ofertas_guardadas FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY guardadas_insert_own ON public.ofertas_guardadas FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY guardadas_delete_own ON public.ofertas_guardadas FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE INDEX ofertas_guardadas_user_date ON public.ofertas_guardadas(user_id, created_at DESC);
CREATE TRIGGER ofertas_guardadas_updated_at BEFORE UPDATE ON public.ofertas_guardadas FOR EACH ROW EXECUTE FUNCTION public.set_timestamp_updated_at();