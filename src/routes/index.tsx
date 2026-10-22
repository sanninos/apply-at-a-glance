import { createFileRoute, redirect } from "@tanstack/react-router";
import { getLatestLlamadoId } from "@/lib/jobs.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Llamados laborales" },
      { name: "description", content: "Últimos llamados laborales publicados." },
      { property: "og:title", content: "Llamados laborales" },
      { property: "og:description", content: "Últimos llamados laborales publicados." },
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
