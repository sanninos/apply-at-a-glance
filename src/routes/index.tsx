import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, Bookmark, Share2, MapPin, Clock, Briefcase, Wallet, CalendarDays, CheckCircle2, Building2 } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Detalle del llamado laboral" },
      { name: "description", content: "Información completa de un llamado laboral: requisitos, beneficios y postulación." },
      { property: "og:title", content: "Detalle del llamado laboral" },
      { property: "og:description", content: "Requisitos, beneficios y postulación en un solo lugar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: JobDetail,
});

const datos = [
  { icon: MapPin, label: "Ubicación", value: "Montevideo" },
  { icon: Clock, label: "Jornada", value: "Full time" },
  { icon: Briefcase, label: "Modalidad", value: "Híbrido" },
  { icon: Wallet, label: "Salario", value: "$ 85.000" },
];

const requisitos = [
  "Bachillerato completo",
  "2+ años de experiencia en atención al cliente",
  "Manejo de herramientas ofimáticas",
  "Disponibilidad para trabajar en equipo",
];

const beneficios = ["Seguro médico", "Capacitación continua", "Día de cumpleaños libre"];

function JobDetail() {
  return (
    <div className="min-h-screen bg-muted flex justify-center">
      <div className="relative w-full max-w-md bg-background min-h-screen pb-28">
        <header className="bg-primary text-primary-foreground px-5 pt-6 pb-16 rounded-b-[2rem]">
          <div className="flex items-center justify-between">
            <button aria-label="Volver" className="size-10 grid place-items-center rounded-full bg-primary-foreground/15"><ArrowLeft className="size-5" /></button>
            <div className="flex gap-2">
              <button aria-label="Compartir" className="size-10 grid place-items-center rounded-full bg-primary-foreground/15"><Share2 className="size-5" /></button>
              <button aria-label="Guardar" className="size-10 grid place-items-center rounded-full bg-primary-foreground/15"><Bookmark className="size-5" /></button>
            </div>
          </div>
        </header>

        <section className="-mt-12 mx-5 rounded-3xl bg-card shadow-lg p-5 text-center">
          <div className="mx-auto -mt-12 size-16 rounded-2xl bg-accent text-accent-foreground grid place-items-center shadow-md">
            <Building2 className="size-8" />
          </div>
          <h1 className="mt-3 text-xl font-bold text-foreground">Asistente de Atención al Cliente</h1>
          <p className="text-sm text-muted-foreground">Banco Oriental · Publicado hace 2 días</p>
          <div className="mt-3 flex justify-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium">Llamado abierto</span>
            <span className="px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium">3 vacantes</span>
          </div>
        </section>

        <section className="mx-5 mt-5 grid grid-cols-2 gap-3">
          {datos.map(({ icon: Icon, label, value }) => (
            <div key={label} className="rounded-2xl border bg-card p-3 flex items-center gap-3">
              <div className="size-9 rounded-xl bg-accent text-accent-foreground grid place-items-center"><Icon className="size-4" /></div>
              <div>
                <p className="text-[11px] text-muted-foreground">{label}</p>
                <p className="text-sm font-semibold text-foreground">{value}</p>
              </div>
            </div>
          ))}
        </section>

        <div className="mx-5 mt-4 rounded-2xl bg-accent text-accent-foreground p-3 flex items-center gap-3">
          <CalendarDays className="size-5" />
          <p className="text-sm"><span className="font-semibold">Cierre de postulación:</span> 15 de noviembre</p>
        </div>

        <section className="mx-5 mt-6">
          <h2 className="font-bold text-foreground mb-2">Descripción</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Buscamos personas proactivas para brindar atención presencial y telefónica a clientes, gestionar consultas y acompañar procesos de servicio con calidad.
          </p>
        </section>

        <section className="mx-5 mt-6">
          <h2 className="font-bold text-foreground mb-3">Requisitos</h2>
          <ul className="space-y-2">
            {requisitos.map((r) => (
              <li key={r} className="flex gap-2 text-sm text-foreground"><CheckCircle2 className="size-5 text-primary shrink-0" />{r}</li>
            ))}
          </ul>
        </section>

        <section className="mx-5 mt-6">
          <h2 className="font-bold text-foreground mb-3">Beneficios</h2>
          <div className="flex flex-wrap gap-2">
            {beneficios.map((b) => (
              <span key={b} className="px-3 py-1.5 rounded-full border text-sm text-foreground">{b}</span>
            ))}
          </div>
        </section>

        <footer className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-background/95 backdrop-blur border-t p-4 flex gap-3">
          <button className="size-12 rounded-2xl border grid place-items-center text-foreground" aria-label="Guardar"><Bookmark className="size-5" /></button>
          <button className="flex-1 h-12 rounded-2xl bg-primary text-primary-foreground font-semibold shadow-md">Postularme</button>
        </footer>
      </div>
    </div>
  );
}
