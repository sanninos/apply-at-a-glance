/**
 * Curriculum editing: one curriculum per account, stored in public.curriculums
 * with own-row RLS. The screen edits a local draft; the payload builder below
 * cleans it before saving, dropping blank rows and normalizing fields.
 */

export type ExperienceDraft = { id: string; puesto: string; empresa: string; desde: string; hasta: string; descripcion: string };
export type EducationDraft = { id: string; titulo: string; institucion: string; desde: string; hasta: string };

export type CurriculumDraft = {
  fullName: string;
  phone: string;
  summary: string;
  experiences: ExperienceDraft[];
  education: EducationDraft[];
  skills: string;
};

export type CurriculumRow = {
  full_name: string | null;
  phone: string | null;
  summary: string | null;
  experiences: unknown;
  education: unknown;
  skills: unknown;
};

export type CurriculumPayload = {
  full_name: string;
  phone: string | null;
  summary: string | null;
  experiences: { puesto: string; empresa: string; desde: string; hasta: string; descripcion: string }[];
  education: { titulo: string; institucion: string; desde: string; hasta: string }[];
  skills: string[];
};

let idCounter = 0;
export function newDraftId(): string {
  idCounter += 1;
  return `draft-${idCounter}`;
}

export function emptyExperience(): ExperienceDraft {
  return { id: newDraftId(), puesto: "", empresa: "", desde: "", hasta: "", descripcion: "" };
}

export function emptyEducation(): EducationDraft {
  return { id: newDraftId(), titulo: "", institucion: "", desde: "", hasta: "" };
}

export function emptyCurriculum(): CurriculumDraft {
  return { fullName: "", phone: "", summary: "", experiences: [emptyExperience()], education: [emptyEducation()], skills: "" };
}

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/** Reads a stored row into the editable draft, tolerating malformed jsonb. */
export function toCurriculumDraft(row: CurriculumRow): CurriculumDraft {
  const experiences = Array.isArray(row.experiences)
    ? row.experiences.map((entry) => {
        const record = (entry ?? {}) as Record<string, unknown>;
        return { id: newDraftId(), puesto: str(record.puesto), empresa: str(record.empresa), desde: str(record.desde), hasta: str(record.hasta), descripcion: str(record.descripcion) };
      })
    : [];
  const education = Array.isArray(row.education)
    ? row.education.map((entry) => {
        const record = (entry ?? {}) as Record<string, unknown>;
        return { id: newDraftId(), titulo: str(record.titulo), institucion: str(record.institucion), desde: str(record.desde), hasta: str(record.hasta) };
      })
    : [];
  const skills = Array.isArray(row.skills) ? row.skills.map(str).filter(Boolean).join(", ") : "";
  return {
    fullName: str(row.full_name),
    phone: str(row.phone),
    summary: str(row.summary),
    experiences: experiences.length > 0 ? [...experiences, emptyExperience()] : emptyCurriculum().experiences,
    education: education.length > 0 ? [...education, emptyEducation()] : emptyCurriculum().education,
    skills,
  };
}

function isBlank(...values: string[]): boolean {
  return values.every((value) => String(value ?? "").trim() === "");
}

/** Builds the upsert payload, dropping blank rows; requires a name. */
export function curriculumPayload(draft: CurriculumDraft): { ok: true; payload: CurriculumPayload } | { ok: false; error: string } {
  const fullName = draft.fullName.trim();
  if (fullName.length < 2) return { ok: false, error: "Escribí tu nombre completo para guardar el curriculum." };
  const skills = draft.skills
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean);
  const experiences = draft.experiences
    .filter((entry) => !isBlank(entry.puesto, entry.empresa, entry.desde, entry.hasta, entry.descripcion))
    .map((entry) => ({ puesto: entry.puesto.trim(), empresa: entry.empresa.trim(), desde: entry.desde.trim(), hasta: entry.hasta.trim(), descripcion: entry.descripcion.trim() }));
  const education = draft.education
    .filter((entry) => !isBlank(entry.titulo, entry.institucion, entry.desde, entry.hasta))
    .map((entry) => ({ titulo: entry.titulo.trim(), institucion: entry.institucion.trim(), desde: entry.desde.trim(), hasta: entry.hasta.trim() }));
  return {
    ok: true,
    payload: {
      full_name: fullName,
      phone: draft.phone.trim() || null,
      summary: draft.summary.trim() || null,
      experiences,
      education,
      skills,
    },
  };
}

export function curriculumCountLabel(skills: number): string {
  return skills === 1 ? "1 habilidad" : `${skills} habilidades`;
}
