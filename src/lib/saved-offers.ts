import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

export const savedOfferInput = z.object({ jobId: z.number().int().positive(), saved: z.boolean() });
export const savedOfferId = z.object({ jobId: z.number().int().positive() });

export async function persistSavedOffer(client: SupabaseClient<Database>, userId: string, input: z.infer<typeof savedOfferInput>) {
  const { jobId, saved } = savedOfferInput.parse(input);
  const result = saved
    ? await client.from('ofertas_guardadas').upsert({ user_id: userId, job_id: jobId }, { onConflict: 'user_id,job_id', ignoreDuplicates: true })
    : await client.from('ofertas_guardadas').delete().eq('user_id', userId).eq('job_id', jobId);
  if (result.error) throw new Error('No pudimos actualizar tus ofertas guardadas. Intentá nuevamente.');
  return { saved };
}