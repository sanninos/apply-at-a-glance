// ============= Full file contents =============
import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { BriefcaseBusiness, ChevronDown, ChevronRight } from "lucide-react";
import { AppBottomNav } from "@/components/app-bottom-nav";
import { useEmployerLogo } from "@/hooks/use-employer-logo";
import { publishedAgo } from "@/lib/job-list";
import { markPosterSeen, recordSocialPosterIds } from "@/lib/social-badge";
import type { SocialPost } from "@/lib/social-posts";

export function SocialScreen({ posts }: { posts: SocialPost[] }) {
  const [seenScroll, setSeenScroll] = useState(false);

  useEffect(() => {
    recordSocialPosterIds(posts.map((post) => String(post.id)));
  }, [posts]);


  return (
    <main className="social-screen">
      <h1 className="sr-only">Social</h1>
      {posts.length ? (
        <section
          className="social-feed"
          aria-label="Pósteres de ofertas de trabajo"
          onScroll={(event) => {
            if (!seenScroll && event.currentTarget.scrollTop > 24) setSeenScroll(true);
          }}
        >
          {posts.map((post, index) => (
            <SocialPostCard
              key={post.id}
              post={post}
              showScrollHint={false}
            />
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

function SocialPostCard({
  post,
  showScrollHint = false,
}: {
  post: SocialPost;
  showScrollHint?: boolean;
}) {
  const [broken, setBroken] = useState(false);
  const cardRef = useRef<HTMLAnchorElement>(null);
  const { src, ref, onError } = useEmployerLogo(post.fotoEmpresa || post.image);

  useEffect(() => {
    const element = cardRef.current;
    if (!element || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          markPosterSeen(String(post.id));
          observer.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [post.id]);

  if (broken) return null;
  const location = post.ubicacion || post.ciudad || "Uruguay";
  return (
    <Link
      ref={cardRef}
      className="social-post"
      to="/llamado/$jobId"
      params={{ jobId: String(post.id) }}
      preload="intent"
      preloadDelay={0}
    >
      <img
        className="social-poster-blur"
        src={post.poster}
        alt=""
        aria-hidden="true"
        loading="lazy"
        tabIndex={-1}
      />
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
            <span className="location-pin" aria-hidden="true">📍</span>
            <span>{location}</span>
          </p>
          <p className="social-summary-company">{post.Empresa || "Empresa"}</p>
        </div>
        <span className="employment-arrow">
          <ChevronRight aria-hidden="true" />
        </span>
      </div>
      {showScrollHint && (
        <p className="social-scroll-hint" aria-hidden="true">
          <span>Deslizá</span>
          <ChevronDown />
        </p>
      )}
    </Link>
  );
}
