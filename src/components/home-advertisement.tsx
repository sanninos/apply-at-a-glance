import type { ReactNode } from 'react';

/** Reserved placement only; campaign selection and delivery are not implemented. */
export function HomeAdvertisement({ children }: { children?: ReactNode }) {
  return <aside className="home-advertisement" aria-label="Publicidad">
    <span className="home-advertisement-label">Publicidad</span>
    <div className="home-advertisement-content">{children}</div>
  </aside>;
}