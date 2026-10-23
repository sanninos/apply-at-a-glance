import { describe, expect, it } from "vitest";
import { toSocialPosts, type SocialPostRow } from "@/lib/social-posts";

const row = (over: Partial<SocialPostRow>): SocialPostRow => ({
  id: 1,
  poster: "https://example.co/posters/1.jpg",
  titulo: "Guardia de Seguridad",
  Empresa: "Sildan Seguridad",
  ubicacion: "Libertad, San José",
  ciudad: "San José",
  fotoEmpresa: null,
  image: null,
  created_at: "2026-10-17T15:42:55.416Z",
  ...over,
});

describe("toSocialPosts", () => {
  it("keeps only rows that actually carry a poster url", () => {
    const posts = toSocialPosts([
      row({ id: 1 }),
      row({ id: 2, poster: null }),
      row({ id: 3, poster: "   " }),
      row({ id: 4, poster: "" }),
    ]);
    expect(posts.map((post) => post.id)).toEqual([1]);
  });

  it("orders posts newest first and drops repeated ids", () => {
    const posts = toSocialPosts([
      row({ id: 1132, created_at: "2026-10-12T02:14:42.000Z" }),
      row({ id: 1133, created_at: "2026-10-17T15:42:55.416Z" }),
      row({ id: 1133, created_at: "2026-10-17T15:42:55.416Z" }),
    ]);
    expect(posts.map((post) => post.id)).toEqual([1133, 1132]);
  });
});
