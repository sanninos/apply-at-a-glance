import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { AccessPanel } from '@/components/access-panel';

export const Route = createFileRoute('/auth')({
  head: () => ({ meta: [
    { title: 'URUJOBS · Ingresar y registrarse' },
    { name: 'description', content: 'Ingresá o creá tu cuenta de URUJOBS para buscar empleo en Uruguay.' },
    { property: 'og:title', content: 'URUJOBS · Ingresar y registrarse' },
    { property: 'og:description', content: 'Accedé a tu cuenta de URUJOBS.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
  ] }),
  component: AccessScreen,
});
function AccessScreen() {
  const navigate = useNavigate();
  return <main className="access-screen">
    <AccessPanel onClose={() => navigate({ to: '/' })} />
  </main>;
}
