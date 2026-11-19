import { createFileRoute } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { markRadarSeen, radarQuery } from '@/lib/radar-badge';
import { RadarScreen } from '@/components/radar-screen';
import { NavigationLoading } from '@/components/navigation-loading';

export const Route = createFileRoute('/radar')({
  validateSearch: (search: Record<string, unknown>) => ({ q: typeof search['q'] === 'string' ? search['q'] : '' }),
  head: () => ({ meta: [
    { title: 'EmpleosUy · Radar de empleos' },
    { name: 'description', content: 'Explorá en el mapa las ofertas de trabajo con ubicación en Uruguay.' },
    { property: 'og:title', content: 'EmpleosUy · Radar de empleos' },
    { property: 'og:description', content: 'Encontrá ofertas laborales en el mapa y consultá sus detalles.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
  ] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(radarQuery),
  pendingMs: 100,
  pendingMinMs: 0,
  pendingComponent: () => <NavigationLoading active="radar" />,
  component: RadarPage,
  errorComponent: () => <div className="employment-empty">No pudimos cargar las ofertas del Radar. Intentá nuevamente.</div>,
  notFoundComponent: () => <div className="employment-empty">Radar no disponible.</div>,
});
function RadarPage() {
  const { data } = useSuspenseQuery(radarQuery);
  useEffect(() => { markRadarSeen(data.map((j) => String(j.id))); }, [data]);
  const { q } = Route.useSearch();
  const navigate = Route.useNavigate();
  return <RadarScreen jobs={data} search={q} onSearch={(value) => { void navigate({ search: { q: value }, replace: true }); }} />;
}