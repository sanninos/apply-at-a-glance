import { describe, expect, it } from "vitest";
import { activeSearchDaysLeft, activeSearchUntil, isActiveSearch } from "./active-search";

const now = new Date("2026-11-08T12:00:00Z");

describe("búsqueda activa", () => {
  it("dura 7 días", () => {
    expect(activeSearchUntil(now)).toBe("2026-11-15T12:00:00.000Z");
  });
  it("expira después de 7 días", () => {
    const until = activeSearchUntil(now);
    expect(isActiveSearch(until, new Date("2026-11-15T11:59:00Z"))).toBe(true);
    expect(isActiveSearch(until, new Date("2026-11-15T12:01:00Z"))).toBe(false);
  });
  it("cuenta los días restantes", () => {
    expect(activeSearchDaysLeft(activeSearchUntil(now), now)).toBe(7);
    expect(activeSearchDaysLeft(null, now)).toBe(0);
  });
});
