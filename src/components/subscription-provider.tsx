import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { CustomerInfo } from '@revenuecat/purchases-capacitor';
import { useAccess } from '@/components/access-provider';
import {
  describeProAccess,
  hasPro,
  hasPurchaseHistory,
  isPurchasesAvailable,
  presentCustomerCenter,
  presentProPaywall,
  purchaseErrorMessage,
  purchaseProPlan,
  refreshCustomerInfo,
  restoreProPurchases,
  syncPurchasesUser,
  watchCustomerInfo,
  type ProAccess,
  type ProPlan,
  type PurchaseOutcome,
} from '@/lib/revenuecat';

type Status = 'idle' | 'loading' | 'ready' | 'error';

interface SubscriptionState {
  /** False on the web and on Android builds that do not include the RevenueCat plugin. */
  available: boolean;
  status: Status;
  isPro: boolean;
  access: ProAccess | null;
  canManage: boolean;
  /** Message for the last failed customer info load, if any. */
  error: string | null;
  refresh: () => Promise<void>;
  showPaywall: () => Promise<PurchaseOutcome>;
  buyPlan: (plan: ProPlan) => Promise<PurchaseOutcome>;
  restore: () => Promise<PurchaseOutcome>;
  openCustomerCenter: () => Promise<string | null>;
}

const unavailable: SubscriptionState = {
  available: false, status: 'idle', isPro: false, access: null, canManage: false, error: null,
  refresh: async () => undefined,
  showPaywall: async () => ({ status: 'error', message: 'Las suscripciones solo están disponibles en la app.' }),
  buyPlan: async () => ({ status: 'error', message: 'Las suscripciones solo están disponibles en la app.' }),
  restore: async () => ({ status: 'error', message: 'Las suscripciones solo están disponibles en la app.' }),
  openCustomerCenter: async () => 'Las suscripciones solo están disponibles en la app.',
};

const SubscriptionContext = createContext<SubscriptionState>(unavailable);
export const useSubscription = () => useContext(SubscriptionContext);

/**
 * Keeps RevenueCat's customer in step with the signed-in Supabase user and exposes the customer info.
 * Entitlement state is kept in memory only: RevenueCat caches it natively, so nothing is copied to localStorage.
 */
export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user, ready } = useAccess();
  const userId = user?.id ?? null;
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [configured, setConfigured] = useState(false);
  const available = ready && isPurchasesAvailable();

  useEffect(() => {
    if (!available) return;
    let cancelled = false;
    setCustomerInfo(null);
    setError(null);
    setStatus('loading');
    syncPurchasesUser(userId)
      .then(info => {
        if (cancelled) return;
        setCustomerInfo(info);
        setStatus('ready');
        setConfigured(true);
      })
      .catch(caught => {
        if (cancelled) return;
        setError(purchaseErrorMessage(caught));
        setStatus('error');
      });
    return () => { cancelled = true; };
  }, [available, userId]);

  useEffect(() => {
    if (!configured) return;
    let stop: (() => void) | undefined;
    let disposed = false;
    watchCustomerInfo(setCustomerInfo)
      .then(unsubscribe => { if (disposed) unsubscribe(); else stop = unsubscribe; })
      .catch(() => undefined);
    return () => { disposed = true; stop?.(); };
  }, [configured]);

  const refresh = useCallback(async () => {
    if (!isPurchasesAvailable()) return;
    setError(null);
    try {
      await syncPurchasesUser(userId);
      setCustomerInfo(await refreshCustomerInfo());
      setStatus('ready');
    } catch (caught) {
      setError(purchaseErrorMessage(caught));
      setStatus('error');
    }
  }, [userId]);

  const afterOutcome = useCallback(async (outcome: PurchaseOutcome) => {
    if (outcome.status === 'purchased' || outcome.status === 'restored') await refresh();
    return outcome;
  }, [refresh]);

  const value = useMemo<SubscriptionState>(() => {
    if (!available) return unavailable;
    return {
      available,
      status,
      isPro: hasPro(customerInfo),
      access: describeProAccess(customerInfo),
      canManage: hasPurchaseHistory(customerInfo),
      error,
      refresh,
      showPaywall: async () => afterOutcome(await presentProPaywall()),
      buyPlan: async plan => afterOutcome(await purchaseProPlan(plan)),
      restore: async () => afterOutcome(await restoreProPurchases()),
      openCustomerCenter: async () => {
        const failure = await presentCustomerCenter();
        await refresh();
        return failure;
      },
    };
  }, [available, status, customerInfo, error, refresh, afterOutcome]);

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
}
