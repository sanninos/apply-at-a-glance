import { useEffect, useState } from "react";
import { useAccess } from "@/components/access-provider";
import { JOB_VIEWS_EVENT, readViewedJobs } from "@/lib/new-job-offers";
import type { JobListItem } from "@/lib/job-list";

export function useNewJobOffers(jobs: JobListItem[]) {
  const { user, ready } = useAccess();
  const userId = user?.id || null;
  const [snapshot, setSnapshot] = useState<{ userId: string | null; seen: Set<string>; now: number } | null>(null);
  useEffect(() => {
    if (!ready) return;
    let timer: number | undefined;
    const refresh = () => {
      window.clearTimeout(timer);
      const now = Date.now();
      setSnapshot({ userId, seen: readViewedJobs(userId), now });
      const boundaries = jobs.filter(job => job.isLlamado === false).map(job => Date.parse(job.created_at) + 24 * 60 * 60 * 1000 + 1).filter(expiry => expiry > now);
      if (boundaries.length) timer = window.setTimeout(refresh, Math.min(Math.min(...boundaries) - now, 24 * 60 * 60 * 1000));
    };
    refresh();
    window.addEventListener(JOB_VIEWS_EVENT, refresh);
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener(JOB_VIEWS_EVENT, refresh);
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [userId, ready, jobs]);
  return ready && snapshot?.userId === userId ? snapshot : null;
}