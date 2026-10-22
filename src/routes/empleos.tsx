import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getJobsList } from "@/lib/jobs.functions";
import { JobListScreen } from "@/components/job-list-screen";

const jobsQueryOptions = queryOptions({ queryKey: ["employment-list"], queryFn: () => getJobsList() });

export const Route = createFileRoute("/empleos")({
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
  loader: ({ context }) => context.queryClient.ensureQueryData(jobsQueryOptions),
  component: EmploymentPage,
  errorComponent: () => <div className="min-h-screen bg-muted p-6 text-center text-foreground">No pudimos cargar los empleos. Intentá nuevamente.</div>,
});

function EmploymentPage() {
  const { data } = useSuspenseQuery(jobsQueryOptions);
  return <JobListScreen jobs={data} />;
}