import type { JobListItem } from "@/lib/job-list";

export const JOB_VIEWS_EVENT = "uru-job-views-changed";
export const jobViewsKey = (userId: string | null) => `uru-job-views:${userId || "guest"}`;

export function isNewUnseenOffer(job: Pick<JobListItem, "id" | "created_at" | "isLlamado">, seen: ReadonlySet<string>, now: number) {
  const age = now - Date.parse(job.created_at);
  return job.isLlamado === false && Number.isFinite(age) && age >= 0 && age <= 24 * 60 * 60 * 1000 && !seen.has(String(job.id));
}

export function readViewedJobs(userId: string | null): Set<string> {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(jobViewsKey(userId)) || "[]");
    return new Set(Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : []);
  } catch {
    return new Set();
  }
}

/** Called only after a detail screen renders, never by a loader or prefetch. */
export function markJobViewed(jobId: number, userId: string | null) {
  if (!Number.isSafeInteger(jobId) || jobId <= 0) return;
  const seen = readViewedJobs(userId);
  const id = String(jobId);
  if (seen.has(id)) return;
  seen.add(id);
  try {
    window.localStorage.setItem(jobViewsKey(userId), JSON.stringify([...seen]));
    window.dispatchEvent(new Event(JOB_VIEWS_EVENT));
  } catch {
    // Blocked storage must not prevent opening an offer.
  }
}