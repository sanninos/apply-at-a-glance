import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  configure: vi.fn(), logIn: vi.fn(), logOut: vi.fn(), getCustomerInfo: vi.fn(), setLogLevel: vi.fn(), restorePurchases: vi.fn(), purchasePackage: vi.fn(),
  presentPaywallIfNeeded: vi.fn(), presentCustomerCenter: vi.fn(),
}));
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => true, isPluginAvailable: () => true } }));
vi.mock('@revenuecat/purchases-capacitor', async () => {
  const actual = await vi.importActual<typeof import('@revenuecat/purchases-capacitor')>('@revenuecat/purchases-typescript-internal-esm');
  return {
    ...actual,
    Purchases: {
      configure: mocks.configure, logIn: mocks.logIn, logOut: mocks.logOut, getCustomerInfo: mocks.getCustomerInfo,
      setLogLevel: mocks.setLogLevel, restorePurchases: mocks.restorePurchases, purchasePackage: mocks.purchasePackage,
    },
  };
});
vi.mock('@revenuecat/purchases-capacitor-ui', () => ({
  RevenueCatUI: { presentPaywallIfNeeded: mocks.presentPaywallIfNeeded, presentCustomerCenter: mocks.presentCustomerCenter },
}));

import { PAYWALL_RESULT, PURCHASES_ERROR_CODE, type CustomerInfo } from '@revenuecat/purchases-capacitor';

const info = (active: Record<string, unknown> = {}, purchased: string[] = []) =>
  ({ entitlements: { active, all: active }, allPurchasedProductIdentifiers: purchased }) as unknown as CustomerInfo;
const sdkError = (code: PURCHASES_ERROR_CODE) => ({ code, message: 'x', userInfo: { readableErrorCode: 'X' }, underlyingErrorMessage: '' });
const entitlement = (productIdentifier: string, expirationDate: string | null, willRenew = true) => ({ productIdentifier, expirationDate, willRenew });

describe('RevenueCat helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    mocks.getCustomerInfo.mockResolvedValue({ customerInfo: info() });
  });

  it('configures once and then follows the signed-in account', async () => {
    const { syncPurchasesUser } = await import('@/lib/revenuecat');
    await syncPurchasesUser(null);
    await syncPurchasesUser(null);
    await syncPurchasesUser('user-1');
    await syncPurchasesUser('user-2');
    await syncPurchasesUser(null);
    expect(mocks.configure).toHaveBeenCalledTimes(1);
    expect(mocks.configure.mock.calls[0]?.[0]).toMatchObject({ appUserID: null });
    expect(mocks.logIn.mock.calls.map(call => call[0].appUserID)).toEqual(['user-1', 'user-2']);
    expect(mocks.logOut).toHaveBeenCalledTimes(1);
  });

  it('retries configuration after a failure instead of staying broken', async () => {
    const { syncPurchasesUser } = await import('@/lib/revenuecat');
    mocks.configure.mockRejectedValueOnce(new Error('boom'));
    await expect(syncPurchasesUser('user-1')).rejects.toThrow('boom');
    await expect(syncPurchasesUser('user-1')).resolves.toBeDefined();
    expect(mocks.configure).toHaveBeenCalledTimes(2);
  });

  it('describes the active plan, including Google Play base-plan ids', async () => {
    const { describeProAccess, hasPro, hasPurchaseHistory } = await import('@/lib/revenuecat');
    expect(describeProAccess(info())).toBeNull();
    expect(describeProAccess(info({ pro: entitlement('lifetime', null) }))).toMatchObject({ plan: 'lifetime', expiresAt: null });
    const yearly = describeProAccess(info({ pro: entitlement('yearly:p1y', '2030-01-01T00:00:00Z', false) }));
    expect(yearly).toMatchObject({ plan: 'yearly', willRenew: false });
    expect(yearly?.expiresAt?.getUTCFullYear()).toBe(2030);
    expect(hasPro(info({ other: entitlement('monthly', null) }))).toBe(false);
    expect(hasPurchaseHistory(info({}, ['monthly']))).toBe(true);
    expect(hasPurchaseHistory(info())).toBe(false);
  });

  it('maps paywall results and purchase errors', async () => {
    const { presentProPaywall, restoreProPurchases } = await import('@/lib/revenuecat');
    mocks.presentPaywallIfNeeded.mockResolvedValueOnce({ result: PAYWALL_RESULT.PURCHASED });
    expect(await presentProPaywall()).toEqual({ status: 'purchased' });
    mocks.presentPaywallIfNeeded.mockResolvedValueOnce({ result: PAYWALL_RESULT.NOT_PRESENTED });
    expect(await presentProPaywall()).toEqual({ status: 'not-needed' });
    mocks.presentPaywallIfNeeded.mockResolvedValueOnce({ result: PAYWALL_RESULT.CANCELLED });
    expect(await presentProPaywall()).toEqual({ status: 'cancelled' });
    mocks.presentPaywallIfNeeded.mockImplementationOnce(async ({ listener }) => {
      listener.onPurchaseError({ error: sdkError(PURCHASES_ERROR_CODE.NETWORK_ERROR) });
      return { result: PAYWALL_RESULT.ERROR };
    });
    expect(await presentProPaywall()).toMatchObject({ status: 'error', message: expect.stringContaining('Sin conexión') });
    mocks.restorePurchases.mockRejectedValueOnce(sdkError(PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR));
    expect(await restoreProPurchases()).toEqual({ status: 'pending' });
    mocks.restorePurchases.mockResolvedValueOnce({ customerInfo: info() });
    expect(await restoreProPurchases()).toEqual({ status: 'nothing-to-restore' });
  });
  const pkg = (price: number, priceString: string, trial: { value: number; unit: string } | null, perMonth: string | null = null) => ({
    product: {
      price, priceString, pricePerMonthString: perMonth,
      defaultOption: { freePhase: trial ? { billingPeriod: trial } : null },
    },
  }) as never;

  it('builds the paywall plans from the offering, with the trial only when Google Play grants it', async () => {
    const { buildProPlans } = await import('@/lib/revenuecat');
    const plans = buildProPlans({
      monthly: pkg(199, '$ 199', { value: 7, unit: 'DAY' }),
      annual: pkg(1490, '$ 1.490', { value: 1, unit: 'WEEK' }, '$ 124'),
      lifetime: pkg(3000, '$ 3.000', null),
    });
    expect(plans.map(plan => plan.id)).toEqual(['monthly', 'yearly', 'lifetime']);
    expect(plans[0]).toMatchObject({ precio: '$ 199', cobro: '$ 199 por mes', pruebaDias: 7 });
    expect(plans[1]).toMatchObject({ nota: 'Equivale a $ 124 por mes', etiqueta: 'Ahorrás 38%', pruebaDias: 7 });
    expect(plans[2]).toMatchObject({ pruebaDias: null, cobro: '$ 3.000 en un solo pago' });
    expect(buildProPlans({ monthly: pkg(199, '$ 199', null), annual: null, lifetime: null })[0]?.pruebaDias).toBeNull();
    expect(buildProPlans(null)).toEqual([]);
  });

  it('reports a purchase only when Pro is active afterwards', async () => {
    const { purchaseProPlan } = await import('@/lib/revenuecat');
    const plan = { pkg: {} } as never;
    mocks.purchasePackage.mockResolvedValueOnce({ customerInfo: info({ pro: entitlement('monthly', null) }) });
    expect(await purchaseProPlan(plan)).toEqual({ status: 'purchased' });
    mocks.purchasePackage.mockRejectedValueOnce(sdkError(PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR));
    expect(await purchaseProPlan(plan)).toEqual({ status: 'cancelled' });
  });
});
