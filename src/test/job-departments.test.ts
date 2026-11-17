import { describe, expect, it } from "vitest";
import { URUGUAY_DEPARTMENTS, jobDepartment, matchesDepartment } from "@/lib/job-departments";
import { filterJobs, type JobListItem } from "@/lib/job-list";

const job = (id: number, extra: Partial<JobListItem> = {}): JobListItem => ({ id, titulo: "Cajera", descripcion: "Atención al público", Empresa: "Empresa", ubicacion: "Montevideo", ciudad: "Montevideo", fotoEmpresa: null, image: null, created_at: "2026-10-22T00:00:00Z", isFeatured: false, isLlamado: false, estado_postulacion: "Normal", tipoContrato: "Permanente", ...extra });

describe("departamentos de Uruguay", () => {
  it("offers all 19 departments as filter choices", () => {
    expect(URUGUAY_DEPARTMENTS).toHaveLength(19);
    expect(URUGUAY_DEPARTMENTS).toContain("Montevideo");
    expect(URUGUAY_DEPARTMENTS).toContain("Canelones");
    expect(URUGUAY_DEPARTMENTS).toContain("Treinta y Tres");
  });

  it("reads the department from localities that do not name it", () => {
    expect(jobDepartment({ ciudad: "Punta del Este", ubicacion: "Punta del Este" })).toBe("Maldonado");
    expect(jobDepartment({ ciudad: "Barra de Carrasco", ubicacion: "Barra de Carrasco, Ciudad de la Costa (Canelones)" })).toBe("Canelones");
    expect(jobDepartment({ ciudad: "José Ignacio", ubicacion: "José Ignacio" })).toBe("Maldonado");
    expect(jobDepartment({ ciudad: "Colonia del Sacramento", ubicacion: null })).toBe("Colonia");
  });

  it("keeps offers without one clear department out of every department filter", () => {
    const multi = { ciudad: "Varias Localidades", ubicacion: "Varias Localidades" };
    expect(jobDepartment(multi)).toBeNull();
    expect(matchesDepartment(multi, "Montevideo")).toBe(false);
    expect(matchesDepartment(multi, "")).toBe(true);
  });

  it("keeps the department written last in the address", () => {
    expect(jobDepartment({ ciudad: "Av. Artigas 1234, Montevideo", ubicacion: null })).toBe("Montevideo");
  });

  it("trusts the city over a street that is another department's name", () => {
    expect(jobDepartment({ ciudad: "Montevideo", ubicacion: "Mercedes 1265" })).toBe("Montevideo");
    expect(jobDepartment({ ciudad: "Montevideo", ubicacion: "Av. Artigas 363" })).toBe("Montevideo");
  });

  it("filters the employment list by department", () => {
    const jobs = [
      job(1, { ciudad: "Montevideo", ubicacion: "Montevideo" }),
      job(2, { ciudad: "Las Piedras", ubicacion: "Las Piedras, Canelones" }),
      job(3, { ciudad: "Punta del Este", ubicacion: "Punta del Este" }),
    ];
    expect(filterJobs(jobs, "", "all", "Canelones").map((item) => item.id)).toEqual([2]);
    expect(filterJobs(jobs, "", "all", "Maldonado").map((item) => item.id)).toEqual([3]);
    expect(filterJobs(jobs, "", "all", "").map((item) => item.id)).toEqual([1, 2, 3]);
  });
});
