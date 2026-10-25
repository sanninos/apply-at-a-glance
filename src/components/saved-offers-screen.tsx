import { Link } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Bookmark, Building2, ChevronRight, LogIn, MapPin, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppBottomNav } from '@/components/app-bottom-nav';
import { useAccess } from '@/components/access-provider';
import { useAccessDialog } from '@/components/access-dialog';
import { getSavedOffers, setSavedOffer } from '@/lib/saved-offers.functions';
import { useEmployerLogo } from '@/hooks/use-employer-logo';

type SavedOffer = Awaited<ReturnType<typeof getSavedOffers>>[number];

function SavedLogo({ row }: { row: SavedOffer }) {
  const { src, ref, onError } = useEmployerLogo(row.JobsDetails?.fotoEmpresa || row.JobsDetails?.image);
  return <div className="job-logo">{src ? <img ref={ref} src={src} onError={onError} alt={row.JobsDetails?.Empresa || 'Empresa'} /> : <Building2 />}</div>;
}

export function SavedOffersScreen() {
  const { user, ready } = useAccess();
  const { open } = useAccessDialog();
  const queryClient = useQueryClient();
  const read = useServerFn(getSavedOffers);
  const write = useServerFn(setSavedOffer);
  const key = ['saved-offers', user?.id];
  const offers = useQuery({ queryKey: key, enabled: ready && Boolean(user), queryFn: () => read() });
  const remove = useMutation({
    mutationFn: (jobId: number) => write({ data: { jobId, saved: false } }),
    onSuccess: (_, jobId) => {
      queryClient.setQueryData(key, (rows: SavedOffer[] | undefined) => rows?.filter(row => row.job_id !== jobId));
      queryClient.setQueryData(['saved-offer', user?.id, jobId], { saved: false });
      void queryClient.invalidateQueries({ queryKey: key });
    },
  });
  const signedIn = ready && Boolean(user);
  const total = offers.data?.length ?? 0;
  return <main className="applications-screen">
    <header className="applications-header"><div className="applications-heading">
      <h1>OFERTAS GUARDADAS</h1>
      <p>{signedIn ? `${total} ${total === 1 ? 'oferta guardada' : 'ofertas guardadas'}` : 'Tus ofertas favoritas'}</p>
    </div></header>
    {!ready && <p className="applications-note">Cargando tu cuenta…</p>}
    {ready && !user && <section className="applications-login">
      <LogIn /><h2>Ingresá para ver tus ofertas guardadas</h2><p>Solo vos podés verlas.</p>
      <Button className="applications-login-cta" onClick={open}>Ingresar o registrarse</Button>
    </section>}
    {signedIn && offers.isPending && <p className="applications-note">Cargando tus ofertas guardadas…</p>}
    {signedIn && offers.isError && <section className="applications-error" role="alert">
      <p>No pudimos cargar tus ofertas guardadas.</p><Button variant="outline" onClick={() => void offers.refetch()}><RefreshCw />Reintentar</Button>
    </section>}
    {remove.isError && <p role="alert" className="applications-note text-destructive">No pudimos quitar la oferta. Intentá nuevamente.</p>}
    {signedIn && offers.data && (total > 0 ? <section className="applications-list" aria-label="Tus ofertas guardadas">
      {offers.data.map(row => <article key={row.id} className="applications-card">
        <Link to="/llamado/$jobId" params={{ jobId: String(row.job_id) }} preload="intent" preloadDelay={0} className="flex min-w-0 flex-1 items-start gap-2.5">
          <SavedLogo row={row} /><div className="applications-copy">
            <p className="applications-company">{row.JobsDetails?.Empresa || 'Empresa'}</p>
            <h2>{row.JobsDetails?.titulo || 'Oferta de empleo'}</h2>
            <div className="applications-meta"><span className="applications-date"><MapPin />{row.JobsDetails?.ubicacion || row.JobsDetails?.ciudad || 'Ubicación no especificada'}</span></div>
          </div><ChevronRight className="applications-arrow" />
        </Link>
        <Button variant="ghost" size="icon" className="shrink-0 text-primary" title="Quitar de guardadas" aria-label={`Quitar ${row.JobsDetails?.titulo || 'oferta'} de guardadas`} disabled={remove.isPending} onClick={() => remove.mutate(row.job_id)}>
          {remove.isPending && remove.variables === row.job_id ? <Loader2 className="animate-spin motion-reduce:animate-none" /> : <Bookmark className="fill-current" />}
        </Button>
      </article>)}
    </section> : <section className="applications-empty"><Bookmark /><h2>Todavía no tenés ofertas guardadas</h2><Button asChild variant="outline"><Link to="/">Ver ofertas</Link></Button></section>)}
    <AppBottomNav active="perfil" />
  </main>;
}