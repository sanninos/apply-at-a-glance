import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { readUnreadAlertCount } from './alert-badge-count';

export const getUnreadAlertCount = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(({ context }) => readUnreadAlertCount(context.supabase, context.userId));