import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { BriefcaseBusiness, Building2, Check, ChevronRight, Clock, LogIn, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppBottomNav } from "@/components/app-bottom-nav";
import { useAccessDialog } from "@/components/access-dialog";
import { useAccess } from "@/components/access-provider";
import { supabase } from "@/integrations/supabase/client";
import { applicationCountLabel, applicationStatus, applicationHistory, applicationTimeline, listApplications, type ApplicationItem, type ApplicationRow } from "@/lib/applications";
import { publishedAgo } from "@/lib/job-list";
import { useEmployerLogo } from "@/hooks/use-employer-logo";
import { cn } from "@/lib/utils";

function ApplicationLogo({ item }: { item: ApplicationItem }) {
  const { src, ref, onError } = useEmployerLogo(item.job.fotoEmpresa || item.job.image);
  return <div className="job-logo">{src ? <img ref={ref} src={src} alt={item.job.Empresa || "Empresa"} onError={onError} /> : <Building2 aria-hidden="true" />}</div>;
}

export function ApplicationsScreen() {
  const { user, ready } = useAccess();
  const { open: openAccess } = useAccessDialog();
  const applications = useQuery({
    queryKey: ["applications", user?.id],
    enabled: ready && Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("postulaciones")
        .select("id, estado, created_at, job_id, JobsDetails(id, titulo, Empresa, ubicacion, ciudad, fotoEmpresa, image, tipoContrato, estado_postulacion, isLlamado), postulaciones_historial(estado, changed_at)")
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return listApplications((data ?? []) as unknown as ApplicationRow[]);
    },
  });
  const signedIn = ready && Boolean(user);
  const total = applications.data?.length ?? 0;
  const [selected, setSelected] = useState<ApplicationItem | null>(null);

  return <main className="applications-screen">
    <header className="applications-header">
      <div className="applications-heading">
        <h1>MIS POSTULACIONES</h1>
        <p>{signedIn ? applicationCountLabel(total) : "Tus ofertas enviadas"}</p>
      </div>
    </header>

    {!ready && <p className="applications-note">Cargando tu cuenta…</p>}

    {ready && !user && <section className="applications-login">
      <LogIn aria-hidden="true" />
      <h2>Ingresá para ver tus postulaciones</h2>
      <p>Solo vos podés verlas.</p>
      <Button className="applications-login-cta" onClick={openAccess}>Ingresar o registrarse</Button>
    </section>}

    {signedIn && applications.isPending && <p className="applications-note">Cargando tus postulaciones…</p>}

    {signedIn && applications.isError && <section className="applications-error" role="alert">
      <p>No pudimos cargar tus postulaciones.</p>
      <Button variant="outline" onClick={() => void applications.refetch()}><RefreshCw />Reintentar</Button>
    </section>}

    {signedIn && applications.data && (applications.data.length > 0
      ? <section className="applications-list" aria-label="Tus postulaciones">
        {applications.data.map(item => {
          const status = applicationStatus(item.estado);
          return <button key={item.id} type="button" className="applications-card" onClick={() => setSelected(item)} aria-label={`Ver proceso de ${item.job.titulo || "la oferta"}`}>
            <ApplicationLogo item={item} />
            <div className="applications-copy">
              <p className="applications-company">{item.job.Empresa || "Empresa"}</p>
              <h2>{item.job.titulo || "Oferta de empleo"}</h2>
              <div className="applications-meta">
                <span className={cn("applications-status", status.tone)}>{status.label}</span>
                <span className="applications-date"><Clock aria-hidden="true" />{publishedAgo(item.appliedAt)}</span>
              </div>
            </div>
            <ChevronRight className="applications-arrow" aria-hidden="true" />
          </button>;
        })}
      </section>
      : <section className="applications-empty">
        <BriefcaseBusiness aria-hidden="true" />
        <h2>Todavía no tenés postulaciones</h2>
        <p>Todavía no te postulaste a ninguna oferta. Abrí una oferta y tocá «Postularme» para anotarla acá.</p>
        <Button asChild variant="outline"><Link to="/">Ver ofertas</Link></Button>
      </section>)}

    {selected && <div className="application-timeline-backdrop" onClick={() => setSelected(null)}>
      <section className="application-timeline-sheet" role="dialog" aria-modal="true" aria-labelledby="application-timeline-title" onClick={(event) => event.stopPropagation()}>
        <span className="about-sheet-handle" aria-hidden="true" />
        <button type="button" className="about-sheet-close" aria-label="Cerrar" onClick={() => setSelected(null)}><X aria-hidden="true" /></button>
        <h2 id="application-timeline-title">Proceso de tu postulación</h2>
        <p className="application-timeline-job">{selected.job.titulo || "Oferta de empleo"}{selected.job.Empresa ? ` · ${selected.job.Empresa}` : ""}</p>
        <ol className="application-timeline">
          {applicationTimeline(selected).map((step) => (
            <li key={step.key} className={`application-timeline-step is-${step.state}`}>
              <span className="application-timeline-dot" aria-hidden="true">{step.state === "done" ? <Check /> : step.state === "rejected" ? <X /> : null}</span>
              <div className="application-timeline-copy">
                <p>{step.label}</p>
                {step.date && <span>{new Date(step.date).toLocaleDateString("es-UY", { day: "numeric", month: "long", year: "numeric" })}</span>}
                {step.state === "current" && <span>Etapa actual</span>}
              </div>
            </li>
          ))}
        </ol>
        {applicationHistory(selected).length > 0 && <div className="application-history">
          <h3>Historial de cambios</h3>
          <ul>{applicationHistory(selected).map((h, i) => <li key={i}><span>{h.label}</span><time dateTime={h.changedAt}>{new Date(h.changedAt).toLocaleString("es-UY", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</time></li>)}</ul>
        </div>}
        <Button asChild className="application-timeline-link"><Link to="/llamado/$jobId" params={{ jobId: String(selected.jobId) }} onClick={() => setSelected(null)}>Ver la oferta</Link></Button>
      </section>
    </div>}

    <AppBottomNav active="perfil" />
  </main>;
}
