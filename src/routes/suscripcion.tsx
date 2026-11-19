import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowLeft, Crown, ExternalLink, RefreshCw, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppBottomNav } from '@/components/app-bottom-nav';
import { useAccess } from '@/components/access-provider';
import { useAccessDialog } from '@/components/access-dialog';

export const Route = createFileRoute('/suscripcion')({
  head: () => ({ meta: [
    { title: 'URUJOBS · Mi suscripción' },
    { name: 'description', content: 'Consultá tu plan, restaurá compras y gestioná o cancelá tu suscripción URUJOBS PRO.' },
    { property: 'og:title', content: 'URUJOBS · Mi suscripción' },
    { property: 'og:description', content: 'Gestioná tu suscripción URUJOBS PRO desde Google Play.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
  ] }),
  component: SubscriptionScreen,
});

const PLAY_SUBSCRIPTIONS_URL = 'https://play.google.com/store/account/subscriptions';

function SubscriptionScreen() {
  const { user, ready } = useAccess();
  const { open: openAccess } = useAccessDialog();
  return <main className="profile-screen">
    <Link to="/perfil" className="inline-flex items-center gap-2 text-sm font-semibold"><ArrowLeft className="size-4" />Volver al perfil</Link>
    <h1 className="mt-3 text-2xl font-bold">Mi suscripción</h1>
    {!user ? <section className="profile-block">
      <p>{ready ? 'Ingresá para ver y gestionar tu suscripción.' : 'Cargando tu cuenta…'}</p>
      {ready && <Button className="mt-3" onClick={openAccess}>Ingresar o registrarse</Button>}
    </section> : <>
      <section className="profile-block">
        <header className="profile-heading"><h2>PLAN ACTUAL</h2><p>Estado de tu suscripción</p></header>
        <div className="flex items-center gap-3">
          <span className="profile-icon-tile"><Crown /></span>
          <div><strong>Plan gratuito</strong><p className="text-sm text-muted-foreground">No tenés una suscripción PRO activa.</p></div>
        </div>
      </section>
      <section className="profile-block">
        <header className="profile-heading"><h2>GESTIONAR</h2><p>Compras realizadas en Google Play</p></header>
        <div className="flex flex-col gap-2">
          <Button disabled title="Próximamente"><Crown />Obtener PRO · Próximamente</Button>
          <Button variant="outline" disabled title="Próximamente"><RefreshCw />Restaurar compras · Próximamente</Button>
          <Button variant="outline" asChild><a href={PLAY_SUBSCRIPTIONS_URL} target="_blank" rel="noreferrer"><ExternalLink />Gestionar o cancelar en Google Play</a></Button>
        </div>
      </section>
      <section className="profile-block">
        <header className="profile-heading"><h2>INFORMACIÓN</h2><p>Condiciones de la suscripción</p></header>
        <ul className="flex list-disc flex-col gap-2 pl-5 text-sm text-muted-foreground">
          <li>El pago se cobra a tu cuenta de Google Play al confirmar la compra.</li>
          <li>La suscripción se renueva automáticamente salvo que la canceles al menos 24 horas antes del fin del período.</li>
          <li>Podés cancelar en cualquier momento desde Google Play; conservás las ventajas hasta el final del período pagado.</li>
          <li>Los reembolsos se gestionan según las políticas de Google Play.</li>
        </ul>
        <p className="mt-3 flex items-center gap-2 text-sm"><ShieldCheck className="size-4" />Urujobs no almacena los datos de tu tarjeta.</p>
      </section>
    </>}
    <AppBottomNav active="perfil" />
  </main>;
}
