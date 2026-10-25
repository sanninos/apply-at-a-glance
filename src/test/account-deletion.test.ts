import { describe, expect, it, vi } from 'vitest';
import { accountDeletionSchema, persistDeletionRequest } from '../lib/account-deletion';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../integrations/supabase/types';

const valid = { fullName: 'Ana Pérez', email: 'ana@example.com', reason: '', confirmed: true };
describe('account deletion request validation', () => {
  it('accepts a confirmed request without an optional reason', () => {
    expect(accountDeletionSchema.safeParse(valid).success).toBe(true);
  });
  it('rejects a request without explicit confirmation', () => {
    expect(accountDeletionSchema.safeParse({ ...valid, confirmed: false }).success).toBe(false);
  });
  it('rejects an invalid email', () => {
    expect(accountDeletionSchema.safeParse({ ...valid, email: 'not-an-email' }).success).toBe(false);
  });
  it('rejects an empty name', () => {
    expect(accountDeletionSchema.safeParse({ ...valid, fullName: '  ' }).success).toBe(false);
  });
  it('rejects oversized reasons', () => {
    expect(accountDeletionSchema.safeParse({ ...valid, reason: 'a'.repeat(1001) }).success).toBe(false);
  });
});

describe('request persistence', () => {
  const row = { id: 'request-1', status: 'pending', created_at: '2026-10-25T21:00:00Z' };
  function setup(error: { code: string } | null = null) {
    const insert = vi.fn().mockReturnValue({ select: () => ({ single: async () => ({ data: error ? null : row, error }) }) });
    const eq = vi.fn().mockReturnValue({ single: async () => ({ data: row, error: null }) });
    const from = vi.fn().mockReturnValue({ insert, select: () => ({ eq }) });
    return { client: { from } as unknown as SupabaseClient<Database>, insert, from, eq };
  }
  it('persists the authenticated identity and returns a receipt only after storage succeeds', async () => {
    const mock = setup();
    expect(await persistDeletionRequest(mock.client, 'owner-1', valid.email, valid)).toEqual(row);
    expect(mock.from).toHaveBeenCalledWith('account_deletion_requests');
    expect(mock.insert).toHaveBeenCalledWith({ user_id: 'owner-1', full_name: 'Ana Pérez', email: valid.email, reason: '', confirmed: true });
  });
  it('rejects another account email before writing', async () => {
    const mock = setup();
    await expect(persistDeletionRequest(mock.client, 'owner-1', 'other@example.com', valid)).rejects.toThrow('correo');
    expect(mock.insert).not.toHaveBeenCalled();
  });
  it('reuses an existing receipt when a repeated send hits the unique account constraint', async () => {
    const mock = setup({ code: '23505' });
    expect(await persistDeletionRequest(mock.client, 'owner-1', valid.email, valid)).toEqual(row);
    expect(mock.eq).toHaveBeenCalledWith('user_id', 'owner-1');
  });
  it('does not confirm a failed write', async () => {
    const mock = setup({ code: '42501' });
    await expect(persistDeletionRequest(mock.client, 'owner-1', valid.email, valid)).rejects.toThrow('No pudimos enviar');
  });
});