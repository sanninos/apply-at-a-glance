import { describe, expect, it } from 'vitest';
import { addRecent } from '../lib/recent-searches';
describe('addRecent', () => {
  it('keeps the last 5, newest first, without duplicates', () => {
    let l: string[] = [];
    for (const t of ['a', 'b', 'c', 'd', 'e', 'f']) l = addRecent(l, t);
    expect(l).toEqual(['f', 'e', 'd', 'c', 'b']);
    expect(addRecent(l, 'C')).toEqual(['C', 'f', 'e', 'd', 'b']);
  });
});
