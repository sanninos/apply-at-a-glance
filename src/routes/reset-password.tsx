import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { accessSchema } from '@/lib/access-validation';
export const Route = createFileRoute('/reset-password')({
  head: () => ({ meta: [
    { title: 'URUJOBS · Cambiar contraseña' },
    { name: 'description', content: 'Elegí una nueva contraseña para tu cuenta de URUJOBS.' },
    { property: 'og:title', content: 'URUJOBS · Cambiar contraseña' },
    { property: 'og:description', content: 'Recuperá el acceso a tu cuenta.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
  ] }), component: ResetPassword,
});
function ResetPassword() {
  const navigate = useNavigate();
  const [recovery, setRecovery] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  useEffect(() => { setRecovery(new URLSearchParams(window.location.hash.slice(1)).get('type') === 'recovery'); }, []);
  async function submit(event: FormEvent) {
    event.preventDefault();
    const valid = accessSchema.shape.password.safeParse(password);
    if (!valid.success) { setMessage(valid.error.issues[0]?.message ?? 'Revisá la contraseña.'); return; }
    if (password !== confirmation) { setMessage('Las contraseñas no coinciden.'); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: valid.data }); setBusy(false);
    setMessage(error ? 'El enlace venció o no pudimos cambiar la contraseña. Solicitá uno nuevo.' : 'Tu contraseña se cambió correctamente.'); setDone(!error);
  }
  return <main className="access-screen"><div className="access-content"><div className="access-brand"><h1>URUJOBS</h1></div><h2 className="text-center mb-6 font-semibold">Nueva contraseña</h2>
    {recovery && !done ? <form className="access-form" onSubmit={submit}><label className="access-field"><input aria-label="Nueva contraseña" placeholder="Nueva contraseña" type="password" autoComplete="new-password" value={password} maxLength={128} onChange={e => setPassword(e.target.value)} /></label><label className="access-field"><input aria-label="Confirmar contraseña" placeholder="Confirmar contraseña" type="password" autoComplete="new-password" maxLength={128} value={confirmation} onChange={e => setConfirmation(e.target.value)} /></label><Button className="access-submit" variant="outline" disabled={busy}>Guardar contraseña</Button></form> : !done && <p className="access-error">Abrí el enlace de recuperación que recibiste por correo.</p>}
    {message && <p role="status" className="access-notice">{message}</p>}<Button variant="link" onClick={() => navigate({ to: '/auth' })}>Volver al ingreso</Button>
  </div></main>;
}
