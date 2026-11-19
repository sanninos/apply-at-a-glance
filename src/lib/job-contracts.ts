// Browser-safe helper: groups the free-text contract values stored in offers into filter families.

export const CONTRACT_FAMILIES = [
  { id: "indefinido", label: "Tiempo indeterminado" },
  { id: "plazo_fijo", label: "Plazo fijo" },
  { id: "obra", label: "Obra determinada" },
  { id: "eventual", label: "Eventual" },
  { id: "zafral", label: "Temporada o zafral" },
  { id: "suplencia", label: "Suplencia o sustitución" },
  { id: "aprendizaje", label: "Aprendizaje" },
  { id: "practica", label: "Práctica laboral para egresados" },
  { id: "primera_experiencia", label: "Primera experiencia laboral" },
  { id: "prueba", label: "A prueba" },
] as const;

export type JobContractFamily = (typeof CONTRACT_FAMILIES)[number]["id"];
export type JobContractFields = { tipoContrato: string | null };

const normalize = (value: string) =>
  value.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[\s ]+/g, " ").trim().toLowerCase();

/** Values that carry no contract information at all ("0", "-", "ver bases", a salary...). */
function isUninformative(text: string) {
  return (
    !text ||
    /^[-–—._]+$/.test(text) ||
    /^0+$/.test(text) ||
    /^n\/?a$/.test(text) ||
    /^no corresponde/.test(text) ||
    /^ver /.test(text) ||
    text.includes("$") ||
    /\bpresencial\b/.test(text)
  );
}

/** Filter family of a stored contract text, or null when the offer does not state one. */
export function contractFamily(value: string | null | undefined): JobContractFamily | null {
  const text = normalize(value || "");
  if (isUninformative(text)) return null;

  if (/\ba prueba\b|prueba de evaluacion/.test(text)) return "prueba";
  if (/suplen|interinato|sustituc/.test(text)) return "suplencia";
  if (/pasant|practica laboral/.test(text)) return "practica";
  if (/aprendiz/.test(text)) return "aprendizaje";
  if (/primera experiencia|primer empleo|jovenes? profesionales?/.test(text)) return "primera_experiencia";
  if (/obra determinada|por obra\b/.test(text)) return "obra";
  if (/zafral|temporada/.test(text)) return "zafral";
  if (/eventual|jornal|destajo/.test(text)) return "eventual";
  if (/indefinido|indeterminado/.test(text)) return "indefinido";

  // Any stated term (months, years, days, an end date, "a término") is a fixed-term contract.
  if (/^18\b/.test(text)) return "plazo_fijo";
  if (/\d{1,2}\s*meses?/.test(text)) return "plazo_fijo";
  if (/\b(dos|un|1|2|\d{1,2}) anos?\b/.test(text)) return "plazo_fijo";
  if (/\d{1,3}\s*dias\b/.test(text)) return "plazo_fijo";
  if (/toma de posesi|t\. ?p\.|\btp\b/.test(text)) return "plazo_fijo";
  if (/\d{1,2}[/.-]\d{1,2}|\d{4}|diciembre|marzo|a termino/.test(text)) return "plazo_fijo";
  return null;
}

/** True when the job belongs to `family`, or when no contract family is filtered. */
export function matchesContract(job: JobContractFields, family: string) {
  if (!family) return true;
  return contractFamily(job.tipoContrato) === family;
}

/** Families actually present in `jobs`, in the order the filter shows them. */
export function contractFamiliesIn(jobs: JobContractFields[]): JobContractFamily[] {
  const present = new Set(jobs.map((job) => contractFamily(job.tipoContrato)).filter((id): id is JobContractFamily => id !== null));
  return CONTRACT_FAMILIES.filter((family) => present.has(family.id)).map((family) => family.id);
}
