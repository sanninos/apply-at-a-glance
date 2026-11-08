import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, BriefcaseBusiness } from "lucide-react";
import { countJobsByPosition, positionCount, positionCountLabel, positionIconUrl, type JobPosition } from "@/lib/job-positions";
import type { JobListItem } from "@/lib/job-list";
import { cn } from "@/lib/utils";

export function PositionIcon({ position }: { position: JobPosition }) {
  const url = positionIconUrl(position.icon);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  return <span className="position-icon" aria-hidden="true">{url && failedUrl !== url
    ? <img src={url} alt="" loading="lazy" onError={() => setFailedUrl(url)} />
    : <BriefcaseBusiness />}</span>;
}

export function PositionLink({ position, count }: { position: JobPosition; count?: number }) {
  const empty = count === 0;
  return <Link to="/puestos/$puestoId" params={{ puestoId: position.id }} preload="intent" preloadDelay={0} className={cn("position-category", empty && "is-empty")}>
    <PositionIcon position={position} /><span className="position-name">{position.nombre}</span>
    {count !== undefined && <span className="position-count">{positionCountLabel(count)}</span>}
  </Link>;
}

export function JobPositionCategories({ positions, jobs }: { positions: JobPosition[]; jobs: JobListItem[] }) {
  if (!positions.length) return null;
  const counts = countJobsByPosition(jobs);
  const ordered = [...positions].sort((a, b) => positionCount(counts, b) - positionCount(counts, a));
  return <section className="home-positions" aria-labelledby="home-positions-title">
    <header><h2 id="home-positions-title">Explorá por puesto</h2><Link to="/puestos" preload="intent">Ver todos <ArrowRight aria-hidden="true" /></Link></header>
    <div className="position-category-rail">{ordered.slice(0, 8).map(position => <PositionLink key={position.id} position={position} count={positionCount(counts, position)} />)}</div>
  </section>;
}
