CREATE TABLE public.push_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE CHECK (char_length(token) BETWEEN 20 AND 4096),
  platform text NOT NULL DEFAULT 'android' CHECK (platform IN ('android','web','ios')),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX push_tokens_user_idx ON public.push_tokens(user_id);
GRANT SELECT ON public.push_tokens TO authenticated;
GRANT ALL ON public.push_tokens TO service_role;
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY push_tokens_read_own ON public.push_tokens FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE TRIGGER push_tokens_updated_at BEFORE UPDATE ON public.push_tokens FOR EACH ROW EXECUTE FUNCTION public.set_timestamp_updated_at();