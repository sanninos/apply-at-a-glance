import { describe, expect, it } from "vitest";
import { avatarUrlOf } from "@/components/app-bottom-nav";

describe("avatarUrlOf", () => {
  it("devuelve null sin usuario", () => {
    expect(avatarUrlOf(null)).toBeNull();
  });

  it("usa avatar_url de los metadatos (Google/Supabase)", () => {
    expect(
      avatarUrlOf({ user_metadata: { avatar_url: "https://example.com/foto.png" } }),
    ).toBe("https://example.com/foto.png");
  });

  it("acepta picture como alternativa", () => {
    expect(
      avatarUrlOf({ user_metadata: { picture: "https://example.com/pic.jpg" } }),
    ).toBe("https://example.com/pic.jpg");
  });

  it("ignora valores vacíos o no texto", () => {
    expect(avatarUrlOf({ user_metadata: { avatar_url: "   " } })).toBeNull();
    expect(avatarUrlOf({ user_metadata: { avatar_url: 42 } })).toBeNull();
    expect(avatarUrlOf({ user_metadata: {} })).toBeNull();
  });
});
