// Browser-safe helper: groups the free-text contract values stored in offers into filter families.

export const CONTRACT_FAMILIES = [
  { id: "suplencias", label: "Suplencias" },
  { id: "m18", label: "18 meses" },
  { id: "m12", label: "12 meses" },
  { id: "y1", label: "1 año" },
  { id: "y2", label: "2 años" },
  { id: "otros_plazos", label: "Otros plazos" },
  { id: "fecha", label: "Hasta una fecha" },
  { id: "toma", label: "Desde la toma de posesión" },
  { id: "prueba", label: "A prueba" },
  { id: "indefinido", label: "Indefinido" },
  { id: "jornalero", label: "Jornalero" },
  { id: "zafral", label: "Zafral" },
  { id: "pasantia", label: "Pasantía" },
  { id: "arrendamiento", label: "Arrendamiento" },
  { id: "otro", label: "Otro" },
] as const;

export type JobContractFamily = (typeof CONTRACT_FAMILIES)[number]["id"];
export type JobContractFields = { tipoContrato: string | null };

const normalize = (value: string) =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[\s\u00a0]+/g, " ").trim().toLowerCase();

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

  if (/suplen|interinato/.test(text)) return "suplencias";
  if (/pasant/.test(text)) return "pasantia";
  if (/\ba prueba\b|prueba de evaluacion/.test(text)) return "prueba";
  if (/arrendamiento/.test(text)) return "arrendamiento";
  if (/zafral/.test(text)) return "zafral";
  if (/jornal/.test(text)) return "jornalero";
  if (/indefinido|indeterminado/.test(text)) return "indefinido";

  // "18 sujeto a evaluacion de desempeno" is an 18-month contract without the word "meses".
  if (/^18\b/.test(text)) return "m18";

  const months = text.match(/(\d{1,2})\s*meses?/);
  if (months) {
    const count = Number(months[1]);
    if (count === 18) return "m18";
    if (count === 12) return "m12";
    if (count === 24) return "y2";
    return "otros_plazos";
  }
  if (/\bdos anos?\b|\b2 anos?\b/.test(text)) return "y2";
  if (/\b(un ano|1 ano|\d{1,2} anos?)\b/.test(text)) return "y1";
  if (/\d{1,3}\s*dias\b/.test(text)) return "otros_plazos";

  if (/toma de posesi|t\. ?p\.|\btp\b/.test(text)) return "toma";
  if (/\d{1,2}[/.-]\d{1,2}|\d{4}|diciembre|marzo|temporada/.test(text)) return "fecha";
  return "otro";
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
