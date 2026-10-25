import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BriefcaseBusiness, Building2, ChevronRight, Clock, LogIn, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppBottomNav } from "@/components/app-bottom-nav";
import { useAccessDialog } from "@/components/access-dialog";
import { useAccess } from "@/components/access-provider";
import { supabase } from "@/integrations/supabase/client";
import { applicationCountLabel, applicationStatus, listApplications, type ApplicationItem, type ApplicationRow } from "@/lib/applications";
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
        .select("id, estado, created_at, job_id, JobsDetails(id, titulo, Empresa, ubicacion, ciudad, fotoEmpresa, image, tipoContrato, estado_postulacion, isLlamado)")
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return listApplications((data ?? []) as unknown as ApplicationRow[]);
    },
  });
  const signedIn = ready && Boolean(user);
  const total = applications.data?.length ?? 0;

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
          return <Link key={item.id} className="applications-card" to="/llamado/$jobId" params={{ jobId: String(item.jobId) }} preload="intent" preloadDelay={0}>
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
          </Link>;
        })}
      </section>
      : <section className="applications-empty">
        <BriefcaseBusiness aria-hidden="true" />
        <h2>Todavía no tenés postulaciones</h2>
        <p>Por ahora el botón «Postularme» de cada oferta no guarda tu postulación, así que no hay nada que mostrar. Cuando lo activemos, tus ofertas aparecerán acá.</p>
        <Button asChild variant="outline"><Link to="/">Ver ofertas</Link></Button>
      </section>)}

    <AppBottomNav active="perfil" />
  </main>;
}
