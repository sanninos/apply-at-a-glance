import { createFileRoute } from '@tanstack/react-router';
import { SavedOffersScreen } from '@/components/saved-offers-screen';

export const Route = createFileRoute('/ofertas-guardadas')({
  head: () => ({ meta: [
    { title: 'URUJOBS · Ofertas guardadas' },
    { name: 'description', content: 'Consultá tus ofertas de empleo guardadas en tu cuenta de URUJOBS.' },
    { property: 'og:title', content: 'URUJOBS · Ofertas guardadas' },
    { property: 'og:description', content: 'Tus ofertas favoritas, conservadas en tu cuenta. Solo vos las ves.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
  ] }),
  component: SavedOffersScreen,
});