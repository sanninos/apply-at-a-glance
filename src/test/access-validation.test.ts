import { describe, expect, it } from 'vitest';
import { registrationSchema } from '@/lib/access-validation';

describe('Registration profile', () => {
  it('keeps the full name for the user profile', () => {
    expect(registrationSchema.parse({ fullName: '  Dylan Sannino  ', email: 'dylan@example.com', password: 'password123' }).fullName).toBe('Dylan Sannino');
    expect(registrationSchema.safeParse({ fullName: '', email: 'dylan@example.com', password: 'password123' }).success).toBe(false);
  });
});