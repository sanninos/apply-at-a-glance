export const APPLICATION_MESSAGE_MAX = 300;

export type ShareableJob = { titulo?: string | null; empresa?: string | null; lugar?: string | null };

/** Builds a clean WhatsApp message for a job offer. */
export function jobShareText(job: ShareableJob, url: string): string {
  const lines = [`💼 *${job.titulo?.trim() || "Oferta de empleo"}*`];
  if (job.empresa?.trim()) lines.push(`🏢 ${job.empresa.trim()}`);
  if (job.lugar?.trim()) lines.push(`📍 ${job.lugar.trim()}`);
  lines.push("", `Mirala y postulate en URUJOBS:`, url);
  return lines.join("\n");
}

export function whatsappShareUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
