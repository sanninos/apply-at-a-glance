import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';

const AccessContext = createContext<{ user: User | null; ready: boolean }>({ user: null, ready: false });
export const useAccess = () => useContext(AccessContext);

export function AccessProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const queryClient = useQueryClient();
  const router = useRouter();
  useEffect(() => {
    let mounted = true;
    let transitioned = false;
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (!['SIGNED_IN', 'SIGNED_OUT', 'USER_UPDATED'].includes(event)) return;
      transitioned = true;
      setUser(session?.user ?? null);
      setReady(true);
      void router.invalidate();
      if (event !== 'SIGNED_OUT') void queryClient.invalidateQueries();
    });
    void supabase.auth.getUser().then(({ data }) => {
      if (!mounted || transitioned) return;
      setUser(data.user);
      setReady(true);
    }).catch(() => { if (mounted) setReady(true); });
    return () => { mounted = false; data.subscription.unsubscribe(); };
  }, [queryClient, router]);
  return <AccessContext.Provider value={{ user, ready }}>{children}</AccessContext.Provider>;
}