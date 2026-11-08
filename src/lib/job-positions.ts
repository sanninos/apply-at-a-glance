import type { JobListItem } from "@/lib/job-list";

export type JobPosition = { id: string; nombre: string; icon: string | null };
const normalized = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();

export function jobsForPosition(jobs: JobListItem[], position: JobPosition) {
  return jobs.filter(job => normalized(job.puesto || "") === normalized(position.nombre));
}

export function positionIconUrl(icon: string | null) {
  if (!icon) return null;
  try {
    const url = new URL(icon);
    return url.protocol === "https:" ? url.href : null;
  } catch { return null; }
}

/** Canonical key used to match a job's puesto with a Puesto category name. */
export function normalizePositionName(value: string | null | undefined) { return normalized(value || ""); }

/** How many offers each position has, keyed by the canonical position name. */
export function countJobsByPosition(jobs: JobListItem[]) {
  const counts: Record<string, number> = {};
  for (const job of jobs) {
    const key = normalizePositionName(job.puesto);
    if (key) counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

export function positionCount(counts: Record<string, number> | undefined, position: JobPosition) {
  return counts?.[normalizePositionName(position.nombre)] ?? 0;
}

export function positionCountLabel(count: number) {
  return count === 0 ? "Sin ofertas" : count === 1 ? "1 empleo" : `${count} empleos`;
}