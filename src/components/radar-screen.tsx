import { useEffect, useRef, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { BriefcaseBusiness, ChevronRight, LocateFixed, MapPin, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AppBottomNav } from '@/components/app-bottom-nav';
import { useEmployerLogo } from '@/hooks/use-employer-logo';
import { loadRadarMap } from '@/lib/google-map-loader';
import type { RadarJob } from '@/lib/radar-jobs';

export function RadarScreen({ jobs, search, onSearch }: { jobs: RadarJob[]; search: string; onSearch: (value: string) => void }) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<google.maps.Map | null>(null);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState('Cargando mapa…');
  const [notice, setNotice] = useState('');
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<RadarJob | null>(null);
  const visible = jobs.filter((job) => `${job.titulo || ''} ${job.Empresa || ''} ${job.ubicacion || ''} ${job.ciudad || ''}`.toLocaleLowerCase().includes(search.toLocaleLowerCase()));

  useEffect(() => {
    let cancelled = false;
    // Maps cannot be validated on sandbox or credential-bearing preview origins.
    if (location.hostname === 'localhost' || location.hostname.includes('-devserver-')) {
      setMessage('El mapa estará disponible al abrir la app publicada.');
      return;
    }
    loadRadarMap().then(() => {
      if (cancelled || !container.current) return;
      map.current = new google.maps.Map(container.current, {
        center: { lat: -34.9011, lng: -56.1645 }, zoom: 13, disableDefaultUI: true,
        clickableIcons: false, gestureHandling: 'greedy',
        styles: [{ featureType: 'poi', stylers: [{ visibility: 'off' }] }],
      });
      setReady(true);
      setMessage('');
    }).catch((error: unknown) => { if (!cancelled) setMessage(error instanceof Error ? error.message : 'No pudimos cargar el mapa.'); });
    return () => { cancelled = true; map.current = null; };
  }, []);

  useEffect(() => {
    const current = map.current;
    if (!ready || !current) return;
    const tokens = getComputedStyle(document.documentElement);
    const stroke = tokens.getPropertyValue('--primary').trim();
    const fill = tokens.getPropertyValue('--card').trim();
    const icon = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><circle cx="32" cy="32" r="28" fill="${fill}" stroke="${stroke}" stroke-width="6"/><text x="32" y="42" font-size="30" text-anchor="middle">💼</text></svg>`)}`;
    const markers = visible.map((job) => {
      const marker = new google.maps.Marker({ map: current, position: job.position, title: job.titulo || 'Oferta laboral', icon: { url: icon, scaledSize: new google.maps.Size(64, 64) } });
      marker.addListener('click', () => setSelected(job));
      return marker;
    });
    if (visible.length === 1 && visible[0]) { current.setCenter(visible[0].position); current.setZoom(14); }
    else if (visible.length > 1) {
      const bounds = new google.maps.LatLngBounds();
      visible.forEach((job) => bounds.extend(job.position));
      current.fitBounds(bounds, { top: 100, bottom: 200, left: 45, right: 45 });
    }
    return () => markers.forEach((marker) => { google.maps.event.clearInstanceListeners(marker); marker.setMap(null); });
  }, [jobs, search, ready]);

  function locate() {
    if (!navigator.geolocation) { setNotice('Este dispositivo no permite obtener tu ubicación.'); return; }
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      map.current?.panTo({ lat: coords.latitude, lng: coords.longitude });
      map.current?.setZoom(14);
      setNotice('');
    }, () => setNotice('No pudimos obtener tu ubicación. Revisá el permiso de ubicación.'), { timeout: 10000 });
  }

  return <main className="radar-screen">
    <h1 className="sr-only">Radar de empleos</h1>
    <div ref={container} className="radar-map" aria-label="Mapa de ofertas de trabajo" />
    {message && <div className="radar-map-message"><MapPin /><p>{message}</p></div>}
    <div className="radar-toolbar">
      <Button variant="outline" className="radar-count" onClick={() => setOpen(true)}><BriefcaseBusiness /><span>{visible.length} {visible.length === 1 ? 'oferta de trabajo encontrada' : 'ofertas de trabajo encontradas'}</span></Button>
      <Button variant="outline" size="icon" className="radar-filter" aria-label="Filtrar ofertas del Radar" title="Filtrar ofertas" onClick={() => setOpen(true)}><SlidersHorizontal /></Button>
    </div>
    {!visible.length && <div className="radar-empty">No hay ofertas con ubicación{search ? ' para esta búsqueda' : ''}.</div>}
    {notice && <p role="status" className="radar-notice">{notice}</p>}
    <Button size="icon" className="radar-locate" title="Mi ubicación" aria-label="Centrar en mi ubicación" onClick={locate}><LocateFixed /></Button>
    {selected && <div className="radar-selected"><Button variant="ghost" size="icon" className="radar-close" aria-label="Cerrar oferta" onClick={() => setSelected(null)}><X /></Button><RadarOffer job={selected} /></div>}
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="radar-dialog">
        <DialogTitle>Ofertas en el Radar</DialogTitle>
        <DialogDescription>Ofertas con ubicación publicada.</DialogDescription>
        <Input aria-label="Buscar ofertas en Radar" placeholder="Puesto, empresa o ubicación" value={search} onChange={(event) => onSearch(event.target.value)} />
        <div className="radar-results">{visible.map((job) => <Button key={job.id} variant="ghost" className="radar-result" onClick={() => { setSelected(job); setOpen(false); map.current?.panTo(job.position); }}><MapPin /><span>{job.titulo || 'Oferta de empleo'}<small>{job.ubicacion || job.ciudad || 'Uruguay'}</small></span><ChevronRight /></Button>)}</div>
        {!visible.length && <p className="text-sm text-muted-foreground">No hay ofertas para esta búsqueda.</p>}
      </DialogContent>
    </Dialog>
    <AppBottomNav active="radar" />
  </main>;
}

function RadarOffer({ job }: { job: RadarJob }) {
  const { src, ref, onError } = useEmployerLogo(job.fotoEmpresa || job.image);
  return <Link to="/llamado/$jobId" params={{ jobId: String(job.id) }} preload="intent" preloadDelay={0} className="radar-offer">
    <div className="job-logo">{src ? <img ref={ref} src={src} onError={onError} alt={job.Empresa || 'Empresa'} /> : <BriefcaseBusiness />}</div>
    <div className="social-summary-copy"><p className="social-summary-title">{job.titulo || 'Oferta de empleo'}</p><p className="social-summary-loc"><MapPin /><span>{job.ubicacion || job.ciudad || 'Uruguay'}</span></p><p className="social-summary-company">{job.Empresa || 'Empresa'}</p></div>
    <span className="employment-arrow"><ChevronRight /></span>
  </Link>;
}