import { describe, expect, it } from 'vitest';
import { ALERT_RADIUS } from '../lib/alert-preferences';

describe('alert search area', () => {
  it('starts at the reference distance of 10 km', () => expect(ALERT_RADIUS.initial).toBe(10));
  it('allows a minimum of 1 km', () => expect(ALERT_RADIUS.min).toBe(1));
  it('allows a maximum of 50 km', () => expect(ALERT_RADIUS.max).toBe(50));
});