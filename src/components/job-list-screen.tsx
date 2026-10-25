import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { BriefcaseBusiness, Search, SlidersHorizontal, Flame, Clock, ChevronRight, MapPin, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AppBottomNav } from "@/components/app-bottom-nav";
import { HomeAdvertisement } from "@/components/home-advertisement";
import { filterJobs, isUrgent, publishedAgo, publishedInLastDaysCount, type JobListItem, type JobListMode } from "@/lib/job-list";
import { useEmployerLogo } from "@/hooks/use-employer-logo";
import { cn } from "@/lib/utils";

function EmployerLogo({ job }: { job: JobListItem }) {
  const { src, ref, onError } = useEmployerLogo(job.fotoEmpresa || job.image);
  return <div className="job-logo">{src ? <img ref={ref} src={src} alt={job.Empresa || "Empresa"} onError={onError} /> : <Building2 aria-hidden="true" />}</div>;
}

export function JobListScreen({ jobs }: { jobs: JobListItem[] }) {
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<JobListMode>("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [location, setLocation] = useState("");
  const [contract, setContract] = useState("");
  const visible = filterJobs(jobs, search, mode, location, contract);
  const locations = [...new Set(jobs.map(job => job.ciudad || job.ubicacion).filter((value): value is string => Boolean(value)))].sort();
  const contracts = [...new Set(jobs.map(job => job.tipoContrato).filter((value): value is string => Boolean(value)))].sort();
  const tabs = [
    { id: "all" as const, label: "Todas", icon: BriefcaseBusiness, count: `+${publishedInLastDaysCount(jobs)}` },
    { id: "urgent" as const, label: "Urgentes", icon: Flame, count: undefined },
    { id: "latest" as const, label: "Últimos", icon: Clock, count: Math.min(36, jobs.length) },
  ];
  return <main className="employment-screen">
    <h1 className="sr-only">Empleos en Uruguay</h1>
    <HomeAdvertisement />
    <header className="employment-header">
      <div className="employment-search-row">
        <div className="employment-search"><Search aria-hidden="true" /><Input aria-label="Buscar un puesto de trabajo" placeholder="Busca un puesto de trabajo" value={search} onChange={event => setSearch(event.target.value)} /></div>
        <Button variant="outline" size="icon" className={cn("employment-filter", (location || contract) && "filter-active")} aria-label="Filtrar empleos" title="Filtrar empleos" onClick={() => setFiltersOpen(true)}><SlidersHorizontal /></Button>
      </div>
      <div className="employment-tabs" role="tablist" aria-label="Tipo de empleos">
        {tabs.map(({ id, label, icon: Icon, count }) => <Button key={id} role="tab" aria-selected={mode === id} variant="ghost" className={cn("employment-tab", mode === id && "selected")} onClick={() => setMode(id)}><Icon /><span>{label}</span>{count !== undefined && <span className="tab-count">{count}</span>}</Button>)}
      </div>
    </header>
    <section className="employment-list" aria-label="Empleos disponibles">
      {visible.map(job => <Link className={cn("employment-card", job.isFeatured && "featured", isUrgent(job) && "urgent")} key={job.id} to="/llamado/$jobId" params={{ jobId: String(job.id) }} preload="intent" preloadDelay={0}>
        <div className="employment-card-main"><EmployerLogo job={job} /><div className="employment-copy"><p className="employment-company">{job.Empresa || "Empresa"}</p><h2>{job.titulo || "Oferta de empleo"}</h2><p className="employment-description">{job.descripcion}</p></div><span className="employment-arrow"><ChevronRight aria-hidden="true" /></span></div>
        <div className="employment-meta"><span className="location-chip"><MapPin aria-hidden="true" /><span>{job.ubicacion || job.ciudad || "Uruguay"}</span></span><span className="date-chip"><Clock aria-hidden="true" />{publishedAgo(job.created_at)}</span></div>
        {(job.isLlamado || job.isFeatured || isUrgent(job)) && <div className="employment-badges">{job.isLlamado && <span className="llamado-badge">Llamado público</span>}{job.isFeatured && <span>Destacada</span>}{isUrgent(job) && <span>Urgente</span>}</div>}
      </Link>)}
      {!visible.length && <div className="employment-empty"><Search /><h2>No se encontraron empleos</h2><Button variant="outline" onClick={() => { setSearch(""); setLocation(""); setContract(""); setMode("all"); }}>Ver todos</Button></div>}
    </section>
    <AppBottomNav active="empleos" />
    <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}><DialogContent className="max-w-sm rounded-lg"><DialogHeader><DialogTitle>Filtrar empleos</DialogTitle><DialogDescription>Ubicación y tipo de contrato</DialogDescription></DialogHeader>
      <label className="grid gap-2 text-sm font-medium">Ubicación<select className="h-11 rounded-md border bg-background px-3 text-foreground" value={location} onChange={event => setLocation(event.target.value)}><option value="">Todas las ubicaciones</option>{locations.map(value => <option key={value}>{value}</option>)}</select></label>
      <label className="grid gap-2 text-sm font-medium">Contrato<select className="h-11 rounded-md border bg-background px-3 text-foreground" value={contract} onChange={event => setContract(event.target.value)}><option value="">Todos los contratos</option>{contracts.map(value => <option key={value}>{value}</option>)}</select></label>
      <div className="flex gap-2"><Button variant="outline" onClick={() => { setLocation(""); setContract(""); }}>Limpiar</Button><Button className="flex-1" onClick={() => setFiltersOpen(false)}>Ver empleos</Button></div>
    </DialogContent></Dialog>
  </main>;
}