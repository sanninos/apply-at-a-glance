// ============= Full file contents =============
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { BriefcaseBusiness, ChevronDown, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { jobQueryOptions } from "@/lib/job-query";
import { AppBottomNav } from "@/components/app-bottom-nav";
import { useEmployerLogo } from "@/hooks/use-employer-logo";
import { publishedAgo } from "@/lib/job-list";
import { markPosterSeen, recordSocialPosterIds } from "@/lib/social-badge";
import { SocialQuickActions } from "@/components/social-quick-actions";
import type { SocialPost } from "@/lib/social-posts";

export function SocialScreen({
  posts,
  focusJobId = null,
}: {
  posts: SocialPost[];
  focusJobId?: number | null;
}) {
  const [seenScroll, setSeenScroll] = useState(false);
  const feedRef = useRef<HTMLElement>(null);
  const frameRef = useRef(0);
  const [activeId, setActiveId] = useState<number | null>(null);

  // Only the poster currently on screen gets the «Portada / Más información» tabs.
  const syncActive = useCallback(() => {
    const feed = feedRef.current;
    if (!feed) return;
    const feedTop = feed.getBoundingClientRect().top;
    let nearest: number | null = null;
    let nearestDistance = Number.POSITIVE_INFINITY;
    for (const card of Array.from(feed.querySelectorAll<HTMLElement>("[data-job-id]"))) {
      const distance = Math.abs(card.getBoundingClientRect().top - feedTop);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = Number(card.dataset["jobId"]);
      }
    }
    setActiveId(nearest);
  }, []);

  const scheduleSync = useCallback(() => {
    if (frameRef.current) return;
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = 0;
      syncActive();
    });
  }, [syncActive]);

  useEffect(() => {
    const frame = requestAnimationFrame(syncActive);
    return () => cancelAnimationFrame(frame);
  }, [syncActive, posts]);

  useEffect(() => {
    window.addEventListener("resize", scheduleSync);
    return () => {
      window.removeEventListener("resize", scheduleSync);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [scheduleSync]);

  useEffect(() => {
    recordSocialPosterIds(posts.map((post) => String(post.id)));
  }, [posts]);

  // Open directly on the poster asked for (e.g. from the job detail screen).
  useEffect(() => {
    if (focusJobId == null) return;
    if (!posts.some((post) => post.id === focusJobId)) return;
    const jump = () => {
      document
        .getElementById(`social-post-${focusJobId}`)
        ?.scrollIntoView({ block: "start", behavior: "instant" });
      scheduleSync();
    };
    const frame = requestAnimationFrame(jump);
    const retry = setTimeout(jump, 250);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(retry);
    };
  }, [focusJobId, posts, scheduleSync]);


  return (
    <main className="social-screen">
      <h1 className="sr-only">Social</h1>
      {posts.length ? (
        <section
          ref={feedRef}
          className="social-feed"
          aria-label="Pósteres de ofertas de trabajo"
          onScroll={(event) => {
            if (!seenScroll && event.currentTarget.scrollTop > 24) setSeenScroll(true);
            scheduleSync();
          }}
        >
          {posts.map((post, index) => (
            <SocialPostCard
              key={post.id}
              post={post}
              showScrollHint={false}
              isActive={activeId === post.id}
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
  isActive = false,
}: {
  post: SocialPost;
  showScrollHint?: boolean;
  isActive?: boolean;
}) {
  const [broken, setBroken] = useState(false);
  const [tab, setTab] = useState<"poster" | "info">("poster");
  const detail = useQuery({ ...jobQueryOptions(post.id), enabled: tab === "info" });
  const cardRef = useRef<HTMLElement>(null);
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
    <article
      ref={cardRef}
      id={`social-post-${post.id}`}
      data-job-id={post.id}
      className="social-post"
    >
      {isActive && <div className="social-post-tabs" role="tablist" aria-label={`Vista de ${post.titulo || "empleo"}`}>
        <Button variant="ghost" role="tab" id={`poster-tab-${post.id}`} aria-controls={`social-panel-${post.id}`} aria-selected={tab === "poster"} onClick={() => setTab("poster")}>Portada</Button>
        <Button variant="ghost" role="tab" id={`info-tab-${post.id}`} aria-controls={`social-panel-${post.id}`} aria-selected={tab === "info"} onClick={() => setTab("info")}>Más información</Button>
      </div>}
      <div className="social-post-panel" id={`social-panel-${post.id}`} role="tabpanel" aria-labelledby={`${tab === "poster" ? "poster" : "info"}-tab-${post.id}`}>
      {tab === "poster" ? <Link className="social-poster-link" to="/llamado/$jobId" params={{ jobId: String(post.id) }} preload="intent" preloadDelay={0}>
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
      </Link> : <div className="social-post-information">
        <p className="social-info-company">{post.Empresa || "Empresa"}</p>
        <h2>{post.titulo || "Oferta de empleo"}</h2>
        <p className="social-info-location">📍 {location}</p>
        <p className="social-info-time">{publishedAgo(post.created_at)}</p>
        {detail.isPending ? <p role="status">Cargando información…</p> : detail.isError ? <p>No pudimos cargar la información. <Button variant="link" onClick={() => detail.refetch()}>Reintentar</Button></p> : <>
          {detail.data?.tipoContrato && <p><strong>Contrato:</strong> {detail.data.tipoContrato}</p>}
          {detail.data?.jornada && <p><strong>Jornada:</strong> {detail.data.jornada}</p>}
          {detail.data?.descripcion && <section><h3>Descripción</h3><p>{detail.data.descripcion}</p></section>}
          {Boolean(detail.data?.requisitos?.length) && <section><h3>Requisitos</h3><ul>{detail.data?.requisitos?.map((item, index) => <li key={index}>{item}</li>)}</ul></section>}
          {Boolean(detail.data?.empleabilidad?.length) && <section><h3>Beneficios</h3><ul>{detail.data?.empleabilidad?.map((item, index) => <li key={index}>{item}</li>)}</ul></section>}
        </>}
        <SocialQuickActions jobId={post.id} />
      </div>}
      <Link to="/llamado/$jobId" params={{ jobId: String(post.id) }} preload="intent" preloadDelay={0} className="social-summary">
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
      </Link>
      {showScrollHint && (
        <p className="social-scroll-hint" aria-hidden="true">
          <span>Deslizá</span>
          <ChevronDown />
        </p>
      )}
      </div>
    </article>
  );
}
