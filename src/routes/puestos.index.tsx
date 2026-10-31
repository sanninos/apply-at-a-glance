import { useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { AppBottomNav } from "@/components/app-bottom-nav";
import { NavigationLoading } from "@/components/navigation-loading";
import { PositionLink } from "@/components/job-position-categories";
import { positionsQueryOptions } from "@/lib/job-positions-query";

export const Route = createFileRoute("/puestos/")({
  head: () => ({ meta: [
    { title: "Puestos de trabajo · EmpleosUy" },
    { name: "description", content: "Explorá puestos de trabajo y encontrá sus ofertas en Uruguay." },
    { property: "og:title", content: "Puestos de trabajo · EmpleosUy" },
    { property: "og:description", content: "Categorías de puestos laborales en Uruguay." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(positionsQueryOptions),
  pendingMs: 100, pendingMinMs: 0, pendingComponent: () => <NavigationLoading active="empleos" />,
  component: PositionsPage,
  errorComponent: () => <main className="employment-screen"><p>No pudimos cargar los puestos. Intentá nuevamente.</p><AppBottomNav active="empleos" /></main>,
});

function PositionsPage() {
  const { data } = useSuspenseQuery(positionsQueryOptions);
  const [search, setSearch] = useState("");
  const normalize = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const positions = data.filter(position => normalize(position.nombre).includes(normalize(search.trim())));
  return <main className="employment-screen positions-screen">
    <header className="positions-header"><Link to="/" aria-label="Volver a Empleos"><ArrowLeft /></Link><h1>Puestos de trabajo</h1></header>
    <div className="employment-search position-search"><Search aria-hidden="true" /><Input type="search" aria-label="Buscar categoría" placeholder="Buscar un puesto" value={search} onChange={event => setSearch(event.target.value)} /></div>
    <section className="position-category-grid" aria-label="Puestos de trabajo">{positions.map(position => <PositionLink key={position.id} position={position} />)}</section>
    {!positions.length && <p className="position-empty">No se encontraron puestos.</p>}
    <AppBottomNav active="empleos" />
  </main>;
}