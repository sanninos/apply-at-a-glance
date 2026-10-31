import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getJobsList } from "@/lib/jobs.functions";
import { JobListScreen } from "@/components/job-list-screen";
import { NavigationLoading } from '@/components/navigation-loading';
import { positionsQueryOptions } from '@/lib/job-positions-query';

export const jobsQueryOptions = queryOptions({ queryKey: ["employment-list"], queryFn: () => getJobsList(), staleTime: 60_000 });

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EmpleosUy · Empleos en Uruguay" },
      { name: "description", content: "Encontrá empleos en Uruguay. Buscá por puesto, ubicación y contrato, y consultá cada oferta." },
      { property: "og:title", content: "EmpleosUy · Empleos en Uruguay" },
      { property: "og:description", content: "Ofertas laborales en Uruguay, empleos urgentes y últimas publicaciones." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
   loader: async ({ context }) => {
     await Promise.all([context.queryClient.ensureQueryData(jobsQueryOptions), context.queryClient.ensureQueryData(positionsQueryOptions)]);
   },
  pendingMs: 100,
  pendingMinMs: 0,
  pendingComponent: () => <NavigationLoading active="empleos" />,
  component: EmploymentPage,
  errorComponent: () => <div className="min-h-screen bg-muted p-6 text-center text-foreground">No pudimos cargar los empleos. Intentá nuevamente.</div>,
});

function EmploymentPage() {
  const { data } = useSuspenseQuery(jobsQueryOptions);
  const { data: positions } = useSuspenseQuery(positionsQueryOptions);
  return <JobListScreen jobs={data} positions={positions} />;
}
