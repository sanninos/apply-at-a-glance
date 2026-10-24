export type ApplicationJob = {
  id: number;
  titulo: string | null;
  Empresa: string | null;
  ubicacion: string | null;
  ciudad: string | null;
  fotoEmpresa: string | null;
  image: string | null;
  tipoContrato: string | null;
  estado_postulacion: string | null;
  isLlamado: boolean | null;
};

export type ApplicationRow = {
  id: string;
  estado: string;
  created_at: string;
  job_id: number;
  JobsDetails: ApplicationJob | null;
};

export type ApplicationItem = {
  id: string;
  jobId: number;
  estado: string;
  appliedAt: string;
  job: ApplicationJob;
};

export type ApplicationTone = "sent" | "review" | "interview" | "rejected";

/**
 * Only real offers belong in the list: rows whose job disappeared or that
 * still carry the "llamado" flag are dropped, so the screen never shows a
 * broken card.
 */
export function toApplicationItem(row: ApplicationRow): ApplicationItem | null {
  const job = row.JobsDetails;
  if (!job || job.isLlamado === true) return null;
  return { id: row.id, jobId: job.id, estado: row.estado, appliedAt: row.created_at, job };
}

/** Newest first, one card per offer even if it was applied to twice. */
export function listApplications(rows: ApplicationRow[]): ApplicationItem[] {
  const items = rows.map(toApplicationItem).filter((item): item is ApplicationItem => item !== null);
  const byJob = new Map<number, ApplicationItem>();
  for (const item of items) {
    const current = byJob.get(item.jobId);
    if (!current || Date.parse(item.appliedAt) > Date.parse(current.appliedAt)) byJob.set(item.jobId, item);
  }
  return [...byJob.values()].sort((a, b) => Date.parse(b.appliedAt) - Date.parse(a.appliedAt));
}

const STATUS: Record<string, { label: string; tone: ApplicationTone }> = {
  Enviada: { label: "Enviada", tone: "sent" },
  "En revision": { label: "En revisión", tone: "review" },
  Entrevista: { label: "Entrevista", tone: "interview" },
  "No seleccionada": { label: "No seleccionada", tone: "rejected" },
};

export function applicationStatus(estado: string): { label: string; tone: ApplicationTone } {
  return STATUS[estado] ?? { label: estado, tone: "sent" };
}

export function applicationCountLabel(total: number): string {
  return total === 1 ? "1 postulación" : `${total} postulaciones`;
}
