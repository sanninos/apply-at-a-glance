import { createFileRoute, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { JobListScreen } from "@/components/job-list-screen";
import { NavigationLoading } from "@/components/navigation-loading";
import { jobsQueryOptions } from "./index";
import { positionsQueryOptions } from "@/lib/job-positions-query";
import { jobsForPosition } from "@/lib/job-positions";
import { AppBottomNav } from "@/components/app-bottom-nav";

export const Route = createFileRoute("/puestos/$puestoId")({
  loader: async ({ context, params }) => {
    const [, positions] = await Promise.all([context.queryClient.ensureQueryData(jobsQueryOptions), context.queryClient.ensureQueryData(positionsQueryOptions)]);
    const position = positions.find(position => position.id === params.puestoId);
    if (!position) throw notFound();
    return position;
  },
  head: ({ loaderData }) => {
    const title = `${loaderData?.nombre || "Puesto no encontrado"} · EmpleosUy`;
    const description = `Ofertas laborales de ${loaderData?.nombre || "puestos de trabajo"} en Uruguay.`;
    return { meta: [{ title }, { name: "description", content: description }, { property: "og:title", content: title }, { property: "og:description", content: description }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] };
  },
  pendingMs: 100, pendingMinMs: 0, pendingComponent: () => <NavigationLoading active="empleos" />,
  component: PositionJobsPage,
  notFoundComponent: () => <main className="employment-screen"><h1>Puesto no encontrado</h1><AppBottomNav active="empleos" /></main>,
  errorComponent: () => <main className="employment-screen"><p>No pudimos cargar las ofertas. Intentá nuevamente.</p><AppBottomNav active="empleos" /></main>,
});

function PositionJobsPage() {
  const position = Route.useLoaderData();
  const { data: jobs } = useSuspenseQuery(jobsQueryOptions);
  return <JobListScreen key={position.id} jobs={jobsForPosition(jobs, position)} variant="category" categoryTitle={position.nombre} />;
}