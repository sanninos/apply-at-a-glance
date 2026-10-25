import { createFileRoute, Link } from '@tanstack/react-router';
import { StatsScreen } from '@/components/stats-screen';

export const Route = createFileRoute('/estadisticas')({
  head: () => ({ meta: [
    { title: 'URUJOBS · Estadísticas del perfil' },
    { name: 'description', content: 'Consultá tus estadísticas en URUJOBS: postulaciones, ofertas guardadas y estado de tu curriculum.' },
    { property: 'og:title', content: 'URUJOBS · Estadísticas del perfil' },
    { property: 'og:description', content: 'Tus números en URUJOBS, calculados con datos de tu cuenta.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
  ] }),
  component: StatsScreen,
});
