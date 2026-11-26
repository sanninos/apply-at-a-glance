import { useEffect, useState } from 'react';
import { trackEvent } from "@/lib/analytics";
import { Paywall, type PaywallState } from '@/components/paywall';
import { useAccess } from '@/components/access-provider';
import { useAccessDialog } from '@/components/access-dialog';
import { useSubscription } from '@/components/subscription-provider';
import { loadProPlans, purchaseErrorMessage, type PaywallPlan, type ProPlan, type PurchaseOutcome } from '@/lib/revenuecat';

type Message = { ok: boolean; text: string } | null;

function outcomeMessage(outcome: PurchaseOutcome): Message {
  switch (outcome.status) {
    case 'cancelled': return { ok: true, text: 'Compra cancelada. No se realizó ningún cobro.' };
    case 'pending': return { ok: true, text: 'Tu pago está pendiente. Activaremos Premium apenas se confirme.' };
    case 'nothing-to-restore': return { ok: true, text: 'No encontramos compras para restaurar en esta cuenta de Google Play.' };
    case 'error': return { ok: false, text: outcome.message };
    default: return null;
  }
}

/**
 * Premium plans screen wired to RevenueCat: prices, free trial and eligibility come from the Google Play offering,
 * and buying requires a signed-in account so the purchase follows the user across devices.
 */
export function PremiumPaywall({ onClose }: { onClose: () => void }) {
  const subscription = useSubscription();
  const { user } = useAccess();
  const { open: openAccess } = useAccessDialog();
  const { available, status, isPro } = subscription;
  const [plans, setPlans] = useState<ProPlan[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  useEffect(() => { trackEvent('planes_pro_abiertos'); }, []);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<Message>(null);

  useEffect(() => {
    if (!available || status !== 'ready' || isPro) return;
    let cancelled = false;
    setLoadFailed(false);
    setLoadError(null);
    loadProPlans()
      .then(loaded => { if (!cancelled) setPlans(loaded); })
      .catch(caught => { if (!cancelled) { setLoadFailed(true); setLoadError(purchaseErrorMessage(caught)); } });
    return () => { cancelled = true; };
  }, [available, status, isPro, attempt]);

  let state: PaywallState;
  if (!available) state = 'unavailable';
  else if (isPro) state = 'active';
  else if (status === 'error' || loadFailed || plans?.length === 0) state = 'error';
  else state = plans ? 'ready' : 'loading';
  const errorDetail = status === 'error' ? subscription.error
    : loadError ?? (plans?.length === 0 ? 'No hay planes publicados: revisá en RevenueCat que la oferta actual (current) tenga los paquetes mensual, anual o de por vida con productos de Google Play activos.' : null);

  async function run(action: () => Promise<PurchaseOutcome>) {
    if (busy) return;
    setBusy(true);
    setMessage(null);
    try {
      setMessage(outcomeMessage(await action()));
    } finally {
      setBusy(false);
    }
  }

  function start(chosen: PaywallPlan) {
    const plan = plans?.find(candidate => candidate.id === chosen.id);
    if (!plan) return;
    if (!user) {
      setMessage({ ok: false, text: 'Ingresá o registrate para suscribirte.' });
      openAccess();
      return;
    }
    void run(() => subscription.buyPlan(plan));
  }

  function retry() {
    setMessage(null);
    if (status === 'error') void subscription.refresh();
    else setAttempt(count => count + 1);
  }

  return <Paywall
    plans={plans ?? []}
    state={state}
    busy={busy}
    message={message}
    onClose={onClose}
    onStart={start}
    onRetry={retry}
    errorDetail={errorDetail}
    onRestore={() => void run(subscription.restore)}
  />;
}
