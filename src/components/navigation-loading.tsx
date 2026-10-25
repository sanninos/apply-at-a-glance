import { LoaderCircle } from 'lucide-react';
import { AppBottomNav } from '@/components/app-bottom-nav';

export function NavigationLoading({ active }: { active: 'empleos' | 'social' | 'radar' }) {
  return (
    <main className="employment-screen">
      <div className="employment-empty" role="status" aria-label="Cargando">
        <LoaderCircle className="motion-safe:animate-spin" aria-hidden="true" />
      </div>
      <AppBottomNav active={active} />
    </main>
  );
}