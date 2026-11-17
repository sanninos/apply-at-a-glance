// Browser-safe helper: maps a job's stored locality to one of Uruguay's departments.

export const URUGUAY_DEPARTMENTS = [
  "Artigas",
  "Canelones",
  "Cerro Largo",
  "Colonia",
  "Durazno",
  "Flores",
  "Florida",
  "Lavalleja",
  "Maldonado",
  "Montevideo",
  "Paysandú",
  "Río Negro",
  "Rivera",
  "Rocha",
  "Salto",
  "San José",
  "Soriano",
  "Tacuarembó",
  "Treinta y Tres",
] as const;

export type UruguayDepartment = (typeof URUGUAY_DEPARTMENTS)[number];

/** Localities that belong to a department whose name is not written in the offer. */
const LOCALITY_DEPARTMENTS: Record<string, string> = {
  "barra de carrasco": "Canelones",
  "ciudad de la costa": "Canelones",
  "las piedras": "Canelones",
  "la paz": "Canelones",
  "pando": "Canelones",
  "tolosa": "Canelones",
  "atlantida": "Canelones",
  "pinamar": "Canelones",
  "progreso": "Canelones",
  "melo": "Cerro Largo",
  "colonia del sacramento": "Colonia",
  "nueva helvecia": "Colonia",
  "tarariras": "Colonia",
  "durazno": "Durazno",
  "trinidad": "Flores",
  "florida": "Florida",
  "sarandi grande": "Florida",
  "minas": "Lavalleja",
  "josé ignacio": "Maldonado",
  "punta del este": "Maldonado",
  "maldonado nuevo": "Maldonado",
  "san carlos": "Maldonado",
  "rocha nueva": "Maldonado",
  "paysandu": "Paysandú",
  "fray bento": "Río Negro",
  "young": "Río Negro",
  "nueva palmira": "Río Negro",
  "rivera": "Rivera",
  "rocha": "Rocha",
  "castillos": "Rocha",
  "la paloma": "Rocha",
  "salto": "Salto",
  "san jose de mayo": "San José",
  "libertad": "San José",
  "ecilda paolillo": "San José",
  "soriano": "Soriano",
  "mercedes": "Soriano",
  "dolores": "Soriano",
  "cardona": "Soriano",
  "tacuarembo": "Tacuarembó",
  "paso de los toros": "Tacuarembó",
  "treinta y tres": "Treinta y Tres",
  "bateas y bañado": "Treinta y Tres",
};

const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** True when `name` appears in `text` as a whole word (accent-insensitive). */
function mentionsWord(text: string, name: string) {
  const pattern = new RegExp(`(^|[^a-z0-9])${escapeRegExp(normalize(name))}($|[^a-z0-9])`);
  return pattern.test(text);
}

export type JobLocationFields = { ubicacion: string | null; ciudad: string | null };

/** Department of a job's locality, or null when the offer does not point to one. */
export function jobDepartment(job: JobLocationFields): string | null {
  const text = normalize([job.ciudad, job.ubicacion].filter(Boolean).join(", ").trim());
  if (!text) return null;

  for (const [locality, department] of Object.entries(LOCALITY_DEPARTMENTS)) {
    if (mentionsWord(text, locality)) return department;
  }

  const found = URUGUAY_DEPARTMENTS.filter((department) => mentionsWord(text, department));
  if (!found.length) return null;
  // "Av. Artigas 1234, Montevideo" names the street first: keep the last mention.
  return found.reduce((best, department) => (text.lastIndexOf(normalize(department)) > text.lastIndexOf(normalize(best)) ? department : best));
}

/** True when the job belongs to `department`, or when no department is filtered. */
export function matchesDepartment(job: JobLocationFields, department: string) {
  if (!department) return true;
  return jobDepartment(job) === department;
}
