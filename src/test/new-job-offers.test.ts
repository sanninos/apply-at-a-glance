import { beforeEach, describe, expect, it } from "vitest";
import { isNewUnseenOffer, jobViewsKey, markJobViewed, readViewedJobs } from "@/lib/new-job-offers";

const now = Date.parse("2026-11-02T22:38:00Z");
const offer = { id: 42, created_at: "2026-11-02T22:00:00Z", isLlamado: false };

describe("new unseen job offers", () => {
  beforeEach(() => window.localStorage.clear());
  it("requires isLlamado to be exactly false", () => {
    expect(isNewUnseenOffer(offer, new Set(), now)).toBe(true);
    expect(isNewUnseenOffer({ ...offer, isLlamado: true }, new Set(), now)).toBe(false);
    expect(isNewUnseenOffer({ ...offer, isLlamado: null }, new Set(), now)).toBe(false);
  });
  it("includes exactly 24 hours but excludes older, future and invalid publications", () => {
    const at = (age: number) => ({ ...offer, created_at: new Date(now - age).toISOString() });
    expect(isNewUnseenOffer(at(24 * 3600000), new Set(), now)).toBe(true);
    expect(isNewUnseenOffer(at(24 * 3600000 + 1), new Set(), now)).toBe(false);
    expect(isNewUnseenOffer(at(-1), new Set(), now)).toBe(false);
    expect(isNewUnseenOffer({ ...offer, created_at: "invalid" }, new Set(), now)).toBe(false);
  });
  it("removes the badge after viewing and retains that state across reads", () => {
    expect(isNewUnseenOffer(offer, readViewedJobs(null), now)).toBe(true);
    markJobViewed(42, null);
    markJobViewed(42, null);
    expect([...readViewedJobs(null)]).toEqual(["42"]);
    expect(isNewUnseenOffer(offer, readViewedJobs(null), now)).toBe(false);
  });
  it("isolates viewed history between accounts and guests", () => {
    markJobViewed(42, "account-a");
    expect(readViewedJobs("account-a").has("42")).toBe(true);
    expect(readViewedJobs("account-b").has("42")).toBe(false);
    expect(readViewedJobs(null).has("42")).toBe(false);
  });
  it("ignores corrupt storage and invalid job identifiers", () => {
    window.localStorage.setItem(jobViewsKey(null), "invalid");
    expect(readViewedJobs(null).size).toBe(0);
    markJobViewed(NaN, null);
    expect(readViewedJobs(null).size).toBe(0);
  });
});