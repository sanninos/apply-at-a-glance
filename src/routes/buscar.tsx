import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { jobsQueryOptions } from "./index";
import { JobListScreen } from "@/components/job-list-screen";
import { NavigationLoading } from "@/components/navigation-loading";

export const Route = createFileRoute("/buscar")({
  head: () => ({
    meta: [
      { title: "Buscar empleos · EmpleosUy" },
      { name: "description", content: "Buscá ofertas y llamados en Uruguay por puesto, empresa o ubicación con resultados al instante." },
      { property: "og:title", content: "Buscar empleos · EmpleosUy" },
      { property: "og:description", content: "Resultados de empleo en tiempo real mientras escribís." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(jobsQueryOptions),
  pendingMs: 100,
  pendingMinMs: 0,
  pendingComponent: () => <NavigationLoading active="empleos" />,
  component: SearchPage,
  errorComponent: () => <div className="min-h-screen bg-muted p-6 text-center text-foreground">No pudimos cargar los empleos. Intentá nuevamente.</div>,
});

function SearchPage() {
  const { data } = useSuspenseQuery(jobsQueryOptions);
  return <JobListScreen jobs={data} variant="search" />;
}
