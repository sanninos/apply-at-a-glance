import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { accountDeletionSchema, persistDeletionRequest } from './account-deletion';

export const sendDeletionRequest = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator(accountDeletionSchema)
  .handler(async ({ data, context }) => {
    const email = context.claims['email'];
    if (typeof email !== 'string' || !email) throw new Error('No pudimos verificar el correo de tu cuenta.');
    return persistDeletionRequest(context.supabase, context.userId, email, data);
  });

export const getDeletionRequest = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const result = await context.supabase.from('account_deletion_requests').select('id, created_at, status').eq('user_id', context.userId).maybeSingle();
    if (result.error) throw new Error('No pudimos comprobar tu solicitud.');
    return result.data;
  });