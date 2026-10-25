import { useRef, useState } from 'react';
import { CheckCircle2, Trash2, X } from 'lucide-react';
import { useServerFn } from '@tanstack/react-start';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Drawer, DrawerContent, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { accountDeletionSchema } from '@/lib/account-deletion';
import { getDeletionRequest, sendDeletionRequest } from '@/lib/account-deletion.functions';
import { useAccess } from '@/components/access-provider';
import { useAccessDialog } from '@/components/access-dialog';
import './account-deletion.css';

type Props = { open: boolean; onOpenChange: (open: boolean) => void; fullName?: string | undefined; email?: string | undefined };

export function AccountDeletion({ open, onOpenChange, fullName, email }: Props) {
  return <Drawer open={open} onOpenChange={onOpenChange} shouldScaleBackground={false}>
    <DrawerContent className="account-deletion-drawer">
      {open && <DeletionForm fullName={fullName} email={email} onClose={() => onOpenChange(false)} />}
    </DrawerContent>
  </Drawer>;
}

function DeletionForm({ fullName = '', email = '', onClose }: { fullName?: string | undefined; email?: string | undefined; onClose: () => void }) {
  const [values, setValues] = useState({ fullName, email, reason: '', confirmed: false });
  const [errors, setErrors] = useState<Partial<Record<keyof typeof values, string>>>({});
  const { user, ready } = useAccess();
  const { open: openAccess } = useAccessDialog();
  const send = useServerFn(sendDeletionRequest);
  const read = useServerFn(getDeletionRequest);
  const client = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState('');
  const inFlight = useRef(false);
  const request = useQuery({ queryKey: ['account-deletion-request', user?.id], enabled: ready && Boolean(user), queryFn: () => read(), staleTime: 30_000 });
  function update<K extends keyof typeof values>(field: K, value: (typeof values)[K]) {
    setValues(current => ({ ...current, [field]: value }));
    setErrors(current => ({ ...current, [field]: '' }));
    setFailure('');
  }
  if (request.data) return <div className="account-deletion-content">
    <div className="account-deletion-icon"><CheckCircle2 size={24} /></div>
    <header className="account-deletion-header"><div><DrawerTitle>Solicitud recibida</DrawerTitle><DrawerDescription>Tu solicitud de eliminación quedó registrada. Tu cuenta no se eliminó automáticamente.</DrawerDescription></div></header>
    <p className="account-deletion-notice mt-5" role="status">Estado: {request.data.status === 'completed' ? 'Completada' : request.data.status === 'processing' ? 'En revisión' : 'Pendiente de revisión'}. Fecha: {new Date(request.data.created_at).toLocaleDateString('es-UY')}. Referencia: {request.data.id}.</p>
    <Button className="mt-5 w-full" onClick={onClose}>Entendido</Button>
  </div>;
  return <div className="account-deletion-content">
    <div className="account-deletion-icon"><Trash2 size={21} /></div>
    <header className="account-deletion-header">
      <div><DrawerTitle>Solicitar eliminación</DrawerTitle><DrawerDescription>La eliminación de tu cuenta y sus datos es definitiva. Abrir este formulario no elimina tu cuenta.</DrawerDescription></div>
      <Button variant="ghost" size="icon" aria-label="Cerrar solicitud" title="Cerrar solicitud" onClick={onClose}><X /></Button>
    </header>
    <form className="account-deletion-form" noValidate onSubmit={async event => {
      event.preventDefault();
      if (inFlight.current) return;
      if (!user) { onClose(); openAccess(); return; }
      const parsed = accountDeletionSchema.safeParse(values);
      if (!parsed.success) {
        setErrors(Object.fromEntries(parsed.error.issues.map(issue => [String(issue.path[0]), issue.message])));
        return;
      }
      if (parsed.data.email.toLowerCase() !== user.email?.toLowerCase()) { setErrors({ email: 'Usá el correo de tu cuenta actual.' }); return; }
      setErrors({}); setFailure(''); setBusy(true); inFlight.current = true;
      try {
        const saved = await send({ data: parsed.data });
        client.setQueryData(['account-deletion-request', user.id], saved);
      } catch { setFailure('No pudimos enviar la solicitud. Tus datos siguen aquí; intentá nuevamente.'); }
      finally { setBusy(false); inFlight.current = false; }
    }}>
      <fieldset disabled={busy || !ready || (Boolean(user) && request.isPending)} className="grid gap-4 border-0 p-0 min-w-0">
      <div className="account-deletion-field"><label htmlFor="deletion-name">Nombre completo</label><input id="deletion-name" autoComplete="name" maxLength={100} value={values.fullName} onChange={event => update('fullName', event.target.value)} aria-invalid={Boolean(errors.fullName)} aria-describedby={errors.fullName ? 'deletion-name-error' : undefined} />{errors.fullName && <span id="deletion-name-error" className="account-deletion-error">{errors.fullName}</span>}</div>
      <div className="account-deletion-field"><label htmlFor="deletion-email">Correo de la cuenta</label><input id="deletion-email" type="email" autoComplete="email" maxLength={255} value={values.email} onChange={event => update('email', event.target.value)} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'deletion-email-error' : undefined} />{errors.email && <span id="deletion-email-error" className="account-deletion-error">{errors.email}</span>}</div>
      <label className="account-deletion-field" htmlFor="deletion-reason">Motivo (opcional)<textarea id="deletion-reason" maxLength={1000} value={values.reason} onChange={event => update('reason', event.target.value)} /></label>
      <div><label className="account-deletion-check" htmlFor="deletion-confirm"><Checkbox id="deletion-confirm" checked={values.confirmed} onCheckedChange={checked => update('confirmed', checked === true)} aria-invalid={Boolean(errors.confirmed)} aria-describedby={errors.confirmed ? 'deletion-confirm-error' : undefined} /><span>Quiero solicitar la eliminación definitiva de mi cuenta y sus datos.</span></label>{errors.confirmed && <p id="deletion-confirm-error" className="account-deletion-error">{errors.confirmed}</p>}</div>
      </fieldset>
      <p className="account-deletion-notice">{user ? 'La solicitud quedará registrada para revisión. Enviarla no elimina tu cuenta inmediatamente.' : 'Ingresá a tu cuenta para enviar una solicitud de eliminación.'}</p>
      {(failure || request.isError) && <p className="account-deletion-error" role="alert">{failure || 'No pudimos comprobar si ya tenés una solicitud.'}</p>}
      <div className="account-deletion-actions"><Button type="button" variant="outline" disabled={busy} onClick={onClose}>Cancelar</Button><Button type="submit" variant="destructive" disabled={busy || !ready || (Boolean(user) && request.isPending)}>{busy ? 'Enviando…' : user ? 'Enviar solicitud' : 'Ingresar'}</Button></div>
    </form>
  </div>;
}