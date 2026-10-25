import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  countUnseenSocialPosters,
  markPosterSeen,
  recordSocialPosterIds,
} from "../lib/social-badge";

const IDS_KEY = "uru-social-poster-ids";
const SEEN_KEY = "uru-social-seen-posters";

describe("social badge", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it("counts nothing without a registered poster list", () => {
    expect(countUnseenSocialPosters()).toBe(0);
  });

  it("counts registered posters the user has not seen", () => {
    recordSocialPosterIds(["1", "2", "3"]);
    expect(countUnseenSocialPosters()).toBe(3);
  });

  it("marks a poster seen once and keeps the rest unseen", () => {
    recordSocialPosterIds(["1", "2", "3"]);
    markPosterSeen("2");
    markPosterSeen("2");
    expect(countUnseenSocialPosters()).toBe(2);
    expect(JSON.parse(window.localStorage.getItem(SEEN_KEY) || "[]")).toEqual(["2"]);
  });

  it("does not count removed posters anymore", () => {
    recordSocialPosterIds(["1", "2"]);
    markPosterSeen("1");
    recordSocialPosterIds(["2", "3"]);
    expect(countUnseenSocialPosters()).toBe(2);
    expect(JSON.parse(window.localStorage.getItem(IDS_KEY) || "[]")).toEqual(["2", "3"]);
  });

  it("ignores invalid stored data", () => {
    window.localStorage.setItem(IDS_KEY, "not-json");
    window.localStorage.setItem(SEEN_KEY, "{oops");
    expect(countUnseenSocialPosters()).toBe(0);
  });
});
