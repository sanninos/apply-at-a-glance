import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { publishedAgo } from "@/lib/job-list";
import { SimilarJobsSkeleton } from "@/components/job-card-skeleton";

type SimilarJob = { id: number; titulo: string | null; Empresa: string | null; ubicacion: string | null; ciudad: string | null; created_at: string };

/** Up to 4 other offers with the same puesto, newest first; hidden when none. */
export function SimilarJobs({ jobId, puesto }: { jobId: number; puesto: string | null }) {
  const name = puesto?.trim();
  const similar = useQuery({
    queryKey: ["similar-jobs", jobId, name],
    enabled: Boolean(name),
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("JobsDetails")
        .select("id, titulo, Empresa, ubicacion, ciudad, created_at")
        .eq("puesto", name!)
        .neq("id", jobId)
        .order("created_at", { ascending: false })
        .limit(4);
      if (error) throw new Error(error.message);
      return (data ?? []) as SimilarJob[];
    },
  });
  if (name && similar.isPending) return <SimilarJobsSkeleton count={4} />;
  if (!similar.data?.length) return null;
  return <section className="mt-6" aria-labelledby="similar-jobs-title">
    <h2 id="similar-jobs-title" className="font-bold text-foreground mb-3 mx-5">Empleos similares</h2>
    <div className="similar-jobs-track px-5 scroll-px-5">
      {similar.data.map((job) => <Link key={job.id} to="/llamado/$jobId" params={{ jobId: String(job.id) }} preload="intent" className="similar-job-card">
        <h3>{job.titulo || "Oferta de empleo"}</h3>
        <p className="similar-job-company">{job.Empresa || "Empresa"}</p>
        {(job.ciudad || job.ubicacion) && <p className="similar-job-meta">📍 {job.ciudad || job.ubicacion}</p>}
        <p className="similar-job-time">{publishedAgo(job.created_at)}</p>
      </Link>)}
    </div>
  </section>;
}
