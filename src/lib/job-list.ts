export type JobListItem = {
  id: number;
  titulo: string | null;
  descripcion: string | null;
  Empresa: string | null;
  ubicacion: string | null;
  ciudad: string | null;
  fotoEmpresa: string | null;
  image: string | null;
  created_at: string;
  isFeatured: boolean | null;
  isLlamado: boolean | null;
  estado_postulacion: string | null;
  tipoContrato: string | null;
  puesto?: string | null;
};

export type JobListMode = "all" | "urgent" | "latest";

const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export function filterJobs(jobs: JobListItem[], search: string, mode: JobListMode, location = "", contract = "") {
  const sorted = [...jobs].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
  const source = mode === "latest" ? sorted.slice(0, 36) : mode === "urgent" ? sorted.filter(isUrgent) : sorted;
  const result = source.filter((job) => {
    const text = normalize([job.titulo, job.Empresa, job.descripcion, job.ubicacion, job.ciudad].filter(Boolean).join(" "));
    return text.includes(normalize(search.trim())) && (!location || (job.ciudad || job.ubicacion) === location) && (!contract || job.tipoContrato === contract);
  }).sort((a, b) => mode === "all" ? Number(Boolean(b.isFeatured)) - Number(Boolean(a.isFeatured)) : 0);
  return interleaveOffers(result);
}

/** Mixes the list so every 5 regular offers are followed by 1 llamado; leftovers go at the end. */
export function interleaveOffers(jobs: JobListItem[], offersPerLlamado = 5) {
  const offers = jobs.filter((job) => !job.isLlamado);
  const llamados = jobs.filter((job) => job.isLlamado);
  const mixed: JobListItem[] = [];
  let o = 0, l = 0;
  while (o < offers.length || l < llamados.length) {
    for (let i = 0; i < offersPerLlamado && o < offers.length; i++) mixed.push(offers[o++]!);
    if (l < llamados.length) mixed.push(llamados[l++]!);
    if (o >= offers.length) while (l < llamados.length) mixed.push(llamados[l++]!);
  }
  return mixed;
}

export function isUrgent(job: JobListItem) {
  return normalize(job.estado_postulacion || "").includes("urgente");
}

export function publishedAgo(date: string, now = Date.now()) {
  const days = Math.max(0, Math.floor((now - Date.parse(date)) / 86400000));
  if (!Number.isFinite(days)) return "";
  return days === 0 ? "Hoy" : days === 1 ? "Hace 1 día" : `Hace ${days} días`;
}

export function publishedInLastDaysCount(jobs: JobListItem[], days = 7, now = Date.now()) {
  const cutoff = now - days * 86400000;
  return jobs.filter((job) => {
    const published = Date.parse(job.created_at);
    return Number.isFinite(published) && published >= cutoff;
  }).length;
}
/** Unique job titles that contain the typed text (accent-insensitive), best matches first. */
export function searchSuggestions(jobs: JobListItem[], query: string, max = 6) {
  const q = normalize(query.trim());
  if (!q) return [];
  const seen = new Map<string, string>();
  for (const job of jobs) {
    const title = job.titulo?.trim();
    if (!title) continue;
    const key = normalize(title);
    if (key.includes(q) && key !== q && !seen.has(key)) seen.set(key, title);
  }
  return [...seen.entries()].sort(([a], [b]) => Number(!a.startsWith(q)) - Number(!b.startsWith(q)) || a.length - b.length).slice(0, max).map(([, title]) => title);
}
