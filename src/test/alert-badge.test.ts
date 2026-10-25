import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../integrations/supabase/types';
import { readUnreadAlertCount } from '../lib/alert-badge-count';

function fakeClient(count: number | null, error: unknown = null) {
  const eq = vi.fn();
  eq.mockReturnValueOnce({ eq }).mockResolvedValueOnce({ count, error });
  const select = vi.fn().mockReturnValue({ eq });
  const from = vi.fn().mockReturnValue({ select });
  return { client: { from } as unknown as SupabaseClient<Database>, from, select, eq };
}

describe('real pending alert badge', () => {
  it('counts only unread notices belonging to the current account', async () => {
    const db = fakeClient(3);
    expect(await readUnreadAlertCount(db.client, 'account-a')).toBe(3);
    expect(db.eq.mock.calls).toEqual([['user_id', 'account-a'], ['is_read', false]]);
  });
  it('includes all notice types without counting active alert searches', async () => {
    const db = fakeClient(2);
    expect(await readUnreadAlertCount(db.client, 'account-a')).toBe(2);
    expect(db.from.mock.calls).toEqual([['Notificaciones']]);
    expect(db.select).toHaveBeenCalledWith('id', { count: 'exact', head: true });
  });
  it('returns zero when there are no pending notices', async () => {
    const db = fakeClient(0);
    expect(await readUnreadAlertCount(db.client, 'account-a')).toBe(0);
  });
  it('uses an exact count even above the row retrieval limit', async () => {
    const db = fakeClient(1234);
    expect(await readUnreadAlertCount(db.client, 'account-a')).toBe(1234);
    expect(db.select).toHaveBeenCalledWith('id', { count: 'exact', head: true });
  });
  it('does not fabricate zero when a read fails', async () => {
    const db = fakeClient(null, { message: 'denied' });
    await expect(readUnreadAlertCount(db.client, 'account-a')).rejects.toThrow();
  });
});