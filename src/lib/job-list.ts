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
  estado_postulacion: string | null;
  tipoContrato: string | null;
};

export type JobListMode = "all" | "urgent" | "latest";

const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export function filterJobs(jobs: JobListItem[], search: string, mode: JobListMode, location = "", contract = "") {
  const sorted = [...jobs].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
  const source = mode === "latest" ? sorted.slice(0, 36) : mode === "urgent" ? sorted.filter(isUrgent) : sorted;
  return source.filter((job) => {
    const text = normalize([job.titulo, job.Empresa, job.descripcion, job.ubicacion, job.ciudad].filter(Boolean).join(" "));
    return text.includes(normalize(search.trim())) && (!location || (job.ciudad || job.ubicacion) === location) && (!contract || job.tipoContrato === contract);
  }).sort((a, b) => mode === "all" ? Number(Boolean(b.isFeatured)) - Number(Boolean(a.isFeatured)) : 0);
}

export function isUrgent(job: JobListItem) {
  return normalize(job.estado_postulacion || "").includes("urgente");
}

export function publishedAgo(date: string, now = Date.now()) {
  const days = Math.max(0, Math.floor((now - Date.parse(date)) / 86400000));
  if (!Number.isFinite(days)) return "";
  return days === 0 ? "Hoy" : days === 1 ? "Hace 1 día" : `Hace ${days} días`;
}