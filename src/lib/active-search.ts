export const ACTIVE_SEARCH_DAYS = 7;
const DAY = 86_400_000;

export function activeSearchUntil(now = new Date()) {
  return new Date(now.getTime() + ACTIVE_SEARCH_DAYS * DAY).toISOString();
}

export function isActiveSearch(until: string | null | undefined, now = new Date()) {
  return Boolean(until) && new Date(until as string).getTime() > now.getTime();
}

export function activeSearchDaysLeft(until: string | null | undefined, now = new Date()) {
  if (!isActiveSearch(until, now)) return 0;
  return Math.ceil((new Date(until as string).getTime() - now.getTime()) / DAY);
}
