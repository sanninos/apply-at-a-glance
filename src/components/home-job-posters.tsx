import { useState } from "react";
import { Link } from "@tanstack/react-router";
import type { JobListItem } from "@/lib/job-list";

export function HomeJobPosters({ jobs }: { jobs: JobListItem[] }) {
  const [failed, setFailed] = useState<string[]>([]);
  const posters = jobs.filter(job => job.poster?.trim() && !failed.includes(job.poster.trim())).slice(0, 12);
  if (!posters.length) return null;

  return <section className="home-job-posters" aria-label="Portadas de empleos">
    <div className="home-posters-rail" tabIndex={0} aria-label="Portadas de ofertas de empleo">
      {posters.map(job => <Link key={job.id} className="home-poster-card" to="/llamado/$jobId" params={{ jobId: String(job.id) }} preload="intent" preloadDelay={0}>
        <div className="home-poster-image"><img src={job.poster?.trim()} alt={`Portada: ${job.titulo || "Oferta de empleo"}`} loading="lazy" onError={() => { const poster = job.poster?.trim(); if (poster) setFailed(current => [...current, poster]); }} /></div>
        <div className="home-poster-caption"><h3>{job.titulo || "Oferta de empleo"}</h3><p>{job.Empresa || "Empresa"}</p></div>
      </Link>)}
    </div>
  </section>;
}