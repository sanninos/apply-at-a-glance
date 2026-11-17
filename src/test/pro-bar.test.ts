import { describe, expect, it } from "vitest";
import { PRO_BAR_AFTER, proBarSlotIndex } from "@/lib/pro-bar";

describe("PRO bar placement", () => {
  it("sits right after the third offer", () => {
    expect(PRO_BAR_AFTER).toBe(3);
    expect(proBarSlotIndex(3)).toBe(2);
    expect(proBarSlotIndex(12)).toBe(2);
  });

  it("leaves the middle slot empty when the list is shorter than three offers", () => {
    expect(proBarSlotIndex(0)).toBe(-1);
    expect(proBarSlotIndex(2)).toBe(-1);
  });
});
