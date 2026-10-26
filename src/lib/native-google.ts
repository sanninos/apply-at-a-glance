import { supabase } from '@/integrations/supabase/client';

const EVENT = 'urujobs:google-id-token';
const TIMEOUT_MS = 120_000;

declare global {
  interface Window {
    /** Native Android bridge (addJavascriptInterface). */
    UrujobsAuth?: { signInWithGoogle?: (hashedNonce: string) => void };
  }
}

export function hasNativeGoogle() {
  return typeof window !== 'undefined' && typeof window.UrujobsAuth?.signInWithGoogle === 'function';
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
  const rawNonce = crypto.randomUUID() + crypto.randomUUID();
  const hashedNonce = await sha256Hex(rawNonce);
  const idToken = await new Promise<string>((resolve, reject) => {
    const timer = window.setTimeout(() => { cleanup(); reject(new Error('timeout')); }, TIMEOUT_MS);
    const onEvent = (e: Event) => {
      const detail = (e as CustomEvent<{ idToken?: string; error?: string }>).detail;
      cleanup();
      if (detail?.idToken) resolve(detail.idToken); else reject(new Error(detail?.error || 'cancelled'));
    };
    function cleanup() { window.clearTimeout(timer); window.removeEventListener(EVENT, onEvent); }
    window.addEventListener(EVENT, onEvent);
    window.UrujobsAuth!.signInWithGoogle!(hashedNonce);
  });
  const { error } = await supabase.auth.signInWithIdToken({ provider: 'google', token: idToken, nonce: rawNonce });
  if (error) throw error;
}
