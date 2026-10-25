import { describe, expect, it } from 'vitest';
import { accountDeletionSchema } from '../lib/account-deletion';

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