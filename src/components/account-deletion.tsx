import { useState } from 'react';
import { Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Drawer, DrawerContent, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { accountDeletionSchema } from '@/lib/account-deletion';
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
  const [reviewed, setReviewed] = useState(false);
  function update<K extends keyof typeof values>(field: K, value: (typeof values)[K]) {
    setValues(current => ({ ...current, [field]: value }));
    setErrors(current => ({ ...current, [field]: '' }));
    setReviewed(false);
  }
  return <div className="account-deletion-content">
    <div className="account-deletion-icon"><Trash2 size={21} /></div>
    <header className="account-deletion-header">
      <div><DrawerTitle>Solicitar eliminación</DrawerTitle><DrawerDescription>La eliminación de tu cuenta y sus datos es definitiva. Abrir este formulario no elimina tu cuenta.</DrawerDescription></div>
      <Button variant="ghost" size="icon" aria-label="Cerrar solicitud" title="Cerrar solicitud" onClick={onClose}><X /></Button>
    </header>
    <form className="account-deletion-form" noValidate onSubmit={event => {
      event.preventDefault();
      const parsed = accountDeletionSchema.safeParse(values);
      if (!parsed.success) {
        setErrors(Object.fromEntries(parsed.error.issues.map(issue => [String(issue.path[0]), issue.message])));
        setReviewed(false); return;
      }
      setErrors({}); setReviewed(true);
    }}>
      <div className="account-deletion-field"><label htmlFor="deletion-name">Nombre completo</label><input id="deletion-name" autoComplete="name" maxLength={100} value={values.fullName} onChange={event => update('fullName', event.target.value)} aria-invalid={Boolean(errors.fullName)} aria-describedby={errors.fullName ? 'deletion-name-error' : undefined} />{errors.fullName && <span id="deletion-name-error" className="account-deletion-error">{errors.fullName}</span>}</div>
      <div className="account-deletion-field"><label htmlFor="deletion-email">Correo de la cuenta</label><input id="deletion-email" type="email" autoComplete="email" maxLength={255} value={values.email} onChange={event => update('email', event.target.value)} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'deletion-email-error' : undefined} />{errors.email && <span id="deletion-email-error" className="account-deletion-error">{errors.email}</span>}</div>
      <label className="account-deletion-field" htmlFor="deletion-reason">Motivo (opcional)<textarea id="deletion-reason" maxLength={1000} value={values.reason} onChange={event => update('reason', event.target.value)} /></label>
      <div><label className="account-deletion-check" htmlFor="deletion-confirm"><Checkbox id="deletion-confirm" checked={values.confirmed} onCheckedChange={checked => update('confirmed', checked === true)} aria-invalid={Boolean(errors.confirmed)} aria-describedby={errors.confirmed ? 'deletion-confirm-error' : undefined} /><span>Quiero solicitar la eliminación definitiva de mi cuenta y sus datos.</span></label>{errors.confirmed && <p id="deletion-confirm-error" className="account-deletion-error">{errors.confirmed}</p>}</div>
      <p className="account-deletion-notice" role={reviewed ? 'status' : undefined}>{reviewed ? 'La solicitud no se envió ni se guardó. El envío todavía no está habilitado; tu cuenta no se modificó.' : 'El envío de solicitudes todavía no está habilitado. Los datos de este formulario no se guardan.'}</p>
      <div className="account-deletion-actions"><Button type="button" variant="outline" onClick={onClose}>Cancelar</Button><Button type="submit" variant="destructive">Revisar solicitud</Button></div>
    </form>
  </div>;
}