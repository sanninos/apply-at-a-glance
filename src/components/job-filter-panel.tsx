import { useState } from "react";
import { Clock, Flame, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import type { JobListMode } from "@/lib/job-list";

export type JobFilterValues = { mode: JobListMode; location: string; contract: string };

export function JobFilterPanel({ open, onOpenChange, value, locations, contracts, onApply }: {
  open: boolean; onOpenChange: (open: boolean) => void; value: JobFilterValues;
  locations: string[]; contracts: string[]; onApply: (value: JobFilterValues) => void;
}) {
  return <Drawer open={open} onOpenChange={onOpenChange} shouldScaleBackground={false}>
    <DrawerContent className="job-filter-drawer">
      {open && <FilterContents value={value} locations={locations} contracts={contracts} onApply={onApply} onClose={() => onOpenChange(false)} />}
    </DrawerContent>
  </Drawer>;
}

function FilterContents({ value, locations, contracts, onApply, onClose }: {
  value: JobFilterValues; locations: string[]; contracts: string[];
  onApply: (value: JobFilterValues) => void; onClose: () => void;
}) {
  const [draft, setDraft] = useState(value);
  return <>
    <header className="job-filter-head"><DrawerTitle>Filtros</DrawerTitle><Button variant="ghost" size="icon" aria-label="Cerrar filtros" title="Cerrar filtros" onClick={onClose}><X /></Button></header>
    <DrawerDescription className="sr-only">Filtros de empleos por tipo, ubicación y contrato.</DrawerDescription>
    <div className="job-filter-body">
      <section><h2>EMPLEOS</h2><div className="job-filter-chips">
        {([{ mode: "all", label: "Todos", icon: null }, { mode: "urgent", label: "Urgentes", icon: Flame }, { mode: "latest", label: "Últimos", icon: Clock }] as const).map(({ mode, label, icon: Icon }) => <Button key={mode} variant="ghost" aria-pressed={draft.mode === mode} className={draft.mode === mode ? "selected" : ""} onClick={() => setDraft({ ...draft, mode })}>{Icon && <Icon />}{label}</Button>)}
      </div></section>
      <section><h2>UBICACIÓN</h2><div className="job-filter-chips"><Button variant="ghost" className={!draft.location ? "selected" : ""} aria-pressed={!draft.location} onClick={() => setDraft({ ...draft, location: "" })}><span className="location-pin" aria-hidden="true">📍</span>Todas</Button></div>
        <label className="job-filter-select"><span className="sr-only">Ubicación</span><select value={draft.location} onChange={(event) => setDraft({ ...draft, location: event.target.value })}><option value="">Todas las ubicaciones</option>{locations.map((location) => <option key={location}>{location}</option>)}</select></label>
      </section>
      <section><h2>TIPO DE CONTRATO</h2><div className="job-filter-chips"><Button variant="ghost" className={!draft.contract ? "selected" : ""} aria-pressed={!draft.contract} onClick={() => setDraft({ ...draft, contract: "" })}>Todos</Button></div><label className="job-filter-select"><span className="sr-only">Contrato</span><select value={draft.contract} onChange={(event) => setDraft({ ...draft, contract: event.target.value })}><option value="">Todos los contratos</option>{contracts.map((contract) => <option key={contract}>{contract}</option>)}</select></label></section>
    </div>
    <footer className="job-filter-footer"><Button variant="outline" onClick={() => setDraft({ mode: "all", location: "", contract: "" })}>Limpiar</Button><Button onClick={() => { onApply(draft); onClose(); }}>Ver resultados</Button></footer>
  </>;
}