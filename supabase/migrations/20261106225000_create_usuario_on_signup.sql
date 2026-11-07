CREATE OR REPLACE FUNCTION public.create_usuario_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  display_name text;
  usuario_email text;
BEGIN
  display_name := left(trim(coalesce(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    ''
  )), 100);
  usuario_email := coalesce(
    nullif(trim(NEW.email), ''),
    nullif(trim(NEW.raw_user_meta_data->>'email'), ''),
    ''
  );
  IF usuario_email = '' THEN
    RETURN NEW;
  END IF;

  UPDATE public."Usuario"
  SET auth_id = NEW.id,
      user_id = coalesce(user_id, NEW.id),
      nombre = coalesce(nombre, nullif(display_name, ''))
  WHERE lower(email) = lower(usuario_email)
    AND NOT EXISTS (
      SELECT 1
      FROM public."Usuario" linked
      WHERE linked.auth_id = NEW.id OR linked.user_id = NEW.id
    );

  IF EXISTS (
    SELECT 1
    FROM public."Usuario"
    WHERE auth_id = NEW.id OR user_id = NEW.id
  ) THEN
    RETURN NEW;
  END IF;

  INSERT INTO public."Usuario" (
    auth_id,
    user_id,
    email,
    nombre,
    activo
  )
  SELECT
    NEW.id,
    NEW.id,
    usuario_email,
    nullif(display_name, ''),
    true
  WHERE NOT EXISTS (
    SELECT 1
    FROM public."Usuario" usuario
    WHERE usuario.auth_id = NEW.id
       OR usuario.user_id = NEW.id
  )
  AND NOT EXISTS (
    SELECT 1
    FROM public."Usuario" usuario
    WHERE lower(usuario.email) = lower(usuario_email)
  );

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.create_usuario_profile() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS create_usuario_profile_on_signup ON auth.users;
CREATE TRIGGER create_usuario_profile_on_signup
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.create_usuario_profile();

UPDATE public."Usuario" usuario
SET auth_id = auth_user.id,
    user_id = coalesce(usuario.user_id, auth_user.id),
    nombre = coalesce(
      usuario.nombre,
      nullif(left(trim(coalesce(
        auth_user.raw_user_meta_data->>'full_name',
        auth_user.raw_user_meta_data->>'name',
        ''
      )), 100), '')
    )
FROM auth.users auth_user
WHERE lower(usuario.email) = lower(coalesce(
  nullif(trim(auth_user.email), ''),
  nullif(trim(auth_user.raw_user_meta_data->>'email'), '')
))
AND NOT EXISTS (
  SELECT 1
  FROM public."Usuario" linked
  WHERE linked.auth_id = auth_user.id OR linked.user_id = auth_user.id
);

INSERT INTO public."Usuario" (auth_id, user_id, email, nombre, activo)
SELECT
  auth_user.id,
  auth_user.id,
  coalesce(
    nullif(trim(auth_user.email), ''),
    nullif(trim(auth_user.raw_user_meta_data->>'email'), ''),
    ''
  ),
  nullif(left(trim(coalesce(
    auth_user.raw_user_meta_data->>'full_name',
    auth_user.raw_user_meta_data->>'name',
    ''
  )), 100), ''),
  true
FROM auth.users auth_user
WHERE NOT EXISTS (
  SELECT 1
  FROM public."Usuario" usuario
  WHERE usuario.auth_id = auth_user.id
     OR usuario.user_id = auth_user.id
)
AND NOT EXISTS (
  SELECT 1
  FROM public."Usuario" usuario
  WHERE lower(usuario.email) = lower(coalesce(
    nullif(trim(auth_user.email), ''),
    nullif(trim(auth_user.raw_user_meta_data->>'email'), '')
  ))
)
AND coalesce(nullif(trim(auth_user.email), ''), nullif(trim(auth_user.raw_user_meta_data->>'email'), '')) IS NOT NULL;
