import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { UserCircle, Megaphone, Bell, UsersRound, ListTodo, ChartNoAxesColumnIncreasing, LogOut, ChevronRight, Download, Trash2, GraduationCap, Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { AppBottomNav } from '@/components/app-bottom-nav';
import { useAccess } from '@/components/access-provider';
import { useAccessDialog } from '@/components/access-dialog';
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
  const { open: openAccess } = useAccessDialog();
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
      {!user && ready && <Button variant="outline" className="profile-login" onClick={openAccess}>Ingresar o registrarse<ChevronRight /></Button>}
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
        <Link to="/alertas" className="profile-access-row"><Bell /><span>Mis notificaciones</span><ChevronRight className="profile-access-arrow" /></Link>
        <Link to="/mis-postulaciones" className="profile-access-row"><UsersRound /><span>Tus postulaciones</span><ChevronRight className="profile-access-arrow" /></Link>
        <Link to="/ofertas-guardadas" className="profile-access-row"><Bookmark /><span>Ofertas guardadas</span><ChevronRight className="profile-access-arrow" /></Link>
        <Link to="/editar-curriculum" className="profile-access-row"><ListTodo /><span>Edita tu curriculum</span><ChevronRight className="profile-access-arrow" /></Link>
        <Button variant="outline" disabled className="profile-access-row" title="Visitas a tu perfil: próximamente"><ChartNoAxesColumnIncreasing /><span>Visitas a tu perfil</span><small>Próximamente</small></Button>
      </div>
    </ProfileBlock>
    <ProfileBlock title="DATOS DE TU CUENTA" subtitle="GDPR · privacidad y portabilidad">
      <div className="profile-data-list">
        <Button variant="ghost" className="profile-data-row" disabled title="Exportar mis datos: próximamente">
          <span className="profile-icon-tile"><Download /></span>
          <span className="profile-data-copy"><strong>Exportar mis datos</strong><span>Descarga un JSON con tu perfil, convocatorias guardadas y consentimientos.</span><small>Próximamente</small></span>
          <ChevronRight className="profile-data-arrow" />
        </Button>
        <Button variant="ghost" className="profile-data-row profile-data-delete" disabled title="Eliminar mi cuenta: próximamente">
          <span className="profile-icon-tile"><Trash2 /></span>
          <span className="profile-data-copy"><strong>Eliminar mi cuenta</strong><span>Borra tu cuenta y todos tus datos definitivamente.</span><small>Próximamente</small></span>
          <ChevronRight className="profile-data-arrow" />
        </Button>
      </div>
    </ProfileBlock>
    <div className="profile-footer-actions">
      <Button variant="outline" className="profile-tutorial" disabled title="Repetir tutorial: próximamente"><GraduationCap /><span>Repetir tutorial<small>Próximamente</small></span></Button>
      <Button variant="outline" className="profile-signout" disabled={!user || busy} onClick={signOut}><LogOut />{busy ? 'Cerrando sesión…' : 'Cerrar sesión'}</Button>
    </div>
    {error && <p className="profile-error" role="alert">{error}</p>}
    <AppBottomNav active="perfil" />
  </main>;
}