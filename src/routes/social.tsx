import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getSocialPosts } from "@/lib/jobs.functions";
import { SocialScreen } from "@/components/social-screen";
import { toSocialPosts } from "@/lib/social-posts";
import { NavigationLoading } from '@/components/navigation-loading';

const socialQueryOptions = queryOptions({
  queryKey: ["social-posts"],
  queryFn: async () => toSocialPosts(await getSocialPosts()),
  staleTime: 60_000,
});

export const Route = createFileRoute("/social")({
  head: () => ({
    meta: [
      { title: "EmpleosUy · Social: pósteres de ofertas" },
      { name: "description", content: "Recorré los pósteres de las ofertas de trabajo publicadas en EmpleosUy." },
      { property: "og:title", content: "EmpleosUy · Pósteres de ofertas" },
      { property: "og:description", content: "Pósteres de ofertas de trabajo en Uruguay, uno tras otro." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(socialQueryOptions),
  pendingMs: 100,
  pendingMinMs: 0,
  pendingComponent: () => <NavigationLoading active="social" />,
  component: SocialPage,
  errorComponent: () => (
    <div className="min-h-screen bg-muted p-6 text-center text-foreground">
      No pudimos cargar los pósteres. Intentá nuevamente.
    </div>
  ),
});

function SocialPage() {
  const { data } = useSuspenseQuery(socialQueryOptions);
  return <SocialScreen posts={data} />;
}
