import { beforeEach, describe, expect, it, vi } from 'vitest';
import { webcrypto } from 'node:crypto';

const mocks = vi.hoisted(() => ({ native: false, available: false, signIn: vi.fn(), exchange: vi.fn() }));
vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => mocks.native, isPluginAvailable: () => mocks.available },
  registerPlugin: () => ({ signIn: mocks.signIn }),
}));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { auth: { signInWithIdToken: mocks.exchange } } }));
import { hasNativeGoogle, nativeGoogleError, signInWithNativeGoogle } from '@/lib/native-google';

describe('Android Google handoff', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('crypto', webcrypto);
    delete window.UrujobsAuth;
    mocks.native = true;
    mocks.available = true;
    mocks.signIn.mockResolvedValue({ idToken: 'synthetic-test-token' });
    mocks.exchange.mockResolvedValue({ error: null });
  });
  it('sends SHA-256 nonce to Android and original nonce to Supabase with Google token', async () => {
    await signInWithNativeGoogle();
    const options = mocks.exchange.mock.calls[0]?.[0];
    expect(options.provider).toBe('google');
    expect(options.token).toBe('synthetic-test-token');
    const digest = await webcrypto.subtle.digest('SHA-256', new TextEncoder().encode(options.nonce));
    const hash = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
    expect(mocks.signIn).toHaveBeenCalledWith({ hashedNonce: hash });
    expect(hash).not.toBe(options.nonce);
  });
  it('uses a fresh nonce for each sign-in', async () => {
    await signInWithNativeGoogle();
    await signInWithNativeGoogle();
    expect(mocks.exchange.mock.calls[0]?.[0].nonce).not.toBe(mocks.exchange.mock.calls[1]?.[0].nonce);
  });
  it('treats an old Android build as native but rejects its missing plugin, rather than opening web OAuth', async () => {
    mocks.available = false;
    expect(hasNativeGoogle()).toBe(true);
    await expect(signInWithNativeGoogle()).rejects.toThrow('native_unavailable');
    expect(mocks.exchange).not.toHaveBeenCalled();
  });
  it('cancellation does not exchange a token or display an error', async () => {
    mocks.signIn.mockRejectedValue({ code: 'cancelled' });
    await expect(signInWithNativeGoogle()).rejects.toEqual({ code: 'cancelled' });
    expect(nativeGoogleError({ code: 'cancelled' })).toBeNull();
    expect(mocks.exchange).not.toHaveBeenCalled();
  });
  it('rejects an empty token without exchanging it', async () => {
    mocks.signIn.mockResolvedValue({ idToken: '' });
    await expect(signInWithNativeGoogle()).rejects.toThrow('invalid_credential');
    expect(mocks.exchange).not.toHaveBeenCalled();
  });
  it('propagates Supabase rejection instead of reporting success', async () => {
    mocks.exchange.mockResolvedValue({ error: new Error('rejected') });
    await expect(signInWithNativeGoogle()).rejects.toThrow('rejected');
  });
  it('keeps the legacy Android bridge working with a hashed nonce', async () => {
    mocks.native = false;
    window.UrujobsAuth = { signInWithGoogle: hashedNonce => {
      expect(hashedNonce).toMatch(/^[a-f0-9]{64}$/);
      window.dispatchEvent(new CustomEvent('urujobs:google-id-token', { detail: { idToken: 'legacy-test-token' } }));
    } };
    await signInWithNativeGoogle();
    expect(mocks.exchange.mock.calls[0]?.[0].token).toBe('legacy-test-token');
  });
  it('a normal browser is not mistaken for the Android app', () => {
    mocks.native = false;
    expect(hasNativeGoogle()).toBe(false);
  });
});