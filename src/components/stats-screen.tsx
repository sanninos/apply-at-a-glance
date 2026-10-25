import { useQuery } from "@tanstack/react-query";
import { BarChart3, Bookmark, ChartNoAxesColumnIncreasing, FileText, LogIn, RefreshCw, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppBottomNav } from "@/components/app-bottom-nav";
import { useAccessDialog } from "@/components/access-dialog";
import { useAccess } from "@/components/access-provider";
import { supabase } from "@/integrations/supabase/client";
import { statCountLabel, summarizeCurriculum, summarizePostulaciones, type PostulacionesSummary, type CurriculumSummary } from "@/lib/profile-stats";
import type { CurriculumRow } from "@/lib/curriculum";
import { cn } from "@/lib/utils";

type Stats = { postulaciones: PostulacionesSummary; saved: number; curriculum: CurriculumSummary };

export function StatsScreen() {
  const { user, ready } = useAccess();
  const { open: openAccess } = useAccessDialog();
  const stats = useQuery({
    queryKey: ["profile-stats", user?.id],
    enabled: ready && Boolean(user),
    queryFn: async (): Promise<Stats> => {
      const [postulaciones, guardadas, curriculum] = await Promise.all([
        supabase.from("postulaciones").select("id, estado"),
        supabase.from("ofertas_guardadas").select("job_id"),
        supabase.from("curriculums").select("full_name, phone, summary, experiences, education, skills").limit(1),
      ]);
      if (postulaciones.error) throw new Error(postulaciones.error.message);
      if (guardadas.error) throw new Error(guardadas.error.message);
      if (curriculum.error) throw new Error(curriculum.error.message);
      return {
        postulaciones: summarizePostulaciones((postulaciones.data ?? []) as { estado: string }[]),
        saved: guardadas.data?.length ?? 0,
        curriculum: summarizeCurriculum(curriculum.data[0] as CurriculumRow | undefined),
      };
    },
  });

  const signedIn = ready && Boolean(user);
  const data = stats.data;

  return <main className="stats-screen">
    <header className="stats-header">
      <div className="stats-heading">
        <h1>ESTADÍSTICAS DEL PERFIL</h1>
        <p>{signedIn ? "Tus números, con datos de tu cuenta" : "Tu actividad en URUJOBS"}</p>
      </div>
    </header>

    {!ready && <p className="stats-note">Cargando tu cuenta…</p>}

    {ready && !user && <section className="stats-login">
      <LogIn aria-hidden="true" />
      <h2>Ingresá para ver tus estadísticas</h2>
      <p>Se calculan con tus postulaciones, guardados y curriculum.</p>
      <Button className="stats-login-cta" onClick={openAccess}>Ingresar o registrarse</Button>
    </section>}

    {signedIn && stats.isPending && <p className="stats-note">Cargando tus estadísticas…</p>}

    {signedIn && stats.isError && <section className="stats-error" role="alert">
      <p>No pudimos cargar tus estadísticas.</p>
      <Button variant="outline" onClick={() => void stats.refetch()}><RefreshCw />Reintentar</Button>
    </section>}

    {signedIn && data && <section className="stats-list">
      <article className="stats-block">
        <h2 className="stats-block-title"><Send aria-hidden="true" />TUS POSTULACIONES</h2>
        <p className="stats-big">{statCountLabel(data.postulaciones.total, "postulación", "postulaciones")}</p>
        {data.postulaciones.total > 0
          ? <div className="stats-chips">
            {data.postulaciones.byEstado.map((estado) => (
              <span className={cn("applications-status", estado.tone)} key={estado.estado}>{estado.count} {estado.label}</span>
            ))}
          </div>
          : <p className="stats-block-empty">Todavía no te postulaste a ninguna oferta.</p>}
      </article>

      <Link to="/ofertas-guardadas" className="stats-block stats-link">
        <h2 className="stats-block-title"><Bookmark aria-hidden="true" />OFERTAS GUARDADAS</h2>
        <p className="stats-big">{statCountLabel(data.saved, "oferta", "ofertas")}</p>
        {data.saved === 0 && <p className="stats-block-empty">Guardá ofertas con el botón «Guardar» para encontrarlas rápido.</p>}
      </Link>

      <Link to="/editar-curriculum" className="stats-block stats-link">
        <h2 className="stats-block-title"><FileText aria-hidden="true" />TU CURRICULUM</h2>
        {data.curriculum.saved
          ? <>
            <p className="stats-big">Guardado</p>
            <p className="stats-block-sub">{statCountLabel(data.curriculum.experiences, "experiencia", "experiencias")} · {statCountLabel(data.curriculum.education, "estudio", "estudios")} · {statCountLabel(data.curriculum.skills, "habilidad", "habilidades")}</p>
          </>
          : <>
            <p className="stats-big">Pendiente</p>
            <p className="stats-block-empty">Todavía no armaste tu curriculum. Tocá para empezarlo.</p>
          </>}
      </Link>

      <article className="stats-block">
        <h2 className="stats-block-title"><ChartNoAxesColumnIncreasing aria-hidden="true" />VISITAS A TU PERFIL</h2>
        <p className="stats-big">Próximamente</p>
        <p className="stats-block-empty">Todavía no registramos visitas al perfil. Cuando esté disponible vas a verlas acá.</p>
      </article>
    </section>}

    <AppBottomNav active="perfil" />
  </main>;
}
