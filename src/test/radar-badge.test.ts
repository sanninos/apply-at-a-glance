import { describe, expect, it } from "vitest";
import { countNewRadarIds } from "@/lib/radar-badge";
describe("radar badge", () => {
  it("counts only offers not seen in Radar", () => expect(countNewRadarIds(["1", "2", "3"], new Set(["1"]))).toBe(2));
  it("shows nothing before the first baseline", () => expect(countNewRadarIds(["1", "2"], null)).toBe(0));
});
