import { useState } from "react";
import { Clock, Flame, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { URUGUAY_DEPARTMENTS } from "@/lib/job-departments";
import { CONTRACT_FAMILIES } from "@/lib/job-contracts";
import type { JobListMode } from "@/lib/job-list";

export type JobFilterValues = { mode: JobListMode; department: string; contract: string };

export function JobFilterPanel({ open, onOpenChange, value, contracts, onApply }: {
  open: boolean; onOpenChange: (open: boolean) => void; value: JobFilterValues;
  contracts: string[]; onApply: (value: JobFilterValues) => void;
}) {
  return <Drawer open={open} onOpenChange={onOpenChange} shouldScaleBackground={false}>
    <DrawerContent className="job-filter-drawer">
      {open && <FilterContents value={value} contracts={contracts} onApply={onApply} onClose={() => onOpenChange(false)} />}
    </DrawerContent>
  </Drawer>;
}

function FilterContents({ value, contracts, onApply, onClose }: {
  value: JobFilterValues; contracts: string[];
  onApply: (value: JobFilterValues) => void; onClose: () => void;
}) {
  const [draft, setDraft] = useState(value);
  const contractFamilies = CONTRACT_FAMILIES.filter((family) => contracts.includes(family.id));
  return <>
    <header className="job-filter-head"><DrawerTitle>Filtros</DrawerTitle><Button variant="ghost" size="icon" aria-label="Cerrar filtros" title="Cerrar filtros" onClick={onClose}><X /></Button></header>
    <DrawerDescription className="sr-only">Filtros de empleos por tipo, departamento y contrato.</DrawerDescription>
    <div className="job-filter-body">
      <section><h2>EMPLEOS</h2><div className="job-filter-chips">
        {([{ mode: "all", label: "Todos", icon: null }, { mode: "urgent", label: "Urgentes", icon: Flame }, { mode: "latest", label: "Últimos", icon: Clock }] as const).map(({ mode, label, icon: Icon }) => <Button key={mode} variant="ghost" aria-pressed={draft.mode === mode} className={draft.mode === mode ? "selected" : ""} onClick={() => setDraft({ ...draft, mode })}>{Icon && <Icon />}{label}</Button>)}
      </div></section>
      <section><h2>DEPARTAMENTO</h2><div className="job-filter-chips job-filter-departments">
        <Button variant="ghost" className={!draft.department ? "selected" : ""} aria-pressed={!draft.department} onClick={() => setDraft({ ...draft, department: "" })}><span className="location-pin" aria-hidden="true">📍</span>Todos</Button>
        {URUGUAY_DEPARTMENTS.map((department) => <Button key={department} variant="ghost" className={draft.department === department ? "selected" : ""} aria-pressed={draft.department === department} onClick={() => setDraft({ ...draft, department })}>{department}</Button>)}
      </div></section>
      <section><h2>TIPO DE CONTRATO</h2><div className="job-filter-chips job-filter-contracts" role="group" aria-label="Tipo de contrato">
        <Button variant="ghost" className={!draft.contract ? "selected" : ""} aria-pressed={!draft.contract} onClick={() => setDraft({ ...draft, contract: "" })}>Todos</Button>
        {contractFamilies.map(({ id, label }) => <Button key={id} variant="ghost" className={draft.contract === id ? "selected" : ""} aria-pressed={draft.contract === id} onClick={() => setDraft({ ...draft, contract: id })}>{label}</Button>)}
      </div></section>
    </div>
    <footer className="job-filter-footer"><Button variant="outline" onClick={() => setDraft({ mode: "all", department: "", contract: "" })}>Limpiar</Button><Button onClick={() => { onApply(draft); onClose(); }}>Ver resultados</Button></footer>
  </>;
}
