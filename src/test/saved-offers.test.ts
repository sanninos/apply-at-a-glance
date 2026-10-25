import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../integrations/supabase/types';
import { persistSavedOffer, savedOfferInput } from '../lib/saved-offers';

function fakeClient(error: unknown = null) {
  const eq = vi.fn();
  eq.mockReturnValueOnce({ eq }).mockResolvedValueOnce({ error });
  const upsert = vi.fn().mockResolvedValue({ error });
  const remove = vi.fn().mockReturnValue({ eq });
  const from = vi.fn().mockReturnValue({ upsert, delete: remove });
  return { client: { from } as unknown as SupabaseClient<Database>, from, upsert, remove, eq };
}

describe('account-persisted saved offers', () => {
  it('adds one offer to the authenticated account without duplicating it', async () => {
    const db = fakeClient();
    expect(await persistSavedOffer(db.client, 'account-a', { jobId: 111, saved: true })).toEqual({ saved: true });
    expect(db.from).toHaveBeenCalledWith('ofertas_guardadas');
    expect(db.upsert).toHaveBeenCalledWith({ user_id: 'account-a', job_id: 111 }, { onConflict: 'user_id,job_id', ignoreDuplicates: true });
  });
  it('removes only the specified offer belonging to that account', async () => {
    const db = fakeClient();
    expect(await persistSavedOffer(db.client, 'account-a', { jobId: 111, saved: false })).toEqual({ saved: false });
    expect(db.remove).toHaveBeenCalledOnce();
    expect(db.eq.mock.calls).toEqual([['user_id', 'account-a'], ['job_id', 111]]);
    expect(db.upsert).not.toHaveBeenCalled();
  });
  it('does not report a saved offer when Supabase rejects the write', async () => {
    const db = fakeClient({ message: 'denied' });
    await expect(persistSavedOffer(db.client, 'account-a', { jobId: 111, saved: true })).rejects.toThrow();
  });
  it('rejects invalid offer ids before storing them', () => {
    expect(savedOfferInput.safeParse({ jobId: -1, saved: true }).success).toBe(false);
  });
});