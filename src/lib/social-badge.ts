// Browser-safe badge store for the Social tab: counts posters the user has
// not seen yet. The id registry is written whenever the social list loads;
// seen ids are recorded as each poster scrolls into view.
import { useEffect, useState } from "react";

const IDS_KEY = "uru-social-poster-ids";
const SEEN_KEY = "uru-social-seen-posters";
const MAX_IDS = 2000;
export const SOCIAL_BADGE_EVENT = "uru-social-badge";

const canStore = () => typeof window !== "undefined" && !!window.localStorage;

const readIds = (key: string): string[] => {
  if (!canStore()) return [];
  try {
    const raw = window.localStorage.getItem(key);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string").slice(-MAX_IDS);
  } catch {
    return [];
  }
};

const writeIds = (key: string, ids: string[]) => {
  if (!canStore()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(ids.slice(-MAX_IDS)));
  } catch {
    // Storage full or blocked: the badge simply stays without data.
  }
};

/** Remember the current set of social posters so the badge can diff unseen ones. */
export function recordSocialPosterIds(ids: string[]) {
  const unique = Array.from(new Set(ids.map(String)));
  const previous = readIds(IDS_KEY);
  if (previous.length === unique.length && unique.every((id, i) => id === previous[i])) return;
  writeIds(IDS_KEY, unique);
}

/** Mark one poster as seen (idempotent) and refresh the badge. */
export function markPosterSeen(id: string) {
  const seen = readIds(SEEN_KEY);
  const value = String(id);
  if (seen.includes(value)) return;
  writeIds(SEEN_KEY, [...seen, value]);
  if (canStore()) window.dispatchEvent(new Event(SOCIAL_BADGE_EVENT));
}

export function countUnseenSocialPosters(): number {
  const ids = readIds(IDS_KEY);
  if (!ids.length) return 0;
  const seen = new Set(readIds(SEEN_KEY));
  return ids.reduce((total, id) => (seen.has(id) ? total : total + 1), 0);
}

/** Live badge count for the bottom navigation. */
export function useSocialBadgeCount(): number {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const refresh = () => setCount(countUnseenSocialPosters());
    refresh();
    window.addEventListener(SOCIAL_BADGE_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(SOCIAL_BADGE_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);
  return count;
}
