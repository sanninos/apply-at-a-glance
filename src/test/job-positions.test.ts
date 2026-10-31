import { describe, expect, it } from "vitest";
import { jobsForPosition, positionIconUrl } from "@/lib/job-positions";
import type { JobListItem } from "@/lib/job-list";

describe("Puesto categories", () => {
  it("shows only jobs whose puesto matches the selected Puesto name", () => {
    const jobs = [
      { id: 1, puesto: "Atención al Cliente", titulo: "Agente" },
      { id: 2, puesto: " atencion al cliente " },
      { id: 3, puesto: "Chofer", titulo: "Atención al Cliente" },
      { id: 4, puesto: null },
    ] as JobListItem[];
    expect(jobsForPosition(jobs, { id: "category", nombre: "Atención al Cliente", icon: null }).map(job => job.id)).toEqual([1, 2]);
  });
  it("does not substitute unrelated jobs for an empty category", () => {
    expect(jobsForPosition([{ id: 1, puesto: "Chofer" }] as JobListItem[], { id: "category", nombre: "Abogado", icon: null })).toEqual([]);
  });
  it("allows secure stored icon URLs and rejects unsafe ones", () => {
    expect(positionIconUrl("https://example.com/icon.png")).toBe("https://example.com/icon.png");
    expect(positionIconUrl("javascript:alert(1)")).toBeNull();
    expect(positionIconUrl(null)).toBeNull();
  });
});