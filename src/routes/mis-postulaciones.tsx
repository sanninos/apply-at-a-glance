import { createFileRoute } from '@tanstack/react-router';
import { ApplicationsScreen } from '@/components/applications-screen';

export const Route = createFileRoute('/mis-postulaciones')({
  head: () => ({ meta: [
    { title: 'URUJOBS · Mis postulaciones' },
    { name: 'description', content: 'Consultá las ofertas a las que te postulaste en URUJOBS y cómo va cada una.' },
    { property: 'og:title', content: 'URUJOBS · Mis postulaciones' },
    { property: 'og:description', content: 'Tus postulaciones enviadas, con su estado. Solo vos las ves.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
  ] }),
  component: ApplicationsScreen,
});
