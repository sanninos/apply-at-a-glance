// Badge store for the Alertas tab, ready for real data. Today there is no
// persisted alert or notification source (the configuration drawer discloses
// that nothing is saved), so the badge stays hidden with zero. When unread
// alerts/notifications exist, plug their count into countUnseenAlertItems
// (or store it under ALERTS_BADGE_EVENT) and the navigation badge lights up.
import { useEffect, useState } from "react";

export const ALERTS_BADGE_EVENT = "uru-alerts-badge";
const UNSEEN_KEY = "uru-alerts-unseen";

const canStore = () => typeof window !== "undefined" && !!window.localStorage;

export function countUnseenAlertItems(): number {
  if (!canStore()) return 0;
  try {
    const raw = window.localStorage.getItem(UNSEEN_KEY);
    const parsed = raw ? Number.parseInt(raw, 10) : 0;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  } catch {
    return 0;
  }
}

/** Publish how many alerts/notifications are still unread (future source). */
export function setUnseenAlertItems(count: number) {
  if (!canStore()) return;
  const safe = Math.max(0, Math.trunc(count));
  try {
    window.localStorage.setItem(UNSEEN_KEY, String(safe));
    window.dispatchEvent(new Event(ALERTS_BADGE_EVENT));
  } catch {
    // Ignore storage failures: the badge just stays hidden.
  }
}

/** Live badge count for the Alertas tab; 0 keeps the badge hidden. */
export function useAlertBadgeCount(): number {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const refresh = () => setCount(countUnseenAlertItems());
    refresh();
    window.addEventListener(ALERTS_BADGE_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(ALERTS_BADGE_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);
  return count;
}
