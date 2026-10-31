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