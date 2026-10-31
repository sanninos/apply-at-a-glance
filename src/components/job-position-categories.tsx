import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, BriefcaseBusiness } from "lucide-react";
import { jobsForPosition, positionIconUrl, type JobPosition } from "@/lib/job-positions";
import type { JobListItem } from "@/lib/job-list";

export function PositionIcon({ position }: { position: JobPosition }) {
  const url = positionIconUrl(position.icon);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  return <span className="position-icon" aria-hidden="true">{url && failedUrl !== url
    ? <img src={url} alt="" loading="lazy" onError={() => setFailedUrl(url)} />
    : <BriefcaseBusiness />}</span>;
}

export function PositionLink({ position }: { position: JobPosition }) {
  return <Link to="/puestos/$puestoId" params={{ puestoId: position.id }} preload="intent" preloadDelay={0} className="position-category">
    <PositionIcon position={position} /><span>{position.nombre}</span>
  </Link>;
}

export function JobPositionCategories({ positions, jobs }: { positions: JobPosition[]; jobs: JobListItem[] }) {
  if (!positions.length) return null;
  const ordered = [...positions].sort((a, b) => jobsForPosition(jobs, b).length - jobsForPosition(jobs, a).length);
  return <section className="home-positions" aria-labelledby="home-positions-title">
    <header><h2 id="home-positions-title">Explorá por puesto</h2><Link to="/puestos" preload="intent">Ver todos <ArrowRight aria-hidden="true" /></Link></header>
    <div className="position-category-rail">{ordered.slice(0, 8).map(position => <PositionLink key={position.id} position={position} />)}</div>
  </section>;
}