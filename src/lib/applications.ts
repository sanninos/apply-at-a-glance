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

export type TimelineStepState = "done" | "current" | "upcoming" | "rejected";

export type TimelineStep = {
  key: string;
  label: string;
  state: TimelineStepState;
  date: string | null;
};

/**
 * Process timeline for one application. The order is fixed
 * (Enviada → En revisión → Entrevista → Resultado); the stored estado marks
 * how far the process got. Only the application date is real — later steps
 * have no recorded date yet, so they show none instead of inventing one.
 */
export function applicationTimeline(item: ApplicationItem): TimelineStep[] {
  const applied = item.appliedAt;
  switch (item.estado) {
    case "En revision":
      return [
        { key: "sent", label: "Postulación enviada", state: "done", date: applied },
        { key: "review", label: "En revisión", state: "current", date: null },
        { key: "interview", label: "Entrevista", state: "upcoming", date: null },
        { key: "result", label: "Resultado", state: "upcoming", date: null },
      ];
    case "Entrevista":
      return [
        { key: "sent", label: "Postulación enviada", state: "done", date: applied },
        { key: "review", label: "En revisión", state: "done", date: null },
        { key: "interview", label: "Entrevista", state: "current", date: null },
        { key: "result", label: "Resultado", state: "upcoming", date: null },
      ];
    case "No seleccionada":
      return [
        { key: "sent", label: "Postulación enviada", state: "done", date: applied },
        { key: "review", label: "En revisión", state: "done", date: null },
        { key: "interview", label: "Entrevista", state: "done", date: null },
        { key: "result", label: "No seleccionada", state: "rejected", date: null },
      ];
    case "Seleccionada":
      return [
        { key: "sent", label: "Postulación enviada", state: "done", date: applied },
        { key: "review", label: "En revisión", state: "done", date: null },
        { key: "interview", label: "Entrevista", state: "done", date: null },
        { key: "result", label: "Seleccionada", state: "done", date: null },
      ];
    default:
      return [
        { key: "sent", label: "Postulación enviada", state: "current", date: applied },
        { key: "review", label: "En revisión", state: "upcoming", date: null },
        { key: "interview", label: "Entrevista", state: "upcoming", date: null },
        { key: "result", label: "Resultado", state: "upcoming", date: null },
      ];
  }
}
