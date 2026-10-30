import { useEffect, useRef, useState } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import { BriefcaseBusiness, Search, SlidersHorizontal, Flame, Clock, ChevronRight, Building2, ArrowLeft, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { JobFilterPanel } from "@/components/job-filter-panel";
import { AppBottomNav } from "@/components/app-bottom-nav";
import { HomeAdvertisement } from "@/components/home-advertisement";
import { filterJobs, isUrgent, publishedAgo, publishedInLastDaysCount, type JobListItem, type JobListMode } from "@/lib/job-list";
import { useEmployerLogo } from "@/hooks/use-employer-logo";
import { cn } from "@/lib/utils";

function EmployerLogo({ job }: { job: JobListItem }) {
  const { src, ref, onError } = useEmployerLogo(job.fotoEmpresa || job.image);
  return <div className="job-logo">{src ? <img ref={ref} src={src} alt={job.Empresa || "Empresa"} onError={onError} /> : <Building2 aria-hidden="true" />}</div>;
}

const CARD_BATCH = 40;

export function JobListScreen({ jobs, variant = "home" }: { jobs: JobListItem[]; variant?: "home" | "search" }) {
  const router = useRouter();
  const isSearch = variant === "search";
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<JobListMode>("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [location, setLocation] = useState("");
  const [contract, setContract] = useState("");
  const [limit, setLimit] = useState(CARD_BATCH);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const visible = filterJobs(jobs, search, mode, location, contract);
  const shown = visible.slice(0, limit);

  // Restart incremental rendering whenever the result set changes.
  useEffect(() => { setLimit(CARD_BATCH); }, [search, mode, location, contract]);

  // Mount the next batch only when the user scrolls near the end.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || shown.length >= visible.length) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some(entry => entry.isIntersecting)) setLimit(current => current + CARD_BATCH);
    }, { rootMargin: "600px 0px" });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [shown.length, visible.length]);
  const locations = [...new Set(jobs.map(job => job.ciudad || job.ubicacion).filter((value): value is string => Boolean(value)))].sort();
  const contracts = [...new Set(jobs.map(job => job.tipoContrato).filter((value): value is string => Boolean(value)))].sort();
  const tabs = [
    { id: "all" as const, label: "Todas", icon: BriefcaseBusiness, count: `+${publishedInLastDaysCount(jobs)}` },
    { id: "urgent" as const, label: "Urgentes", icon: Flame, count: undefined },
    { id: "latest" as const, label: "Últimos", icon: Clock, count: Math.min(36, jobs.length) },
  ];
  return <main className={cn("employment-screen", isSearch && "search-screen")}>
    <h1 className="sr-only">Empleos en Uruguay</h1>
    {!isSearch && <HomeAdvertisement />}
    <header className="employment-header">
      <div className="employment-search-row">
        {isSearch && <Button variant="ghost" size="icon" className="search-back" aria-label="Volver" onClick={() => (window.history.length > 1 ? router.history.back() : router.navigate({ to: "/" }))}><ArrowLeft /></Button>}
        {isSearch
          ? <div className="employment-search"><Search aria-hidden="true" /><Input autoFocus type="search" aria-label="Buscar un puesto de trabajo" placeholder="Busca un puesto de trabajo" value={search} onChange={event => setSearch(event.target.value)} />{search && <button type="button" className="search-clear" aria-label="Borrar búsqueda" onClick={() => setSearch("")}><X /></button>}</div>
          : <Link to="/buscar" preload="intent" preloadDelay={0} className="employment-search employment-search-link" aria-label="Buscar un puesto de trabajo"><Search aria-hidden="true" /><span>Busca un puesto de trabajo</span></Link>}
        <Button variant="outline" size="icon" className={cn("employment-filter", (location || contract) && "filter-active")} aria-label="Filtrar empleos" title="Filtrar empleos" onClick={() => setFiltersOpen(true)}><SlidersHorizontal /></Button>
      </div>
      {!isSearch && <div className="employment-tabs" role="tablist" aria-label="Tipo de empleos">
        {tabs.map(({ id, label, icon: Icon, count }) => <Button key={id} role="tab" aria-selected={mode === id} variant="ghost" className={cn("employment-tab", mode === id && "selected")} onClick={() => setMode(id)}><Icon /><span>{label}</span>{count !== undefined && <span className="tab-count">{count}</span>}</Button>)}
      </div>}
    </header>
    <section className="employment-list" aria-label="Empleos disponibles">
      {shown.map(job => <Link className={cn("employment-card", job.isFeatured && "featured", isUrgent(job) && "urgent")} key={job.id} to="/llamado/$jobId" params={{ jobId: String(job.id) }} preload="intent" preloadDelay={0}>
        <div className="employment-card-main"><EmployerLogo job={job} /><div className="employment-copy"><p className="employment-company">{job.Empresa || "Empresa"}</p><h2>{job.titulo || "Oferta de empleo"}</h2><p className="employment-description">{job.descripcion}</p></div><span className="employment-arrow"><ChevronRight aria-hidden="true" /></span></div>
        <div className="employment-meta"><span className="location-chip"><span className="location-pin" aria-hidden="true">📍</span><span>{job.ubicacion || job.ciudad || "Uruguay"}</span></span><span className="date-chip"><Clock aria-hidden="true" />{publishedAgo(job.created_at)}</span></div>
        {(job.isLlamado || job.isFeatured || isUrgent(job)) && <div className="employment-badges">{job.isLlamado && <span className="llamado-badge">Llamado público</span>}{job.isFeatured && <span>Destacada</span>}{isUrgent(job) && <span>Urgente</span>}</div>}
      </Link>)}
      {!visible.length && <div className="employment-empty"><Search /><h2>No se encontraron empleos</h2><Button variant="outline" onClick={() => { setSearch(""); setLocation(""); setContract(""); setMode("all"); }}>Ver todos</Button></div>}
      {shown.length < visible.length && <div ref={sentinelRef} className="employment-list-sentinel" aria-hidden="true" />}
    </section>
    <AppBottomNav active="empleos" />
    <JobFilterPanel open={filtersOpen} onOpenChange={setFiltersOpen} value={{ mode, location, contract }} locations={locations} contracts={contracts} onApply={(value) => { setMode(value.mode); setLocation(value.location); setContract(value.contract); }} />
  </main>;
}