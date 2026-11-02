import { useEffect, useState } from "react";
import { useAccess } from "@/components/access-provider";
import { JOB_VIEWS_EVENT, readViewedJobs } from "@/lib/new-job-offers";

export function useNewJobOffers() {
  const { user, ready } = useAccess();
  const userId = user?.id || null;
  const [snapshot, setSnapshot] = useState<{ userId: string | null; seen: Set<string>; now: number } | null>(null);
  useEffect(() => {
    if (!ready) return;
    const refresh = () => setSnapshot({ userId, seen: readViewedJobs(userId), now: Date.now() });
    refresh();
    const interval = window.setInterval(refresh, 1000);
    window.addEventListener(JOB_VIEWS_EVENT, refresh);
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener(JOB_VIEWS_EVENT, refresh);
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [userId, ready]);
  return ready && snapshot?.userId === userId ? snapshot : null;
}