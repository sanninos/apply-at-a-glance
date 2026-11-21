import { Capacitor } from '@capacitor/core';
import {
  Purchases,
  LOG_LEVEL,
  PAYWALL_RESULT,
  PERIOD_UNIT,
  PURCHASES_ERROR_CODE,
  isPurchasesError,
  type CustomerInfo,
  type Period,
  type PurchasesEntitlementInfo,
  type PurchasesPackage,
} from '@revenuecat/purchases-capacitor';
import { RevenueCatUI } from '@revenuecat/purchases-capacitor-ui';

// Public Google Play SDK key (safe to ship). The app loads its web code from the hosted site, so the key lives in the code as
// the default and VITE_REVENUECAT_API_KEY only overrides it (e.g. the `test_` Test Store key for development).
export const REVENUECAT_API_KEY: string = import.meta.env['VITE_REVENUECAT_API_KEY'] ?? 'goog_aBFHKjDrVUznprBUXwIiomyHkrv';

/** Entitlement that the lifetime, yearly and monthly products unlock (RevenueCat dashboard → Entitlements).
 *  The dashboard currently uses `urujobs_pro`; `pro` is kept as an accepted alias so either name works. */
export const PRO_ENTITLEMENT_ID = 'urujobs_pro';
export const PRO_ENTITLEMENT_IDS: readonly string[] = ['urujobs_pro', 'pro'];

export const PRODUCT_IDS = { lifetime: 'lifetime', yearly: 'yearly', monthly: 'monthly' } as const;
export type PlanId = keyof typeof PRODUCT_IDS;

/** Subscriptions are native-only: old Android builds without the plugin and the web keep working untouched. */
export function isPurchasesAvailable() {
  return typeof window !== 'undefined' && Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('Purchases');
}

let configured = false;
let currentUserId: string | null = null;
let queue: Promise<unknown> = Promise.resolve();

/**
 * Configures the SDK once and keeps RevenueCat's app user in step with the Supabase account
 * (logIn on sign-in, logOut on sign-out). Calls run one at a time so quick account switches cannot interleave.
 */
export function syncPurchasesUser(userId: string | null): Promise<CustomerInfo> {
  const run = queue.then(async () => {
    if (!configured) {
      if (import.meta.env.DEV) await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
      await Purchases.configure({ apiKey: REVENUECAT_API_KEY, appUserID: userId });
      configured = true;
      currentUserId = userId;
    } else if (userId !== currentUserId) {
      if (userId) await Purchases.logIn({ appUserID: userId });
      else await Purchases.logOut();
      currentUserId = userId;
    }
    return (await Purchases.getCustomerInfo()).customerInfo;
  });
  queue = run.catch(() => undefined);
  return run;
}

/** Bypasses the SDK cache so a purchase made on another device or a change in the store shows up. */
export async function refreshCustomerInfo(): Promise<CustomerInfo> {
  await Purchases.invalidateCustomerInfoCache();
  return (await Purchases.getCustomerInfo()).customerInfo;
}

/** Subscribes to customer info changes (purchases, renewals, expirations, restores). Returns the unsubscribe function. */
export async function watchCustomerInfo(onChange: (info: CustomerInfo) => void) {
  const id = await Purchases.addCustomerInfoUpdateListener(onChange);
  return () => { void Purchases.removeCustomerInfoUpdateListener({ listenerToRemove: id }).catch(() => undefined); };
}

/** Active PRO entitlement, accepting either dashboard name (`urujobs_pro` or the older `pro`). */
export const proEntitlement = (info: CustomerInfo | null): PurchasesEntitlementInfo | null => {
  if (!info) return null;
  for (const id of PRO_ENTITLEMENT_IDS) {
    const found = info.entitlements.active[id];
    if (found) return found;
  }
  return null;
};
export const hasPro = (info: CustomerInfo | null) => proEntitlement(info) !== null;

export interface ProAccess { plan: PlanId | null; expiresAt: Date | null; willRenew: boolean }

/** Summarises the active entitlement. Play product ids look like `monthly:base-plan`, so only the part before `:` is compared. */
export function describeProAccess(info: CustomerInfo | null): ProAccess | null {
  const entitlement = proEntitlement(info);
  if (!entitlement) return null;
  const productId = entitlement.productIdentifier.split(':')[0];
  const plan = (Object.keys(PRODUCT_IDS) as PlanId[]).find(key => PRODUCT_IDS[key] === productId) ?? null;
  return {
    plan,
    expiresAt: entitlement.expirationDate ? new Date(entitlement.expirationDate) : null,
    willRenew: entitlement.willRenew,
  };
}

/** True when the customer ever bought anything, so Customer Center is useful even after a subscription lapsed. */
export const hasPurchaseHistory = (info: CustomerInfo | null) => Boolean(info && (hasPro(info) || info.allPurchasedProductIdentifiers.length > 0));

export type PurchaseOutcome =
  | { status: 'purchased' | 'restored' | 'cancelled' | 'not-needed' | 'nothing-to-restore' }
  | { status: 'pending' }
  | { status: 'error'; message: string };

const ERROR_MESSAGES: Partial<Record<PURCHASES_ERROR_CODE, string>> = {
  [PURCHASES_ERROR_CODE.NETWORK_ERROR]: 'Sin conexión. Revisá tu internet e intentá nuevamente.',
  [PURCHASES_ERROR_CODE.OFFLINE_CONNECTION_ERROR]: 'Sin conexión. Revisá tu internet e intentá nuevamente.',
  [PURCHASES_ERROR_CODE.PURCHASE_NOT_ALLOWED_ERROR]: 'Este dispositivo no permite realizar compras.',
  [PURCHASES_ERROR_CODE.PRODUCT_NOT_AVAILABLE_FOR_PURCHASE_ERROR]: 'Este plan no está disponible por el momento.',
  [PURCHASES_ERROR_CODE.PRODUCT_ALREADY_PURCHASED_ERROR]: 'Ya tenés este plan. Probá con «Restaurar compras».',
  [PURCHASES_ERROR_CODE.RECEIPT_IN_USE_BY_OTHER_SUBSCRIBER_ERROR]: 'Esta compra pertenece a otra cuenta de Urujobs.',
  [PURCHASES_ERROR_CODE.PURCHASE_BELONGS_TO_OTHER_USER]: 'Esta compra pertenece a otra cuenta de Urujobs.',
  [PURCHASES_ERROR_CODE.STORE_PROBLEM_ERROR]: 'Google Play tuvo un problema. Intentá nuevamente en unos minutos.',
  [PURCHASES_ERROR_CODE.OPERATION_ALREADY_IN_PROGRESS_ERROR]: 'Ya hay una operación en curso. Esperá un momento.',
};

export function purchaseErrorMessage(error: unknown) {
  const generic = 'No pudimos completar la operación. Intentá nuevamente.';
  if (isPurchasesError(error)) return ERROR_MESSAGES[error.code] ?? `${generic} (${error.userInfo?.readableErrorCode ?? error.code})`;
  const detail = error instanceof Error ? error.message : typeof error === 'string' ? error : '';
  return detail ? `${generic} (${detail.slice(0, 80)})` : generic;
}

function toOutcome(error: unknown): PurchaseOutcome {
  if (isPurchasesError(error)) {
    if (error.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) return { status: 'cancelled' };
    // Slow payment methods are approved later; the customer info listener unlocks Pro when that happens.
    if (error.code === PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR) return { status: 'pending' };
  }
  return { status: 'error', message: purchaseErrorMessage(error) };
}

/**
 * Presents the dashboard-configured paywall (current offering), skipped when Pro is already active so a lifetime
 * or subscribed customer is never offered a second purchase.
 */
export async function presentProPaywall(): Promise<PurchaseOutcome> {
  let error: unknown;
  try {
    const { result } = await RevenueCatUI.presentPaywallIfNeeded({
      requiredEntitlementIdentifier: PRO_ENTITLEMENT_ID,
      listener: { onPurchaseError: event => { error = event.error; } },
    });
    switch (result) {
      case PAYWALL_RESULT.PURCHASED: return { status: 'purchased' };
      case PAYWALL_RESULT.RESTORED: return { status: 'restored' };
      case PAYWALL_RESULT.NOT_PRESENTED: return { status: 'not-needed' };
      case PAYWALL_RESULT.ERROR: return error ? toOutcome(error) : { status: 'error', message: purchaseErrorMessage(null) };
      default: return error ? toOutcome(error) : { status: 'cancelled' };
    }
  } catch (caught) {
    return toOutcome(caught);
  }
}

/** A purchasable plan with its text already formatted from the store's own (localized) prices. */
export interface PaywallPlan {
  id: PlanId;
  nombre: string;
  precio: string;
  periodo: string;
  nota: string;
  cobro: string;
  etiqueta?: string | undefined;
  /** Length of the free trial the customer is eligible for, in days; null when there is none. */
  pruebaDias: number | null;
}
export interface ProPlan extends PaywallPlan { pkg: PurchasesPackage }

const UNIT_DAYS: Partial<Record<PERIOD_UNIT, number>> = { [PERIOD_UNIT.DAY]: 1, [PERIOD_UNIT.WEEK]: 7, [PERIOD_UNIT.MONTH]: 30, [PERIOD_UNIT.YEAR]: 365 };
const periodDays = (period: Period) => period.value * (UNIT_DAYS[period.unit] ?? 0) || null;

/** Google Play resolves the offer per customer: `freePhase` is only set while the customer is still eligible for the trial. */
const trialDays = (pkg: PurchasesPackage) => {
  const phase = pkg.product.defaultOption?.freePhase;
  return phase ? periodDays(phase.billingPeriod) : null;
};

/** Builds the plans shown by the paywall from the current offering (monthly, annual and lifetime packages). */
export function buildProPlans(offering: { monthly: PurchasesPackage | null; annual: PurchasesPackage | null; lifetime: PurchasesPackage | null } | null): ProPlan[] {
  if (!offering) return [];
  const { monthly, annual, lifetime } = offering;
  const savings = monthly && annual && monthly.product.price > 0
    ? Math.round((1 - annual.product.price / (monthly.product.price * 12)) * 100)
    : 0;
  const plans: ProPlan[] = [];
  if (monthly) {
    const precio = monthly.product.priceString;
    plans.push({ id: 'monthly', pkg: monthly, nombre: 'Mensual', precio, periodo: '/mes', nota: 'Cancelás cuando quieras', cobro: `${precio} por mes`, pruebaDias: trialDays(monthly) });
  }
  if (annual) {
    const precio = annual.product.priceString;
    const perMonth = annual.product.pricePerMonthString;
    plans.push({
      id: 'yearly', pkg: annual, nombre: 'Anual', precio, periodo: '/año',
      nota: perMonth ? `Equivale a ${perMonth} por mes` : 'Cancelás cuando quieras',
      cobro: `${precio} por año`,
      etiqueta: savings > 0 ? `Ahorrás ${savings}%` : undefined,
      pruebaDias: trialDays(annual),
    });
  }
  if (lifetime) {
    const precio = lifetime.product.priceString;
    plans.push({ id: 'lifetime', pkg: lifetime, nombre: 'De por vida', precio, periodo: '', nota: 'Pago único, sin renovación', cobro: `${precio} en un solo pago`, pruebaDias: null });
  }
  return plans;
}

export async function loadProPlans(): Promise<ProPlan[]> {
  const { current } = await Purchases.getOfferings();
  return buildProPlans(current);
}

export async function purchaseProPlan(plan: ProPlan): Promise<PurchaseOutcome> {
  try {
    const { customerInfo } = await Purchases.purchasePackage({ aPackage: plan.pkg });
    return hasPro(customerInfo) ? { status: 'purchased' } : { status: 'error', message: purchaseErrorMessage(null) };
  } catch (caught) {
    return toOutcome(caught);
  }
}

export async function restoreProPurchases(): Promise<PurchaseOutcome> {
  try {
    const { customerInfo } = await Purchases.restorePurchases();
    return { status: hasPro(customerInfo) ? 'restored' : 'nothing-to-restore' };
  } catch (caught) {
    return toOutcome(caught);
  }
}

export async function presentCustomerCenter(): Promise<string | null> {
  try {
    await RevenueCatUI.presentCustomerCenter();
    return null;
  } catch (caught) {
    return purchaseErrorMessage(caught);
  }
}
