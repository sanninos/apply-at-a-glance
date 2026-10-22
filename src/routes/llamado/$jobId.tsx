import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Bookmark,
  Share2,
  MapPin,
  Clock,
  Briefcase,
  Wallet,
  CalendarDays,
  CheckCircle2,
  Building2,
  Users,
} from "lucide-react";
import { getJobById, type JobDetailData } from "@/lib/jobs.functions";

const jobQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ["job", id],
    queryFn: async () => {
      const job = await getJobById({ data: id });
      if (!job) throw notFound();
      return job;
    },
  });

export const Route = createFileRoute("/llamado/$jobId")({
  loader: ({ params, context }) =>
    context.queryClient.ensureQueryData(jobQueryOptions(Number(params.jobId))),
  head: ({ loaderData }) => {
    const job = loaderData as JobDetailData | undefined;
    const titulo = job?.titulo ?? "Llamado laboral";
    const empresa = job?.empresa ? ` · ${job.empresa}` : "";
    return {
      meta: [
        { title: `${titulo}${empresa}` },
        {
          name: "description",
          content: `Detalle del llamado: ${titulo}${empresa}. Requisitos, beneficios y postulación.`,
        },
        { property: "og:title", content: `${titulo}${empresa}` },
        { property: "og:description", content: "Requisitos, beneficios y postulación en un solo lugar." },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: JobDetail,
  notFoundComponent: () => (
    <div className="min-h-screen bg-muted flex items-center justify-center p-6">
      <div className="text-center">
        <p className="text-lg font-semibold text-foreground">Llamado no encontrado</p>
        <p className="text-sm text-muted-foreground mt-1">El llamado que buscás no existe o fue dado de baja.</p>
        <Link to="/" className="inline-block mt-4 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium">
          Volver al inicio
        </Link>
      </div>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="min-h-screen bg-muted flex items-center justify-center p-6">
      <div className="text-center">
        <p className="text-lg font-semibold text-foreground">No pudimos cargar el llamado</p>
        <p className="text-sm text-muted-foreground mt-1">{error instanceof Error ? error.message : String(error)}</p>
      </div>
    </div>
  ),
});

function formatFecha(fecha: string | null): string | null {
  if (!fecha) return null;
  const d = new Date(`${fecha}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("es-UY", { day: "numeric", month: "long", year: "numeric" });
}

function formatSalario(salario: number | null): string {
  if (salario == null || salario <= 0) return "A convenir";
  return `$ ${salario.toLocaleString("es-UY")}`;
}

function JobDetail() {
  const { jobId } = Route.useParams();
  const { data: job } = useSuspenseQuery(jobQueryOptions(Number(jobId)));

  const ubicacion = job.ubicacion || job.ciudad || null;
  const datos = [
    { icon: MapPin, label: "Ubicación", value: ubicacion ?? "No especificada" },
    { icon: Clock, label: "Jornada", value: job.jornada ?? "No especificada" },
    { icon: Briefcase, label: "Contrato", value: job.tipoContrato ?? "No especificado" },
    { icon: Wallet, label: "Salario", value: formatSalario(job.salario) },
  ];

  const fechaCierre = formatFecha(job.fechaCierre);
  const fechaInicio = formatFecha(job.fechaInicio);
  const cerrado = job.fechaCierre ? new Date(job.fechaCierre) < new Date() : false;
  const logo = job.fotoEmpresa || job.image;

  return (
    <div className="min-h-screen bg-muted flex justify-center">
      <div className="relative w-full max-w-md bg-background min-h-screen pb-28">
        <header className="bg-primary text-primary-foreground px-5 pt-6 pb-16 rounded-b-[2rem]">
          <div className="flex items-center justify-between invisible" aria-hidden="true">
            <Link to="/" aria-label="Volver" className="size-10 grid place-items-center rounded-full bg-primary-foreground/15">
              <ArrowLeft className="size-5" />
            </Link>
            <div className="flex gap-2">
              <button aria-label="Compartir" className="size-10 grid place-items-center rounded-full bg-primary-foreground/15">
                <Share2 className="size-5" />
              </button>
              <button aria-label="Guardar" className="size-10 grid place-items-center rounded-full bg-primary-foreground/15">
                <Bookmark className="size-5" />
              </button>
            </div>
          </div>
        </header>

        <section className="-mt-12 mx-5 rounded-3xl bg-card shadow-lg p-5 text-center">
          <div className="mx-auto -mt-12 size-16 rounded-2xl bg-accent text-accent-foreground grid place-items-center shadow-md overflow-hidden">
            {logo ? (
              <img src={logo} alt={job.empresa ?? "Empresa"} className="size-full object-cover" />
            ) : (
              <Building2 className="size-8" />
            )}
          </div>
          <h1 className="mt-3 text-xl font-bold text-foreground">{job.titulo}</h1>
          <p className="text-sm text-muted-foreground">
            {job.empresa ?? "Empresa no especificada"}
            {fechaInicio ? ` · Publicado el ${fechaInicio}` : ""}
          </p>
          <div className="mt-3 flex justify-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium">
              {cerrado ? "Llamado cerrado" : "Llamado abierto"}
            </span>
            {job.cantidadCupos != null && job.cantidadCupos > 0 && (
              <span className="px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium">
                {job.cantidadCupos} {job.cantidadCupos === 1 ? "vacante" : "vacantes"}
              </span>
            )}
            {job.categoria && (
              <span className="px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium">
                {job.categoria}
              </span>
            )}
          </div>
        </section>

        <section className="mx-5 mt-5 grid grid-cols-2 gap-3">
          {datos.map(({ icon: Icon, label, value }) => (
            <div key={label} className="rounded-2xl border bg-card p-3 flex items-center gap-3">
              <div className="size-9 rounded-xl bg-accent text-accent-foreground grid place-items-center shrink-0">
                <Icon className="size-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-muted-foreground">{label}</p>
                <p className="text-sm font-semibold text-foreground truncate">{value}</p>
              </div>
            </div>
          ))}
        </section>

        {fechaCierre && (
          <div className="mx-5 mt-4 rounded-2xl bg-accent text-accent-foreground p-3 flex items-center gap-3">
            <CalendarDays className="size-5 shrink-0" />
            <p className="text-sm">
              <span className="font-semibold">Cierre de postulación:</span> {fechaCierre}
            </p>
          </div>
        )}

        {(job.inciso || job.unidadEjecutora) && (
          <div className="mx-5 mt-4 rounded-2xl border bg-card p-3 flex items-center gap-3">
            <Users className="size-5 text-muted-foreground shrink-0" />
            <div className="text-sm">
              {job.inciso && <p className="font-semibold text-foreground">{job.inciso}</p>}
              {job.unidadEjecutora && <p className="text-muted-foreground">{job.unidadEjecutora}</p>}
            </div>
          </div>
        )}

        {job.descripcion && (
          <section className="mx-5 mt-6">
            <h2 className="font-bold text-foreground mb-2">Descripción</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{job.descripcion}</p>
          </section>
        )}

        {job.requisitos && job.requisitos.length > 0 && (
          <section className="mx-5 mt-6">
            <h2 className="font-bold text-foreground mb-3">Requisitos</h2>
            <ul className="space-y-2">
              {job.requisitos.map((r) => (
                <li key={r} className="flex gap-2 text-sm text-foreground">
                  <CheckCircle2 className="size-5 text-primary shrink-0" />
                  {r}
                </li>
              ))}
            </ul>
          </section>
        )}

        {job.empleabilidad && job.empleabilidad.length > 0 && (
          <section className="mx-5 mt-6">
            <h2 className="font-bold text-foreground mb-3">Beneficios</h2>
            <div className="flex flex-wrap gap-2">
              {job.empleabilidad.map((b) => (
                <span key={b} className="px-3 py-1.5 rounded-full border text-sm text-foreground">
                  {b}
                </span>
              ))}
            </div>
          </section>
        )}

        <footer className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-background/95 backdrop-blur border-t p-4 flex gap-3">
          <button className="size-12 rounded-2xl border grid place-items-center text-foreground" aria-label="Guardar">
            <Bookmark className="size-5" />
          </button>
          <button
            disabled={cerrado}
            className="flex-1 h-12 rounded-2xl bg-primary text-primary-foreground font-semibold shadow-md disabled:opacity-50"
          >
            {cerrado ? "Llamado cerrado" : "Postularme"}
          </button>
        </footer>
      </div>
    </div>
  );
}
