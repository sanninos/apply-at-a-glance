import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

export const accountDeletionSchema = z.object({
  fullName: z.string().trim().min(1, 'Ingresá tu nombre completo.').max(100, 'El nombre admite hasta 100 caracteres.'),
  email: z.string().trim().email('Ingresá un correo electrónico válido.').max(255, 'El correo admite hasta 255 caracteres.'),
  reason: z.string().trim().max(1000, 'El motivo admite hasta 1000 caracteres.'),
  confirmed: z.boolean().refine(Boolean, 'Confirmá que querés solicitar la eliminación.'),
});

export async function persistDeletionRequest(client: SupabaseClient<Database>, userId: string, accountEmail: string, input: unknown) {
  const data = accountDeletionSchema.parse(input);
  if (data.email.toLowerCase() !== accountEmail.toLowerCase()) throw new Error('Usá el correo de tu cuenta actual.');
  const result = await client.from('account_deletion_requests').insert({ user_id: userId, full_name: data.fullName, email: accountEmail, reason: data.reason, confirmed: true }).select('id, created_at, status').single();
  if (!result.error && result.data) return result.data;
  if (result.error?.code === '23505') {
    const existing = await client.from('account_deletion_requests').select('id, created_at, status').eq('user_id', userId).single();
    if (!existing.error && existing.data) return existing.data;
  }
  throw new Error('No pudimos enviar la solicitud. Intentá nuevamente.');
}