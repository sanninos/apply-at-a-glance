import { createFileRoute } from '@tanstack/react-router';
import { CurriculumScreen } from '@/components/curriculum-screen';

export const Route = createFileRoute('/editar-curriculum')({
  head: () => ({ meta: [
    { title: 'URUJOBS · Editar curriculum' },
    { name: 'description', content: 'Editá tu curriculum en URUJOBS: datos personales, resumen, experiencia, educación y habilidades.' },
    { property: 'og:title', content: 'URUJOBS · Editar curriculum' },
    { property: 'og:description', content: 'Arma y guarda tu curriculum en tu cuenta de URUJOBS.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
  ] }),
  component: CurriculumScreen,
});
