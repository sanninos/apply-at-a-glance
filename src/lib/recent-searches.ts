const KEY = "urujobs:recent-searches";
export const MAX_RECENT = 5;

/** Newest first, case-insensitive dedupe, capped at 5. */
export function addRecent(list: string[], term: string): string[] {
  const t = term.trim();
  if (!t) return list;
  return [t, ...list.filter((x) => x.toLowerCase() !== t.toLowerCase())].slice(0, MAX_RECENT);
}
export function loadRecent(): string[] {
  try { const v = JSON.parse(localStorage.getItem(KEY) ?? "[]"); return Array.isArray(v) ? v.filter((x) => typeof x === "string").slice(0, MAX_RECENT) : []; } catch { return []; }
}
export function storeRecent(list: string[]) {
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* storage unavailable */ }
}
