import { describe, expect, it } from "vitest";
import { filterJobs, publishedAgo, publishedInLastDaysCount, type JobListItem } from "@/lib/job-list";

const job = (id: number, extra: Partial<JobListItem> = {}): JobListItem => ({ id, titulo: "Cajera", descripcion: "Atención al público", Empresa: "Empresa", ubicacion: "Montevideo", ciudad: "Montevideo", fotoEmpresa: null, image: null, created_at: "2026-10-22T00:00:00Z", isFeatured: false, isLlamado: false, estado_postulacion: "Normal", tipoContrato: "Permanente", ...extra });
describe("employment list filters", () => {
  it("matches searches without accents and combines location and contract filters", () => {
    expect(filterJobs([job(1), job(2, { ciudad: "Salto" })], "atencion", "all", "Montevideo", "Permanente").map(item => item.id)).toEqual([1]);
  });
  it("shows urgent offers only in urgent mode", () => {
    expect(filterJobs([job(1), job(2, { estado_postulacion: "Urgente" })], "", "urgent").map(item => item.id)).toEqual([2]);
  });
  it("limits latest mode to the latest 36 jobs", () => {
    expect(filterJobs(Array.from({ length: 40 }, (_, index) => job(index)), "", "latest")).toHaveLength(36);
  });
  it("places featured employment first in all mode", () => {
    expect(filterJobs([job(1), job(2, { isFeatured: true })], "", "all")[0]?.id).toBe(2);
  });
  it("computes publication age from the real date", () => {
    expect(publishedAgo("2026-10-18T00:00:00Z", Date.parse("2026-10-22T00:00:00Z"))).toBe("Hace 4 días");
  });
  it("counts only jobs published in the last 7 days for the Todas chip", () => {
    const now = Date.parse("2026-10-25T00:00:00Z");
    const recent = job(1, { created_at: "2026-10-24T00:00:00Z" });
    const edge = job(2, { created_at: "2026-10-18T00:00:00Z" });
    const old = job(3, { created_at: "2026-10-10T00:00:00Z" });
    expect(publishedInLastDaysCount([recent, edge, old], 7, now)).toBe(2);
    expect(publishedInLastDaysCount([job(4, { created_at: "not-a-date" })], 7, now)).toBe(0);
  });
});
import { interleaveOffers as mix } from "@/lib/job-list";
describe("ratio 5 ofertas : 1 llamado", () => {
  it("intercala 5 ofertas y luego 1 llamado", () => {
    const jobs = [...Array.from({ length: 10 }, (_, i) => ({ id: i, isLlamado: false })), ...Array.from({ length: 3 }, (_, i) => ({ id: 100 + i, isLlamado: true }))] as never[];
    expect(mix(jobs).map((j) => j.isLlamado)).toEqual([false,false,false,false,false,true,false,false,false,false,false,true,true]);
  });
});
import { searchSuggestions } from "@/lib/job-list";
describe("sugerencias de búsqueda", () => {
  it("no sugiere nada sin texto y sugiere títulos únicos que coinciden sin acentos", () => {
    const jobs = [job(1, { titulo: "Cajera" }), job(2, { titulo: "Cajera" }), job(3, { titulo: "Auxiliar de cajá" }), job(4, { titulo: "Chofer" })];
    expect(searchSuggestions(jobs, "  ")).toEqual([]);
    expect(searchSuggestions(jobs, "caja")).toEqual(["Cajera", "Auxiliar de cajá"]);
  });
});
