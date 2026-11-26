import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { JobListScreen } from "@/components/job-list-screen";
import { JobListSkeleton } from "@/components/job-card-skeleton";
import { jobsQueryOptions } from "@/routes/index";

export const Route = createFileRoute("/llamados-publicos")({
  head: () => ({
    meta: [
      { title: "Llamados públicos · EmpleosUy" },
      { name: "description", content: "Llamados públicos del Estado uruguayo: buscá y filtrá por departamento y tipo de contrato." },
      { property: "og:title", content: "Llamados públicos · EmpleosUy" },
      { property: "og:description", content: "Todos los llamados públicos de Uruguay en un solo lugar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(jobsQueryOptions),
  pendingMs: 100,
  pendingMinMs: 0,
  pendingComponent: () => <JobListSkeleton count={4} />,
  component: LlamadosPage,
  errorComponent: () => <div className="min-h-screen bg-muted p-6 text-center text-foreground">No pudimos cargar los llamados. Intentá nuevamente.</div>,
});

function LlamadosPage() {
  const { data } = useSuspenseQuery(jobsQueryOptions);
  return <JobListScreen jobs={data.filter(job => job.isLlamado)} variant="llamados" categoryTitle="Llamados públicos" />;
}
