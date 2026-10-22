import { describe, expect, it } from "vitest";
import { filterJobs, publishedAgo, type JobListItem } from "@/lib/job-list";

const job = (id: number, extra: Partial<JobListItem> = {}): JobListItem => ({ id, titulo: "Cajera", descripcion: "Atención al público", Empresa: "Empresa", ubicacion: "Montevideo", ciudad: "Montevideo", fotoEmpresa: null, image: null, created_at: "2026-10-22T00:00:00Z", isFeatured: false, estado_postulacion: "Normal", tipoContrato: "Permanente", ...extra });
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
});