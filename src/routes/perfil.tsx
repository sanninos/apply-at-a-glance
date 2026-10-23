import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { UserCircle, Megaphone, Bell, UsersRound, ListPen, ChartNoAxesColumnIncreasing, LogOut, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { AppBottomNav } from '@/components/app-bottom-nav';
import { useAccess } from '@/components/access-provider';
import { supabase } from '@/integrations/supabase/client';

export const Route = createFileRoute('/perfil')({
  head: () => ({ meta: [
    { title: 'URUJOBS · Mi perfil' },
    { name: 'description', content: 'Tu cuenta, comunicaciones y accesos personales en URUJOBS.' },
    { property: 'og:title', content: 'URUJOBS · Mi perfil' },
    { property: 'og:description', content: 'Consultá tu cuenta y tus accesos personales en URUJOBS.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
  ] }),
  component: ProfileScreen,
});

function ProfileBlock({ title, subtitle, children, className = '' }: { title: string; subtitle: string; children: ReactNode; className?: string }) {
  return <section className={`profile-block ${className}`}>
    <header className="profile-heading"><h2>{title}</h2><p>{subtitle}</p></header>
    {children}
  </section>;
}

function ProfileScreen() {
  const { user, ready } = useAccess();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const profile = useQuery({
    queryKey: ['access-profile', user?.id],
    enabled: ready && Boolean(user),
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
      if (error) throw error;
      return data;
    },
  });
  async function signOut() {
    setBusy(true); setError('');
    await queryClient.cancelQueries();
    queryClient.clear();
    const { error } = await supabase.auth.signOut();
    setBusy(false);
    if (error) { setError('No pudimos cerrar tu sesión. Intentá nuevamente.'); return; }
    void navigate({ to: '/auth', replace: true });
  }
  const fullName = profile.data?.full_name;
  return <main className="profile-screen">
    <h1 className="sr-only">Mi perfil</h1>
    <ProfileBlock title="CUENTA" subtitle="Datos de tu sesión en Urujobs">
      <div className="profile-account-row">
        <span className="profile-icon-tile"><UserCircle /></span>
        <div className="profile-account-copy">
          {user ? <>{fullName && <strong>{fullName}</strong>}<span className="profile-email">{user.email}</span><p>Sesión iniciada</p></> : <><strong>{ready ? 'Tu cuenta Urujobs' : 'Cargando tu cuenta…'}</strong><p>{ready ? 'Sin sesión iniciada' : ' '}</p></>}
        </div>
      </div>
      {profile.isError && <p className="profile-error" role="alert">No pudimos cargar el nombre de tu perfil.</p>}
      {!user && ready && <Button asChild variant="outline" className="profile-login"><Link to="/auth">Ingresar o registrarse<ChevronRight /></Link></Button>}
    </ProfileBlock>
    <ProfileBlock title="CONSENTIMIENTOS" subtitle="Gestiona tus comunicaciones">
      <div className="profile-consent-row">
        <span className="profile-icon-tile"><Megaphone /></span>
        <div className="profile-consent-copy"><h3>Comunicaciones Urujobs Avisos</h3><p>Recibe emails y push educativos o comerciales. Puedes retirarlo en cualquier momento.</p><span className="profile-pending">Pendiente de configuración</span></div>
        <Switch className="profile-switch" aria-label="Comunicaciones Urujobs Avisos" checked={false} disabled title="Pendiente de configuración" />
      </div>
    </ProfileBlock>
    <ProfileBlock title="ACCESOS" subtitle="Acciones de tu cuenta" className="profile-access-block">
      <div className="profile-access-list">
        {[{ label: 'Mis notificaciones', icon: Bell }, { label: 'Tus postulaciones', icon: UsersRound }, { label: 'Edita tu curriculum', icon: ListPen }, { label: 'Visitas a tu perfil', icon: ChartNoAxesColumnIncreasing }].map(({ label, icon: Icon }) => <Button key={label} variant="outline" disabled className="profile-access-row" title={`${label}: próximamente`}><Icon /><span>{label}</span><small>Próximamente</small></Button>)}
      </div>
    </ProfileBlock>
    {user && <Button variant="ghost" className="profile-signout" disabled={busy} onClick={signOut}><LogOut />{busy ? 'Cerrando sesión…' : 'Cerrar sesión'}</Button>}
    {error && <p className="profile-error" role="alert">{error}</p>}
    <AppBottomNav active="perfil" />
  </main>;
}