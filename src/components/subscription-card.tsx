import { useState } from 'react';
import { Crown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/components/subscription-provider';
import type { PurchaseOutcome } from '@/lib/revenuecat';

const PLAN_LABELS = { lifetime: 'Acceso de por vida', yearly: 'Plan anual', monthly: 'Plan mensual' } as const;
const date = (value: Date) => value.toLocaleDateString('es-UY', { day: 'numeric', month: 'long', year: 'numeric' });

function outcomeMessage(outcome: PurchaseOutcome) {
  switch (outcome.status) {
    case 'purchased': return { ok: true, text: '¡Listo! Tu suscripción Pro está activa.' };
    case 'restored': return { ok: true, text: 'Recuperamos tu suscripción Pro.' };
    case 'pending': return { ok: true, text: 'Tu pago está pendiente. Activaremos Pro apenas se confirme.' };
    case 'nothing-to-restore': return { ok: true, text: 'No encontramos compras para restaurar en esta cuenta de Google Play.' };
    case 'error': return { ok: false, text: outcome.message };
    default: return null;
  }
}

export function SubscriptionCard() {
  const { status, isPro, access, canManage, error, refresh, showPaywall, restore, openCustomerCenter } = useSubscription();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function run(action: () => Promise<PurchaseOutcome | string | null>) {
    if (busy) return;
    setBusy(true); setMessage(null);
    try {
      const result = await action();
      if (typeof result === 'string') setMessage({ ok: false, text: result });
      else if (result) setMessage(outcomeMessage(result));
    } finally {
      setBusy(false);
    }
  }

  if (status === 'idle' || status === 'loading') return <p className="text-sm text-muted-foreground" role="status">Verificando tu suscripción…</p>;
  if (status === 'error') return <>
    <p className="profile-error" role="alert">{error ?? 'No pudimos verificar tu suscripción.'}</p>
    <Button variant="outline" className="mt-3" disabled={busy} onClick={() => void run(async () => { await refresh(); return null; })}>Reintentar</Button>
  </>;

  const planLabel = access?.plan ? PLAN_LABELS[access.plan] : 'Urujobs Pro';
  const detail = !access ? 'Todavía no tenés un plan Pro.'
    : !access.expiresAt ? 'Pago único, sin vencimiento.'
    : access.willRenew ? `Se renueva el ${date(access.expiresAt)}.`
    : `Vence el ${date(access.expiresAt)} y no se renovará.`;

  return <>
    <div className="flex items-center gap-3">
      <span className="profile-icon-tile"><Crown /></span>
      <div>
        <strong>{isPro ? planLabel : 'Urujobs Pro'}</strong>
        <p className="text-sm text-muted-foreground">{detail}</p>
      </div>
    </div>
    <div className="mt-3 flex flex-wrap gap-2">
      {!isPro && <Button disabled={busy} onClick={() => void run(showPaywall)}>Ver planes<ChevronRight /></Button>}
      {canManage && <Button variant="outline" disabled={busy} onClick={() => void run(openCustomerCenter)}>Administrar suscripción</Button>}
      {!isPro && <Button variant="ghost" disabled={busy} onClick={() => void run(restore)}>Restaurar compras</Button>}
    </div>
    {message && <p className={message.ok ? 'mt-2 text-sm text-muted-foreground' : 'profile-error'} role={message.ok ? 'status' : 'alert'}>{message.text}</p>}
  </>;
}
