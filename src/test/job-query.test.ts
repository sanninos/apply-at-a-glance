import { QueryClient, QueryObserver } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { getJobById } from "@/lib/jobs.functions";
import { jobQueryOptions } from "@/lib/job-query";

vi.mock("@/lib/jobs.functions", () => ({ getJobById: vi.fn() }));

describe("Job detail navigation cache", () => {
  it("reuses the prefetched offer for the loader and component without fetching twice", async () => {
    vi.mocked(getJobById).mockResolvedValue(null);
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    // Seed a full response, never a partial employment-list row.
    const offer = { id: 1132, titulo: "Albañil Pintor Yesero", requisitos: ["Experiencia previa"] };
    client.setQueryData(["job", 1132], offer);
    const loaded = await client.ensureQueryData(jobQueryOptions(1132));
    const observer = new QueryObserver(client, jobQueryOptions(1132));
    const unsubscribe = observer.subscribe(() => {});
    expect(loaded).toEqual(offer);
    expect(observer.getCurrentResult().data).toEqual(offer);
    expect(getJobById).not.toHaveBeenCalled();
    unsubscribe();
    client.clear();
  });
});