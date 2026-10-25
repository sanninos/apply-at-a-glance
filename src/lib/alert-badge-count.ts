import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

/** Alert searches are configuration, not unread notices. All notice types count once. */
export async function readUnreadAlertCount(client: SupabaseClient<Database>, userId: string): Promise<number> {
  const result = await client.from('Notificaciones')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);
  if (result.error || result.count === null) {
    throw new Error('No pudimos consultar tus avisos pendientes.');
  }
  return result.count;
}