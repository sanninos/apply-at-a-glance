/**
 * Curriculum editing: one curriculum per account, stored in public.curriculums
 * with own-row RLS. The screen edits a local draft; the payload builder below
 * cleans it before saving, dropping blank rows and normalizing fields.
 */

export type ExperienceDraft = {
  id: string;
  puesto: string;
  empresa: string;
  desde: string;
  hasta: string;
  descripcion: string;
  lugar: string;
  actualmente: boolean;
  recomienda: boolean;
  ratingGeneral: number;
  ratingAmbiente: number;
  ratingDirector: number;
  ratingSalario: number;
  ratingOportunidades: number;
};
export type EducationDraft = { id: string; titulo: string; institucion: string; desde: string; hasta: string };

export type CurriculumDraft = {
  fullName: string;
  firstName: string;
  lastName: string;
  documentType: string;
  documentNumber: string;
  birthDate: string;
  gender: string;
  phone: string;
  phoneCountryCode: string;
  extraPhone: string;
  country: string;
  city: string;
  nationality: string;
  summary: string;
  experiences: ExperienceDraft[];
  education: EducationDraft[];
  skills: string;
};

export type CurriculumRow = {
  full_name: string | null;
  // Personal fields were added later; rows saved before them omit the keys.
  first_name?: string | null;
  last_name?: string | null;
  document_type?: string | null;
  document_number?: string | null;
  birth_date?: string | null;
  gender?: string | null;
  phone: string | null;
  phone_country_code?: string | null;
  extra_phone?: string | null;
  country?: string | null;
  city?: string | null;
  nationality?: string | null;
  summary: string | null;
  experiences: unknown;
  education: unknown;
  skills: unknown;
};

export type CurriculumPayload = {
  full_name: string;
  first_name: string | null;
  last_name: string | null;
  document_type: string | null;
  document_number: string | null;
  birth_date: string | null;
  gender: string | null;
  phone: string | null;
  phone_country_code: string | null;
  extra_phone: string | null;
  country: string | null;
  city: string | null;
  nationality: string | null;
  summary: string | null;
  experiences: {
    puesto: string;
    empresa: string;
    desde: string;
    hasta: string;
    descripcion: string;
    lugar: string;
    actualmente: boolean;
    recomienda: boolean;
    ratingGeneral: number;
    ratingAmbiente: number;
    ratingDirector: number;
    ratingSalario: number;
    ratingOportunidades: number;
  }[];
  education: { titulo: string; institucion: string; desde: string; hasta: string }[];
  skills: string[];
};

let idCounter = 0;
export function newDraftId(): string {
  idCounter += 1;
  return `draft-${idCounter}`;
}

export function emptyExperience(): ExperienceDraft {
  return { id: newDraftId(), puesto: "", empresa: "", desde: "", hasta: "", descripcion: "", lugar: "", actualmente: false, recomienda: false, ratingGeneral: 0, ratingAmbiente: 0, ratingDirector: 0, ratingSalario: 0, ratingOportunidades: 0 };
}

export function emptyEducation(): EducationDraft {
  return { id: newDraftId(), titulo: "", institucion: "", desde: "", hasta: "" };
}

export function emptyCurriculum(): CurriculumDraft {
  return {
    fullName: "",
    firstName: "",
    lastName: "",
    documentType: "Cédula de identidad",
    documentNumber: "",
    birthDate: "",
    gender: "",
    phone: "",
    phoneCountryCode: "UY (+598)",
    extraPhone: "",
    country: "Uruguay",
    city: "",
    nationality: "Uruguaya",
    summary: "",
    experiences: [emptyExperience()],
    education: [emptyEducation()],
    skills: "",
  };
}

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function bool(value: unknown): boolean {
  return value === true;
}

function rating(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.min(5, Math.max(0, Math.round(parsed)));
}

/** Reads a stored row into the editable draft, tolerating malformed jsonb. */
export function toCurriculumDraft(row: CurriculumRow): CurriculumDraft {
  const experiences = Array.isArray(row.experiences)
    ? row.experiences.map((entry) => {
        const record = (entry ?? {}) as Partial<ExperienceDraft>;
        return {
          id: newDraftId(),
          puesto: str(record.puesto),
          empresa: str(record.empresa),
          desde: str(record.desde),
          hasta: str(record.hasta),
          descripcion: str(record.descripcion),
          lugar: str(record.lugar),
          actualmente: bool(record.actualmente),
          recomienda: bool(record.recomienda),
          ratingGeneral: rating(record.ratingGeneral),
          ratingAmbiente: rating(record.ratingAmbiente),
          ratingDirector: rating(record.ratingDirector),
          ratingSalario: rating(record.ratingSalario),
          ratingOportunidades: rating(record.ratingOportunidades),
        };
      })
    : [];
  const education = Array.isArray(row.education)
    ? row.education.map((entry) => {
        const record = (entry ?? {}) as Partial<EducationDraft>;
        return { id: newDraftId(), titulo: str(record.titulo), institucion: str(record.institucion), desde: str(record.desde), hasta: str(record.hasta) };
      })
    : [];
  const skills = Array.isArray(row.skills) ? row.skills.map(str).filter(Boolean).join(", ") : "";
  const firstName = str(row.first_name);
  const lastName = str(row.last_name);
  // Rows saved before the name was split keep only full_name; prefill the
  // first field with it so nothing appears lost.
  return {
    fullName: str(row.full_name),
    firstName: firstName || (!lastName ? str(row.full_name) : ""),
    lastName,
    documentType: str(row.document_type) || "Cédula de identidad",
    documentNumber: str(row.document_number),
    birthDate: str(row.birth_date),
    gender: str(row.gender),
    phone: str(row.phone),
    phoneCountryCode: str(row.phone_country_code) || "UY (+598)",
    extraPhone: str(row.extra_phone),
    country: str(row.country) || "Uruguay",
    city: str(row.city),
    nationality: str(row.nationality) || "Uruguaya",
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
  const firstName = draft.firstName.trim();
  const lastName = draft.lastName.trim();
  const fullName = [firstName, lastName].filter(Boolean).join(" ") || draft.fullName.trim();
  if (fullName.length < 2) return { ok: false, error: "Escribí tu nombre completo para guardar el curriculum." };
  const birthDate = draft.birthDate.trim();
  if (birthDate && !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) return { ok: false, error: "Revisá la fecha de nacimiento." };
  const skills = draft.skills
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean);
  const experiences = draft.experiences
    .filter((entry) => !isBlank(entry.puesto, entry.empresa, entry.desde, entry.hasta, entry.descripcion, entry.lugar) || entry.recomienda || entry.ratingGeneral > 0 || entry.ratingAmbiente > 0 || entry.ratingDirector > 0 || entry.ratingSalario > 0 || entry.ratingOportunidades > 0)
    .map((entry) => ({
      puesto: entry.puesto.trim(),
      empresa: entry.empresa.trim(),
      desde: entry.desde.trim(),
      hasta: entry.actualmente ? "Actualidad" : entry.hasta.trim(),
      descripcion: entry.descripcion.trim(),
      lugar: entry.lugar.trim(),
      actualmente: entry.actualmente,
      recomienda: entry.recomienda,
      ratingGeneral: rating(entry.ratingGeneral),
      ratingAmbiente: rating(entry.ratingAmbiente),
      ratingDirector: rating(entry.ratingDirector),
      ratingSalario: rating(entry.ratingSalario),
      ratingOportunidades: rating(entry.ratingOportunidades),
    }));
  const education = draft.education
    .filter((entry) => !isBlank(entry.titulo, entry.institucion, entry.desde, entry.hasta))
    .map((entry) => ({ titulo: entry.titulo.trim(), institucion: entry.institucion.trim(), desde: entry.desde.trim(), hasta: entry.hasta.trim() }));
  return {
    ok: true,
    payload: {
      full_name: fullName,
      first_name: firstName || null,
      last_name: lastName || null,
      document_type: draft.documentType.trim() || null,
      document_number: draft.documentNumber.trim() || null,
      birth_date: birthDate || null,
      gender: draft.gender.trim() || null,
      phone: draft.phone.trim() || null,
      phone_country_code: draft.phoneCountryCode.trim() || null,
      extra_phone: draft.extraPhone.trim() || null,
      country: draft.country.trim() || null,
      city: draft.city.trim() || null,
      nationality: draft.nationality.trim() || null,
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
