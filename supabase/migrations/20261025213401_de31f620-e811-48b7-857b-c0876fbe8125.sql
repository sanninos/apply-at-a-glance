CREATE TABLE public.anuncios_home (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo text NOT NULL,
  imagen_url text NOT NULL,
  enlace_url text,
  activo boolean NOT NULL DEFAULT false,
  orden integer NOT NULL DEFAULT 0,
  fecha_inicio timestamptz,
  fecha_fin timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT (id, titulo, imagen_url, enlace_url, orden, fecha_inicio, fecha_fin, activo) ON public.anuncios_home TO anon, authenticated;
GRANT ALL ON public.anuncios_home TO service_role;
ALTER TABLE public.anuncios_home ENABLE ROW LEVEL SECURITY;
CREATE POLICY anuncios_home_public_active ON public.anuncios_home FOR SELECT TO anon, authenticated
  USING (activo = true AND (fecha_inicio IS NULL OR fecha_inicio <= now()) AND (fecha_fin IS NULL OR fecha_fin > now()));
CREATE TRIGGER anuncios_home_updated_at BEFORE UPDATE ON public.anuncios_home FOR EACH ROW EXECUTE FUNCTION public.set_timestamp_updated_at();