CREATE TABLE public.account_deletion_requests (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
 full_name text NOT NULL CHECK (char_length(btrim(full_name)) BETWEEN 1 AND 100),
 email text NOT NULL CHECK (char_length(email) BETWEEN 3 AND 255 AND email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
 reason text NOT NULL DEFAULT '' CHECK (char_length(reason) <= 1000),
 confirmed boolean NOT NULL CHECK (confirmed = true),
 status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed')),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.account_deletion_requests TO authenticated;
GRANT INSERT (user_id, full_name, email, reason, confirmed) ON public.account_deletion_requests TO authenticated;
GRANT ALL ON public.account_deletion_requests TO service_role;
ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY deletion_request_read_own ON public.account_deletion_requests FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY deletion_request_create_own ON public.account_deletion_requests FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND status = 'pending' AND confirmed = true AND lower(email) = lower(auth.jwt()->>'email'));
CREATE TRIGGER deletion_request_updated_at BEFORE UPDATE ON public.account_deletion_requests FOR EACH ROW EXECUTE FUNCTION public.set_timestamp_updated_at();