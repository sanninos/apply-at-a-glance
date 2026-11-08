import { supabase } from '@/integrations/supabase/client';
import { Capacitor, registerPlugin } from '@capacitor/core';

const nativeGoogle = registerPlugin<{ signIn(options: { hashedNonce: string }): Promise<{ idToken: string }> }>('UrujobsGoogleAuth');

const EVENT = 'urujobs:google-id-token';
const TIMEOUT_MS = 120_000;

declare global {
  interface Window {
    /** Native Android bridge (addJavascriptInterface). */
    UrujobsAuth?: { signInWithGoogle?: (hashedNonce: string) => void };
  }
}

export function hasNativeGoogle() {
  return typeof window !== 'undefined' && (Capacitor.isNativePlatform() || typeof window.UrujobsAuth?.signInWithGoogle === 'function');
}

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Asks the Android app to show the phone's Google account picker (Credential Manager).
 * The app answers with: window.dispatchEvent(new CustomEvent('urujobs:google-id-token',
 *   { detail: { idToken } }))  or  { detail: { error: 'cancelled' } }.
 */
export async function signInWithNativeGoogle() {
  if (!hasNativeGoogle()) throw new Error('native_unavailable');
  const rawNonce = crypto.randomUUID() + crypto.randomUUID();
  const hashedNonce = await sha256Hex(rawNonce);
  let idToken: string;
  if (Capacitor.isNativePlatform()) {
    if (!Capacitor.isPluginAvailable('UrujobsGoogleAuth')) throw new Error('native_unavailable');
    ({ idToken } = await nativeGoogle.signIn({ hashedNonce }));
  } else {
    const signIn = window.UrujobsAuth?.signInWithGoogle;
    if (!signIn) throw new Error('native_unavailable');
    idToken = await new Promise<string>((resolve, reject) => {
    const timer = window.setTimeout(() => { cleanup(); reject(new Error('timeout')); }, TIMEOUT_MS);
    const onEvent = (e: Event) => {
      const detail = (e as CustomEvent<{ idToken?: string; error?: string }>).detail;
      cleanup();
      if (detail?.idToken) resolve(detail.idToken); else reject(new Error(detail?.error || 'cancelled'));
    };
    function cleanup() { window.clearTimeout(timer); window.removeEventListener(EVENT, onEvent); }
    window.addEventListener(EVENT, onEvent);
    try { signIn.call(window.UrujobsAuth, hashedNonce); }
    catch { cleanup(); reject(new Error('native_unavailable')); }
  });
  }
  if (typeof idToken !== 'string' || !idToken.trim()) throw new Error('invalid_credential');
  const { error } = await supabase.auth.signInWithIdToken({ provider: 'google', token: idToken, nonce: rawNonce });
  if (error) throw error;
}

export function nativeGoogleError(error: unknown): string | null {
  const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : error instanceof Error ? error.message : '';
  if (code === 'cancelled') return null;
  if (code === 'native_unavailable') return 'Actualizá la app para ingresar con las cuentas de Google de tu teléfono.';
  if (code === 'timeout') return 'El ingreso tardó demasiado. Intentá nuevamente.';
  return 'No pudimos completar el ingreso con Google. Intentá nuevamente.';
}
