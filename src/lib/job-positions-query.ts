import { queryOptions } from "@tanstack/react-query";
import { getJobPositions } from "@/lib/job-positions.functions";

export const positionsQueryOptions = queryOptions({
  queryKey: ["job-positions"], queryFn: () => getJobPositions(), staleTime: 60_000,
});