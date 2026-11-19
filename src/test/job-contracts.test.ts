import { describe, expect, it } from "vitest";
import { CONTRACT_FAMILIES, contractFamiliesIn, contractFamily, matchesContract } from "@/lib/job-contracts";
import { filterJobs, type JobListItem } from "@/lib/job-list";

const job = (id: number, extra: Partial<JobListItem> = {}): JobListItem => ({ id, titulo: "Cajera", descripcion: "Atención al público", Empresa: "Empresa", ubicacion: "Montevideo", ciudad: "Montevideo", fotoEmpresa: null, image: null, created_at: "2026-10-22T00:00:00Z", isFeatured: false, isLlamado: false, estado_postulacion: "Normal", tipoContrato: "18 meses sujeto a evaluación", ...extra });

describe("familias de tipo de contrato", () => {
  it("groups fixed-term variants into Plazo fijo", () => {
    expect(contractFamily("18 MESES SUJETO A EVALUACION DE DESEMPEÑO")).toBe("plazo_fijo");
    expect(contractFamily("18 mese sujeto a evaluacion de desempeño")).toBe("plazo_fijo");
    expect(contractFamily("18 sujeto a evaluación de desempeño")).toBe("plazo_fijo");
    expect(contractFamily("sujeto a 18 meses de evaluación")).toBe("plazo_fijo");
    expect(contractFamily("12 meses, prorrogable")).toBe("plazo_fijo");
    expect(contractFamily("1 año (prorrogable a 4 años)")).toBe("plazo_fijo");
    expect(contractFamily("un año con posibilidad de renovación")).toBe("plazo_fijo");
    expect(contractFamily("2 años con reeleccion")).toBe("plazo_fijo");
    expect(contractFamily("24 meses y prórroga")).toBe("plazo_fijo");
    expect(contractFamily("6 meses")).toBe("plazo_fijo");
    expect(contractFamily("120 días")).toBe("plazo_fijo");
    expect(contractFamily("hasta 31/12/2026")).toBe("plazo_fijo");
    expect(contractFamily("31/12/26")).toBe("plazo_fijo");
    expect(contractFamily("hasta diciembre 2026 - renovable")).toBe("plazo_fijo");
    expect(contractFamily("desde la t. p. y hasta determinar.")).toBe("plazo_fijo");
    expect(contractFamily("1 año a partir de la tp")).toBe("plazo_fijo");
    expect(contractFamily("a término")).toBe("plazo_fijo");
  });

  it("maps each remaining contract type to its own family", () => {
    expect(contractFamily("indefinido")).toBe("indefinido");
    expect(contractFamily("tiempo indeterminado")).toBe("indefinido");
    expect(contractFamily("obra determinada")).toBe("obra");
    expect(contractFamily("eventual")).toBe("eventual");
    expect(contractFamily("jornalero")).toBe("eventual");
    expect(contractFamily("zafral, jornalero")).toBe("zafral");
    expect(contractFamily("suplente")).toBe("suplencia");
    expect(contractFamily('"suplencias "')).toBe("suplencia");
    expect(contractFamily("pasantía 18 meses")).toBe("practica");
    expect(contractFamily("práctica laboral para egresados")).toBe("practica");
    expect(contractFamily("aprendizaje")).toBe("aprendizaje");
    expect(contractFamily("primera experiencia laboral")).toBe("primera_experiencia");
    expect(contractFamily("a prueba por 18 meses")).toBe("prueba");
  });

  it("keeps values without contract information out of every family", () => {
    for (const value of ["", "0", "-", ".", "n/a", "no corresponde.", "ver bases", "ver punto 3 de las bases del llamado", "presencial", "hasta $4.000.000 iva incluido", "arrendamiento de servicios", null]) {
      expect(contractFamily(value)).toBeNull();
    }
  });

  it("filters by family, not by the exact stored text", () => {
    const written = { tipoContrato: "18 MESES SUJETO A EVALUACIÓN" };
    expect(matchesContract(written, "plazo_fijo")).toBe(true);
    expect(matchesContract(written, "indefinido")).toBe(false);
    expect(matchesContract(written, "")).toBe(true);
    expect(matchesContract({ tipoContrato: null }, "plazo_fijo")).toBe(false);
  });

  it("shows only the families present in the list, in filter order", () => {
    const jobs = [job(1, { tipoContrato: "suplente" }), job(2, { tipoContrato: "12 meses" }), job(3, { tipoContrato: "0" })];
    expect(contractFamiliesIn(jobs)).toEqual(["plazo_fijo", "suplencia"]);
  });

  it("offers exactly the ten contract types, each with a unique label", () => {
    expect(CONTRACT_FAMILIES.map((family) => family.label)).toEqual([
      "Tiempo indeterminado",
      "Plazo fijo",
      "Obra determinada",
      "Eventual",
      "Temporada o zafral",
      "Suplencia o sustitución",
      "Aprendizaje",
      "Práctica laboral para egresados",
      "Primera experiencia laboral",
      "A prueba",
    ]);
    const labels = CONTRACT_FAMILIES.map((family) => family.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("filters the employment list by contract family", () => {
    const jobs = [job(1, { tipoContrato: "suplente" }), job(2, { tipoContrato: "12 meses" }), job(3, { tipoContrato: "indefinido" })];
    expect(filterJobs(jobs, "", "all", "", "suplencia").map((item) => item.id)).toEqual([1]);
    expect(filterJobs(jobs, "", "all", "", "").map((item) => item.id)).toEqual([1, 2, 3]);
  });
});
