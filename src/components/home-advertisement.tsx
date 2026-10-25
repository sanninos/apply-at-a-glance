import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

type HomeAd = { id: string; titulo: string; imagen_url: string; enlace_url: string | null };

async function fetchHomeAd(): Promise<HomeAd | null> {
  // RLS only returns active ads inside their date window.
  const { data, error } = await (supabase as any)
    .from('anuncios_home')
    .select('id, titulo, imagen_url, enlace_url')
    .order('orden', { ascending: true })
    .limit(1);
  if (error) return null;
  return (data?.[0] as HomeAd | undefined) ?? null;
}

/** Shows the first active ad from anuncios_home; hidden when none is active. */
export function HomeAdvertisement() {
  const { data: ad } = useQuery({ queryKey: ['home-ad'], queryFn: fetchHomeAd, staleTime: 60_000 });
  if (!ad) return null;
  const image = <img src={ad.imagen_url} alt={ad.titulo} />;
  return <aside className="home-advertisement" aria-label="Publicidad">
    <span className="home-advertisement-label">Publicidad</span>
    <div className="home-advertisement-content">
      {ad.enlace_url ? <a href={ad.enlace_url} target="_blank" rel="noopener noreferrer">{image}</a> : image}
    </div>
  </aside>;
}
