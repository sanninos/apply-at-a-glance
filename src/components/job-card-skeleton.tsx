import { AppBottomNav } from "@/components/app-bottom-nav";

/** A single placeholder line that glows softly while real data arrives. */
function Line({ width, height = 11 }: { width: string; height?: number }) {
  return <span className="skeleton" style={{ width, height }} />;
}

/** Same shape as an offer card: logo, company, title, description and the time chip. */
export function JobCardSkeleton() {
  return <div className="employment-card job-card-skeleton" aria-hidden="true">
    <div className="employment-card-main">
      <div className="job-logo"><span className="skeleton skeleton-fill" /></div>
      <div className="employment-copy">
        <p className="employment-company"><Line width="45%" /></p>
        <h2><Line width="80%" height={14} /></h2>
        <p className="employment-description"><Line width="95%" /></p>
      </div>
      <span className="employment-arrow" />
    </div>
    <div className="employment-meta">
      <span className="location-chip skeleton" style={{ width: "46%", height: 26 }} />
      <span className="date-chip skeleton" style={{ width: 92, height: 26 }} />
    </div>
  </div>;
}

export function JobListSkeleton({ count = 4 }: { count?: number }) {
  return <main className="employment-screen">
    <div className="employment-list" aria-busy="true" aria-label="Cargando empleos">
      {Array.from({ length: count }, (_, index) => <JobCardSkeleton key={index} />)}
    </div>
    <AppBottomNav active="empleos" />
  </main>;
}

/** Same shape as a similar-offer card in the detail rail. */
export function SimilarJobCardSkeleton() {
  return <div className="similar-job-card" aria-hidden="true">
    <Line width="88%" height={14} />
    <Line width="62%" height={14} />
    <Line width="42%" />
    <Line width="36%" height={10} />
    <Line width="26%" height={10} />
  </div>;
}

export function SimilarJobsSkeleton({ count = 4 }: { count?: number }) {
  return <section className="mt-6" aria-labelledby="similar-jobs-title" aria-busy="true">
    <h2 id="similar-jobs-title" className="font-bold text-foreground mb-3 mx-5">Empleos similares</h2>
    <div className="similar-jobs-track px-5 scroll-px-5">
      {Array.from({ length: count }, (_, index) => <SimilarJobCardSkeleton key={index} />)}
    </div>
  </section>;
}
