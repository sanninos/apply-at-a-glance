import type { CurriculumDraft } from "@/lib/curriculum";

const BLUE: [number, number, number] = [49, 84, 143];
const YELLOW: [number, number, number] = [246, 196, 69];
const TEXT: [number, number, number] = [33, 37, 41];
const MUTED: [number, number, number] = [108, 117, 125];

function period(desde: string, hasta: string, actual: boolean): string {
  const end = actual ? "Actualidad" : hasta;
  return [desde, end].filter(Boolean).join(" – ");
}

export function curriculumFileName(d: CurriculumDraft): string {
  const name = (d.fullName || [d.firstName, d.lastName].join(" ")).trim() || "curriculum";
  const slug = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase();
  return `cv-${slug || "curriculum"}.pdf`;
}

/** Builds a clean one-column A4 CV from the draft. Loaded only in the browser. */
export async function buildCurriculumPdf(d: CurriculumDraft, email?: string | null): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210, M = 18, CW = W - M * 2, BOTTOM = 280;
  let y = 0;

  const ensure = (h: number) => { if (y + h > BOTTOM) { doc.addPage(); y = 20; } };
  const para = (text: string, size = 10, color = TEXT, style: "normal" | "bold" | "italic" = "normal") => {
    doc.setFont("helvetica", style); doc.setFontSize(size); doc.setTextColor(...color);
    const lines = doc.splitTextToSize(text, CW) as string[];
    const lh = size * 0.45;
    for (const line of lines) { ensure(lh); doc.text(line, M, y); y += lh; }
  };
  const section = (title: string) => {
    ensure(16); y += 4;
    doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.setTextColor(...BLUE);
    doc.text(title.toUpperCase(), M, y);
    y += 2; doc.setDrawColor(...YELLOW); doc.setLineWidth(0.8); doc.line(M, y, M + 24, y);
    y += 6;
  };

  // Header band
  const name = (d.fullName || [d.firstName, d.lastName].join(" ")).trim() || "Curriculum";
  doc.setFillColor(...BLUE); doc.rect(0, 0, W, 38, "F");
  doc.setFillColor(...YELLOW); doc.rect(0, 38, W, 1.5, "F");
  doc.setFont("helvetica", "bold"); doc.setFontSize(22); doc.setTextColor(255, 255, 255);
  doc.text(name, M, 18);
  const contact = [
    d.phone && `${d.phoneCountryCode ? d.phoneCountryCode + " " : ""}${d.phone}`,
    d.extraPhone, email,
    [d.city, d.country].filter(Boolean).join(", "),
  ].filter(Boolean).join("   ·   ");
  doc.setFont("helvetica", "normal"); doc.setFontSize(9.5);
  doc.text(doc.splitTextToSize(contact, CW) as string[], M, 27);
  y = 50;

  const personal = [
    d.birthDate && `Nacimiento: ${d.birthDate}`,
    d.nationality && `Nacionalidad: ${d.nationality}`,
    d.documentNumber && `${d.documentType || "Documento"}: ${d.documentNumber}`,
  ].filter(Boolean).join("   ·   ");
  if (personal) { para(personal, 9, MUTED); y += 2; }

  if (d.summary.trim()) { section("Sobre mí"); para(d.summary.trim()); }

  const exps = d.experiences.filter((e) => e.puesto.trim() || e.empresa.trim());
  if (exps.length) {
    section("Experiencia profesional");
    for (const e of exps) {
      ensure(14);
      para(e.puesto || "Puesto", 11, TEXT, "bold");
      para([e.empresa, e.lugar].filter(Boolean).join(" · "), 10, BLUE);
      const p = period(e.desde, e.hasta, e.actualmente);
      if (p) para(p, 9, MUTED);
      if (e.descripcion.trim()) { y += 1; para(e.descripcion.trim(), 9.5); }
      y += 4;
    }
  }

  const edus = d.education.filter((e) => e.titulo.trim() || e.institucion.trim());
  if (edus.length) {
    section("Educación");
    for (const e of edus) {
      ensure(14);
      para(e.titulo || e.nivel || "Estudios", 11, TEXT, "bold");
      para([e.institucion, e.lugar].filter(Boolean).join(" · "), 10, BLUE);
      const meta = [e.nivel && e.titulo ? e.nivel : "", period(e.desde, e.hasta, e.actualmente)].filter(Boolean).join(" · ");
      if (meta) para(meta, 9, MUTED);
      if (e.descripcion.trim()) { y += 1; para(e.descripcion.trim(), 9.5); }
      y += 4;
    }
  }

  const skills = d.skills.split(/[,\n]/).map((s) => s.trim()).filter(Boolean);
  if (skills.length) { section("Habilidades"); para(skills.join("  ·  ")); }

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i); doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(...MUTED);
    doc.text("Generado con URUJOBS", M, 290);
    if (pages > 1) doc.text(`${i} / ${pages}`, W - M, 290, { align: "right" });
  }
  return doc.output("blob");
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

/** Opens the system share sheet (WhatsApp, correo…) when available, otherwise downloads. */
export async function shareOrDownload(blob: Blob, filename: string): Promise<void> {
  const file = new File([blob], filename, { type: "application/pdf" });
  if (navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: "Mi currículum" }); return; }
    catch (e) { if ((e as DOMException).name === "AbortError") return; }
  }
  downloadBlob(blob, filename);
}
