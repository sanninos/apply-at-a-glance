// Browser-safe badge for the Radar tab: counts located offers added since the
// user last opened Radar. The first time, current offers become the baseline
// so only offers added afterwards are counted.
import { useEffect, useState } from "react";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { getRadarJobs } from "@/lib/jobs.functions";
import { toRadarJobs } from "@/lib/radar-jobs";

export const radarQuery = queryOptions({ queryKey: ["radar-jobs"], queryFn: async () => toRadarJobs(await getRadarJobs()), staleTime: 60000 });

const KEY = "uru-radar-known-ids";
const EVENT = "uru-radar-badge";

function readKnown(): Set<string> | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) ? new Set(parsed.map(String)) : null;
  } catch { return null; }
}

/** Pure count of ids not yet known; a missing baseline counts nothing. */
export function countNewRadarIds(ids: string[], known: ReadonlySet<string> | null): number {
  if (!known) return 0;
  return ids.reduce((n, id) => (known.has(id) ? n : n + 1), 0);
}

/** Record ids as known (Radar opened, or first baseline). */
export function markRadarSeen(ids: string[]) {
  try {
    const known = readKnown() ?? new Set<string>();
    ids.forEach((id) => known.add(String(id)));
    window.localStorage.setItem(KEY, JSON.stringify(Array.from(known).slice(-5000)));
    window.dispatchEvent(new Event(EVENT));
  } catch { /* storage blocked: no badge */ }
}

export function useRadarBadgeCount(): number {
  const { data } = useQuery(radarQuery);
  const [tick, setTick] = useState(0);
  const [count, setCount] = useState(0);
  useEffect(() => {
    const bump = () => setTick((t) => t + 1);
    window.addEventListener(EVENT, bump);
    window.addEventListener("storage", bump);
    return () => { window.removeEventListener(EVENT, bump); window.removeEventListener("storage", bump); };
  }, []);
  useEffect(() => {
    if (!data) return;
    const ids = data.map((j) => String(j.id));
    const known = readKnown();
    if (!known) { markRadarSeen(ids); return; }
    setCount(countNewRadarIds(ids, known));
  }, [data, tick]);
  return count;
}
