export type SocialPostRow = {
  id: number;
  poster: string | null;
  titulo: string | null;
  Empresa: string | null;
  ubicacion: string | null;
  ciudad: string | null;
  fotoEmpresa: string | null;
  image: string | null;
  created_at: string;
};

export type SocialPost = SocialPostRow & { poster: string };

const hasPoster = (row: SocialPostRow): row is SocialPost =>
  typeof row.poster === "string" && row.poster.trim().length > 0;

export function toSocialPosts(rows: SocialPostRow[]): SocialPost[] {
  const seen = new Set<number>();
  return rows
    .filter(hasPoster)
    .filter((row) => (seen.has(row.id) ? false : (seen.add(row.id), true)))
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
}
