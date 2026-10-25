import type { CurriculumRow } from "@/lib/curriculum";
import { applicationStatus } from "@/lib/applications";

/**
 * Profile statistics: everything shown comes from the signed-in user's own
 * rows (RLS own-only tables). Profile visits are not tracked yet, so the
 * screen shows an honest empty state for them instead of a number.
 */

export type ApplicationStateRow = { estado: string };

export type PostulacionesSummary = {
  total: number;
  byEstado: { estado: string; label: string; tone: string; count: number }[];
};

export function summarizePostulaciones(rows: ApplicationStateRow[]): PostulacionesSummary {
  const counts = new Map<string, number>();
  for (const row of rows) counts.set(row.estado, (counts.get(row.estado) ?? 0) + 1);
  const byEstado = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([estado, count]) => {
      const status = applicationStatus(estado);
      return { estado, label: status.label, tone: status.tone, count };
    });
  return { total: rows.length, byEstado };
}

export type CurriculumSummary = {
  saved: boolean;
  experiences: number;
  education: number;
  skills: number;
};

export function summarizeCurriculum(row?: CurriculumRow): CurriculumSummary {
  return {
    saved: Boolean(row),
    experiences: Array.isArray(row?.experiences) ? row?.experiences.length ?? 0 : 0,
    education: Array.isArray(row?.education) ? row?.education.length ?? 0 : 0,
    skills: Array.isArray(row?.skills) ? row?.skills.length ?? 0 : 0,
  };
}

export function statCountLabel(total: number, singular: string, plural: string): string {
  return `${total} ${total === 1 ? singular : plural}`;
}
