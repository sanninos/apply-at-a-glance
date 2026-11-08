import { useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { JobListItem } from "@/lib/job-list";

export function HomeJobPosters({ jobs }: { jobs: JobListItem[] }) {
  const rail = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState<string[]>([]);
  const posters = jobs.filter(job => job.poster?.trim() && !failed.includes(job.poster.trim())).slice(0, 12);
  if (!posters.length) return null;

  const slide = (direction: number) => {
    const element = rail.current;
    if (!element) return;
    element.scrollBy({ left: direction * element.clientWidth * 0.84, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  };

  return <section className="home-job-posters" aria-labelledby="home-posters-title">
    <header className="home-posters-header">
      <h2 id="home-posters-title">Portadas de empleos</h2>
      <div className="home-posters-controls">
        <Button variant="ghost" size="icon" aria-label="Portadas anteriores" title="Portadas anteriores" onClick={() => slide(-1)}><ArrowLeft /></Button>
        <Button variant="ghost" size="icon" aria-label="Portadas siguientes" title="Portadas siguientes" onClick={() => slide(1)}><ArrowRight /></Button>
      </div>
    </header>
    <div ref={rail} className="home-posters-rail" tabIndex={0} aria-label="Portadas de ofertas de empleo">
      {posters.map(job => <Link key={job.id} className="home-poster-card" to="/llamado/$jobId" params={{ jobId: String(job.id) }} preload="intent" preloadDelay={0}>
        <div className="home-poster-image"><img src={job.poster?.trim()} alt={`Portada: ${job.titulo || "Oferta de empleo"}`} loading="lazy" onError={() => { const poster = job.poster?.trim(); if (poster) setFailed(current => [...current, poster]); }} /></div>
        <div className="home-poster-caption"><h3>{job.titulo || "Oferta de empleo"}</h3><p>{job.Empresa || "Empresa"}</p></div>
      </Link>)}
    </div>
  </section>;
}