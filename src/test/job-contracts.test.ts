import { describe, expect, it } from "vitest";
import { CONTRACT_FAMILIES, contractFamiliesIn, contractFamily, matchesContract } from "@/lib/job-contracts";
import { filterJobs, type JobListItem } from "@/lib/job-list";

const job = (id: number, extra: Partial<JobListItem> = {}): JobListItem => ({ id, titulo: "Cajera", descripcion: "Atención al público", Empresa: "Empresa", ubicacion: "Montevideo", ciudad: "Montevideo", fotoEmpresa: null, image: null, created_at: "2026-10-22T00:00:00Z", isFeatured: false, isLlamado: false, estado_postulacion: "Normal", tipoContrato: "18 meses sujeto a evaluación", ...extra });

describe("familias de tipo de contrato", () => {
  it("groups the variants really stored in the offers", () => {
    expect(contractFamily("18 MESES SUJETO A EVALUACION DE DESEMPEÑO")).toBe("m18");
    expect(contractFamily("18 mese sujeto a evaluacion de desempeño")).toBe("m18");
    expect(contractFamily("18 sujeto a evaluación de desempeño")).toBe("m18");
    expect(contractFamily("sujeto a 18 meses de evaluación")).toBe("m18");
    expect(contractFamily("12 meses, prorrogable")).toBe("m12");
    expect(contractFamily("1 año (prorrogable a 4 años)")).toBe("y1");
    expect(contractFamily("un año con posibilidad de renovación")).toBe("y1");
    expect(contractFamily("2 años con reeleccion")).toBe("y2");
    expect(contractFamily("24 meses y prórroga")).toBe("y2");
    expect(contractFamily("6 meses")).toBe("otros_plazos");
    expect(contractFamily("120 días")).toBe("otros_plazos");
    expect(contractFamily("suplente")).toBe("suplencias");
    expect(contractFamily('"suplencias "')).toBe("suplencias");
    expect(contractFamily("indefinido")).toBe("indefinido");
    expect(contractFamily("jornalero")).toBe("jornalero");
    expect(contractFamily("zafral, jornalero")).toBe("zafral");
    expect(contractFamily("a prueba por 18 meses")).toBe("prueba");
    expect(contractFamily("pasantía 18 meses")).toBe("pasantia");
    expect(contractFamily("arrendamiento de servicios")).toBe("arrendamiento");
  });

  it("puts dated contracts and take-of-possession ones in their own family", () => {
    expect(contractFamily("hasta 31/12/2026")).toBe("fecha");
    expect(contractFamily("31/12/26")).toBe("fecha");
    expect(contractFamily("hasta diciembre 2026 - renovable")).toBe("fecha");
    expect(contractFamily("desde la t. p. y hasta determinar.")).toBe("toma");
    expect(contractFamily("1 año a partir de la tp")).toBe("y1");
    expect(contractFamily("a término")).toBe("otro");
  });

  it("keeps values without contract information out of every family", () => {
    for (const value of ["", "0", "-", ".", "n/a", "no corresponde.", "ver bases", "ver punto 3 de las bases del llamado", "presencial", "hasta $4.000.000 iva incluido", null]) {
      expect(contractFamily(value)).toBeNull();
    }
  });

  it("filters by family, not by the exact stored text", () => {
    const written = { tipoContrato: "18 MESES SUJETO A EVALUACIÓN" };
    expect(matchesContract(written, "m18")).toBe(true);
    expect(matchesContract(written, "m12")).toBe(false);
    expect(matchesContract(written, "")).toBe(true);
    expect(matchesContract({ tipoContrato: null }, "m18")).toBe(false);
  });

  it("shows only the families present in the list, in filter order", () => {
    const jobs = [job(1, { tipoContrato: "suplente" }), job(2, { tipoContrato: "12 meses" }), job(3, { tipoContrato: "0" })];
    expect(contractFamiliesIn(jobs)).toEqual(["suplencias", "m12"]);
  });

  it("every family has a unique label shown in the filter", () => {
    const labels = CONTRACT_FAMILIES.map((family) => family.label);
    expect(new Set(labels).size).toBe(labels.length);
    expect(labels).toContain("18 meses");
    expect(labels).toContain("Suplencias");
  });

  it("filters the employment list by contract family", () => {
    const jobs = [job(1, { tipoContrato: "suplente" }), job(2, { tipoContrato: "12 meses" }), job(3, { tipoContrato: "indefinido" })];
    expect(filterJobs(jobs, "", "all", "", "suplencias").map((item) => item.id)).toEqual([1]);
    expect(filterJobs(jobs, "", "all", "", "").map((item) => item.id)).toEqual([1, 2, 3]);
  });
});
