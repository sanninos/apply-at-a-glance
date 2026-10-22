import { createFileRoute, redirect } from "@tanstack/react-router";
import { getLatestLlamadoId } from "@/lib/jobs.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EmpleosUy · Detalle del último empleo" },
      { name: "description", content: "Consultá el último empleo publicado, sus requisitos y los detalles de la oferta." },
      { property: "og:title", content: "EmpleosUy · Detalle del último empleo" },
      { property: "og:description", content: "Información y requisitos del último empleo publicado." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  beforeLoad: async () => {
    const id = await getLatestLlamadoId();
    if (id != null) {
      throw redirect({ to: "/llamado/$jobId", params: { jobId: String(id) } });
    }
  },
  component: () => (
    <div className="min-h-screen bg-muted flex items-center justify-center p-6">
      <p className="text-sm text-muted-foreground">No hay llamados publicados todavía.</p>
    </div>
  ),
});
