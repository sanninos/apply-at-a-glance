import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { X, UserRound, Mail, LockKeyhole, Eye, EyeOff, LoaderCircle, LogOut, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAccess } from '@/components/access-provider';
import { accessSchema, registrationSchema } from '@/lib/access-validation';
import { DEFAULT_EMPLOYER_LOGO } from '@/lib/job-branding';

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
  const queryClient = useQueryClient();
  const { user, ready } = useAccess();
  const [mode, setMode] = useState<'register' | 'login' | 'forgot'>('register');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const profile = useQuery({ queryKey: ['access-profile', user?.id], enabled: ready && Boolean(user), queryFn: async () => {
    if (!user) return null;
    const { data, error } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
    if (error) throw error;
    return data;
  } });
  async function submit(event: FormEvent) {
    event.preventDefault(); setError(''); setNotice('');
    const valid = mode === 'forgot' ? accessSchema.shape.email.safeParse(email) : (mode === 'register' ? registrationSchema : accessSchema).safeParse({ fullName, email, password });
    if (!valid.success) { setError(valid.error.issues[0]?.message ?? 'Revisá los datos.'); return; }
    setBusy(true);
    try {
      if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(accessSchema.shape.email.parse(email), { redirectTo: `${window.location.origin}/reset-password` });
        if (error) throw error;
        setNotice('Si existe una cuenta con ese correo, recibirás un enlace para cambiar tu contraseña.');
      } else if (mode === 'register') {
        const values = registrationSchema.parse({ fullName, email, password });
        const { data, error } = await supabase.auth.signUp({ email: values.email, password: values.password, options: { data: { full_name: values.fullName }, emailRedirectTo: `${window.location.origin}/auth` } });
        if (error) throw error;
        setNotice(data.session ? 'Tu cuenta se creó correctamente.' : 'Revisá tu correo para confirmar tu cuenta antes de ingresar.');
      } else {
        const { error } = await supabase.auth.signInWithPassword(accessSchema.parse({ email, password }));
        if (error) throw error;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      setError(message.includes('Invalid login') ? 'El correo o la contraseña no son correctos.' : message.includes('already registered') ? 'Ya existe una cuenta con ese correo. Elegí Ingresar.' : message.includes('rate limit') ? 'Esperá unos minutos antes de volver a intentar.' : 'No pudimos completar el acceso. Revisá tus datos e intentá nuevamente.');
    } finally { setBusy(false); }
  }
  async function google() {
    setBusy(true); setError('');
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/auth` } });
    if (error) { setError('No pudimos iniciar el ingreso con Google.'); setBusy(false); }
  }
  async function signOut() {
    setBusy(true); await queryClient.cancelQueries(); queryClient.clear();
    const { error } = await supabase.auth.signOut(); setBusy(false);
    if (error) { setError('No pudimos cerrar la sesión. Intentá nuevamente.'); return; }
    setNotice(''); setPassword(''); void navigate({ to: '/auth', replace: true });
  }
  return <main className="access-screen">
    <Button variant="ghost" size="icon" className="access-close" aria-label="Cerrar" onClick={() => navigate({ to: '/' })}><X /></Button>
    <div className="access-content">
      <div className="access-brand"><img src={DEFAULT_EMPLOYER_LOGO} alt="Bandera de Uruguay" /><h1>URUJOBS</h1></div>
      {ready && user ? <section className="access-account">
        <CheckCircle2 className="access-account-icon" /><h2>{profile.data?.full_name || user.user_metadata?.full_name || 'Mi cuenta'}</h2><p>{user.email}</p>
        {profile.isError && <p role="alert">No pudimos cargar tu nombre de perfil.</p>}{notice && <p role="status">{notice}</p>}
        <Button className="access-submit" variant="outline" onClick={() => navigate({ to: '/' })}>Ver empleos</Button>
        <Button variant="ghost" disabled={busy} onClick={signOut}><LogOut /> Cerrar sesión</Button>
      </section> : <>
        <Button variant="outline" className="access-google" disabled={busy || !ready} onClick={google}>
          <svg viewBox="0 0 24 24" aria-hidden="true" className="google-mark"><path className="google-blue" d="M22 12.2c0-.7-.1-1.4-.2-2.2H12v4h5.6c-.3 1.2-.9 2.1-1.9 2.7v2.5h3.2c1.9-1.8 3.1-4.1 3.1-7Z"/><path className="google-green" d="M12 22c2.7 0 5-.9 6.9-2.8l-3.2-2.5c-1 .7-2.2 1-3.7 1-2.7 0-4.9-1.8-5.7-4.2H3v2.6C4.8 19.6 8.1 22 12 22Z"/><path className="google-yellow" d="M6.3 13.5a6 6 0 0 1 0-3V7.9H3a10 10 0 0 0 0 8.2Z"/><path className="google-red" d="M12 6.3c1.6 0 2.9.5 4 1.6l3-3C17.1 3.1 14.8 2 12 2 8.1 2 4.8 4.4 3 7.9l3.3 2.6C7.1 8.1 9.3 6.3 12 6.3Z"/></svg>Continúa con Google
        </Button>
        <div className="access-divider"><span />o<span /></div>
        <div className="access-tabs" role="tablist" aria-label="Tipo de acceso">
          <Button role="tab" aria-selected={mode === 'register'} className={mode === 'register' ? 'selected' : ''} variant="ghost" onClick={() => { setMode('register'); setError(''); setNotice(''); }}>Registrarse</Button>
          <Button role="tab" aria-selected={mode !== 'register'} className={mode !== 'register' ? 'selected' : ''} variant="ghost" onClick={() => { setMode('login'); setError(''); setNotice(''); }}>Ingresar</Button>
        </div>
        <form onSubmit={submit} className="access-form" noValidate>
          {mode === 'register' && <label className="access-field"><UserRound /><input aria-label="Nombre completo" placeholder="Nombre completo" autoComplete="name" value={fullName} onChange={e => setFullName(e.target.value)} maxLength={100} /></label>}
          <label className="access-field"><Mail /><input aria-label="Correo electrónico" placeholder="Correo electrónico" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} maxLength={255} /></label>
          {mode !== 'forgot' && <label className="access-field"><LockKeyhole /><input aria-label="Contraseña" placeholder="Contraseña" type={visible ? 'text' : 'password'} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} value={password} onChange={e => setPassword(e.target.value)} maxLength={128} /><Button type="button" variant="ghost" size="icon" title={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'} onClick={() => setVisible(!visible)}>{visible ? <EyeOff /> : <Eye />}</Button></label>}
          {mode === 'login' && <Button type="button" variant="link" className="access-forgot" onClick={() => { setMode('forgot'); setError(''); setNotice(''); }}>¿Olvidaste tu contraseña?</Button>}
          {error && <p className="access-error" role="alert">{error}</p>}{notice && <p className="access-notice" role="status">{notice}</p>}
          <Button type="submit" variant="outline" className="access-submit" disabled={busy || !ready}>{busy && <LoaderCircle className="animate-spin" />}{mode === 'register' ? 'Registrarse' : mode === 'login' ? 'Ingresar' : 'Enviar enlace'}</Button>
        </form>
      </>}
      {error && user && <p className="access-error" role="alert">{error}</p>}
    </div>
  </main>;
}
