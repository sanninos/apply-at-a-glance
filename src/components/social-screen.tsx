import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { BriefcaseBusiness, ChevronRight, MapPin } from "lucide-react";
import { AppBottomNav } from "@/components/app-bottom-nav";
import { useEmployerLogo } from "@/hooks/use-employer-logo";
import { publishedAgo } from "@/lib/job-list";
import type { SocialPost } from "@/lib/social-posts";

export function SocialScreen({ posts }: { posts: SocialPost[] }) {
  return (
    <main className="social-screen">
      <h1 className="sr-only">Social</h1>
      {posts.length ? (
        <section className="social-feed" aria-label="Pósteres de ofertas de trabajo">
          {posts.map((post) => (
            <SocialPostCard key={post.id} post={post} />
          ))}
        </section>
      ) : (
        <div className="employment-empty">
          <BriefcaseBusiness />
          <h2>No hay pósteres publicados todavía</h2>
        </div>
      )}
      <AppBottomNav active="social" />
    </main>
  );
}

function SocialPostCard({ post }: { post: SocialPost }) {
  const [broken, setBroken] = useState(false);
  const { src, ref, onError } = useEmployerLogo(post.fotoEmpresa || post.image);
  if (broken) return null;
  const location = post.ubicacion || post.ciudad || "Uruguay";
  return (
    <Link
      className="social-post"
      to="/llamado/$jobId"
      params={{ jobId: String(post.id) }}
      preload="intent"
      preloadDelay={0}
    >
      <img
        className="social-poster"
        src={post.poster}
        alt={`Póster de la oferta: ${post.titulo || "Empleo"}`}
        loading="lazy"
        onError={() => setBroken(true)}
      />
      <div className="social-summary">
        <div className="job-logo">
          {src ? (
            <img ref={ref} src={src} alt={post.Empresa || "Empresa"} onError={onError} />
          ) : (
            <BriefcaseBusiness aria-hidden="true" />
          )}
        </div>
        <div className="social-summary-copy">
          <p className="social-summary-title">{post.titulo || "Oferta de empleo"}</p>
          <p className="social-summary-loc">
            <MapPin aria-hidden="true" />
            <span>{location}</span>
          </p>
          <p className="social-summary-company">{post.Empresa || "Empresa"}</p>
        </div>
        <span className="employment-arrow">
          <ChevronRight aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}
