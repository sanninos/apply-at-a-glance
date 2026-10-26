import { useEffect, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useAccess } from "@/components/access-provider";
import { linkPushToken, registerPushToken } from "@/lib/push-tokens.functions";

const STORAGE_KEY = "uru-fcm-token";
const EVENT = "urujobs:fcm-token";

type Platform = "android" | "web" | "ios";
declare global {
  interface Window {
    /** Optional native bridge exposed by the Android WebView. */
    UrujobsPush?: { getToken?: () => string | null | undefined };
    __URUJOBS_FCM_TOKEN__?: string;
  }
}

function readNativeToken(): string | null {
  try {
    const fromBridge = window.UrujobsPush?.getToken?.();
    if (fromBridge) return fromBridge;
  } catch {
    /* bridge unavailable */
  }
  const fromQuery = new URLSearchParams(window.location.search).get("fcm_token");
  return fromQuery || window.__URUJOBS_FCM_TOKEN__ || null;
}

/**
 * Saves the device's FCM token as soon as the app opens (no sign-in needed),
 * and links it to the account once the user signs in.
 * The Android app supplies the token via window.UrujobsPush.getToken(),
 * window.__URUJOBS_FCM_TOKEN__, the ?fcm_token= query param, or a
 * "urujobs:fcm-token" CustomEvent with { token } in detail.
 */
export function PushTokenRegistrar() {
  const { user } = useAccess();
  const register = useServerFn(registerPushToken);
  const link = useServerFn(linkPushToken);
  const tokenRef = useRef<string | null>(null);
  const linkedRef = useRef<string | null>(null);

  const linkIfSignedIn = (token: string, platform: Platform) => {
    const key = `${user?.id}:${token}`;
    if (!user || linkedRef.current === key) return;
    linkedRef.current = key;
    link({ data: { token, platform } }).catch(() => (linkedRef.current = null));
  };

  useEffect(() => {
    const handle = (token: string | null, platform: Platform = "android") => {
      if (!token || token.length < 20 || tokenRef.current === token) return;
      tokenRef.current = token;
      const known = localStorage.getItem(STORAGE_KEY) === token;
      if (!known) {
        register({ data: { token, platform } })
          .then(() => localStorage.setItem(STORAGE_KEY, token))
          .catch(() => (tokenRef.current = null));
      }
      linkIfSignedIn(token, platform);
    };
    handle(readNativeToken());
    const onEvent = (e: Event) => {
      const detail = (e as CustomEvent<{ token?: string; platform?: Platform }>).detail;
      handle(detail?.token ?? null, detail?.platform ?? "android");
    };
    window.addEventListener(EVENT, onEvent);
    return () => window.removeEventListener(EVENT, onEvent);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (tokenRef.current) linkIfSignedIn(tokenRef.current, "android");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return null;
}
