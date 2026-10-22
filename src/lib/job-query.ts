import { queryOptions } from "@tanstack/react-query";
import { notFound } from "@tanstack/react-router";
import { getJobById } from "@/lib/jobs.functions";

export const jobQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ["job", id],
    staleTime: 60_000,
    queryFn: async () => {
      const job = await getJobById({ data: id });
      if (!job) throw notFound();
      return job;
    },
  });