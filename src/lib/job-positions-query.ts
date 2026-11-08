import { queryOptions } from "@tanstack/react-query";
import { getJobPositionCounts, getJobPositions } from "@/lib/job-positions.functions";

export const positionsQueryOptions = queryOptions({
  queryKey: ["job-positions"], queryFn: () => getJobPositions(), staleTime: 60_000,
});

export const positionCountsQueryOptions = queryOptions({
  queryKey: ["job-position-counts"], queryFn: () => getJobPositionCounts(), staleTime: 60_000,
});
