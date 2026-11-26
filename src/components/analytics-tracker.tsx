import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import { initAnalytics, trackPageView } from "@/lib/analytics";

export function AnalyticsTracker() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => { initAnalytics(); }, []);
  useEffect(() => { trackPageView(path); }, [path]);
  return null;
}
