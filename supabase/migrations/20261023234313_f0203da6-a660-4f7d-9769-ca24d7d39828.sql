CREATE TABLE public.profiles (
 id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 full_name text NOT NULL DEFAULT '',
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY profiles_read_own ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY profiles_update_own ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE FUNCTION public.validate_access_profile() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
 NEW.full_name := trim(NEW.full_name);
 IF length(NEW.full_name) > 100 THEN RAISE EXCEPTION 'El nombre debe tener como máximo 100 caracteres'; END IF;
 NEW.updated_at := now();
 RETURN NEW;
END;
$$;
CREATE TRIGGER access_profile_validation BEFORE INSERT OR UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.validate_access_profile();
CREATE FUNCTION public.create_access_profile() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 INSERT INTO public.profiles (id, full_name) VALUES (NEW.id, left(trim(coalesce(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '')), 100)) ON CONFLICT (id) DO NOTHING;
 RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.create_access_profile() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER create_access_profile_on_signup AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.create_access_profile();
INSERT INTO public.profiles (id, full_name) SELECT id, left(trim(coalesce(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', '')), 100) FROM auth.users ON CONFLICT (id) DO NOTHING;