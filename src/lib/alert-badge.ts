import { useQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { useAccess } from '@/components/access-provider';
import { getUnreadAlertCount } from './alert-badge.functions';

/** Shared per-account query; never delay public navigation for a private count. */
export function useAlertBadgeCount(): number {
  const { user, ready } = useAccess();
  const read = useServerFn(getUnreadAlertCount);
  const query = useQuery({
    queryKey: ['alert-badge', user?.id],
    enabled: ready && Boolean(user),
    queryFn: () => read(),
    staleTime: 30_000,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: 'always',
    retry: 1,
  });
  return ready && user && !query.isError ? query.data ?? 0 : 0;
}
