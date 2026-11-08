import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { AppBottomNav } from '@/components/app-bottom-nav';
import { useAccess } from '@/components/access-provider';
import { useAccessDialog } from '@/components/access-dialog';
import { supabase } from '@/integrations/supabase/client';

export const Route = createFileRoute('/panel-empresa')({
  head: () => ({ meta: [
    { title: 'URUJOBS · Panel de empresa' },
    { name: 'description', content: 'Revisá los candidatos de tus ofertas y actualizá su estado.' },
    { property: 'og:title', content: 'URUJOBS · Panel de empresa' },
    { property: 'og:description', content: 'Gestioná los candidatos que se postularon a tus llamados.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
  ] }),
  component: CompanyPanel,
});

type Cv = { [k: string]: any };
type Candidate = { postulacion_id: string; job_id: number; titulo: string | null; candidato: string; estado: string; created_at: string; mensaje: string | null; cv_snapshot: Cv | null };

function CvSummary({ cv }: { cv: Cv }) {
  const name = [cv['first_name'], cv['last_name']].filter(Boolean).join(' ') || cv['full_name'];
  const phone = [cv['phone_country_code'], cv['phone']].filter(Boolean).join(' ');
  const place = [cv['city'], cv['country']].filter(Boolean).join(', ');
  const exps = Array.isArray(cv['experiences']) ? cv['experiences'] : [];
  const edu = Array.isArray(cv['education']) ? cv['education'] : [];
  const skills = Array.isArray(cv['skills']) ? cv['skills'] : [];
  return <div className="grid gap-1 pt-1">
    {name && <p><b>{name}</b></p>}
    {phone && <p>📞 {phone}</p>}
    {place && <p>📍 {place}</p>}
    {cv['summary'] && <p>{cv['summary']}</p>}
    {exps.length > 0 && <><b>Experiencia</b>{exps.map((e: any, i: number) => <p key={i}>{[e?.puesto ?? e?.cargo, e?.company ?? e?.empresa].filter(Boolean).join(' · ')}</p>)}</>}
    {edu.length > 0 && <><b>Educación</b>{edu.map((e: any, i: number) => <p key={i}>{[e?.degree ?? e?.title ?? e?.titulo, e?.institution ?? e?.institucion].filter(Boolean).join(' · ')}</p>)}</>}
    {skills.length > 0 && <p><b>Habilidades:</b> {skills.map((s: any) => typeof s === 'string' ? s : s?.name).filter(Boolean).join(', ')}</p>}
  </div>;
}
const ESTADOS = ['Enviada', 'En revision', 'Entrevista', 'Seleccionada', 'No seleccionada'];
const LABEL: Record<string, string> = { 'En revision': 'En revisión' };

function CompanyPanel() {
  const { user, ready } = useAccess();
  const { open } = useAccessDialog();
  const qc = useQueryClient();
  const [error, setError] = useState('');
  const key = ['empresa-candidatos', user?.id];
  const list = useQuery({
    queryKey: key,
    enabled: ready && Boolean(user),
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)('empresa_candidatos');
      if (error) throw error;
      return (data ?? []) as Candidate[];
    },
  });
  async function change(id: string, estado: string) {
    setError('');
    const { error } = await (supabase.rpc as any)('empresa_cambiar_estado', { _postulacion_id: id, _estado: estado });
    if (error) { setError('No pudimos cambiar el estado. Intentá nuevamente.'); return; }
    await qc.invalidateQueries({ queryKey: key });
  }
  const groups = new Map<number, { titulo: string; items: Candidate[] }>();
  for (const c of list.data ?? []) {
    const g = groups.get(c.job_id) ?? { titulo: c.titulo ?? 'Oferta', items: [] };
    g.items.push(c); groups.set(c.job_id, g);
  }
  return <main className="profile-screen">
    <header className="profile-heading" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Link to="/perfil" aria-label="Volver"><ChevronLeft /></Link>
      <h1>Panel de empresa</h1>
    </header>
    {ready && !user && <section className="profile-block"><p>Ingresá con tu cuenta Business para ver tus candidatos.</p><button type="button" className="profile-login" onClick={open}>Ingresar</button></section>}
    {list.isPending && user && <p className="applications-note">Cargando candidatos…</p>}
    {list.isError && <p className="profile-error" role="alert">No pudimos cargar tus candidatos.</p>}
    {error && <p className="profile-error" role="alert">{error}</p>}
    {list.isSuccess && groups.size === 0 && <section className="profile-block"><h2>Todavía no hay candidatos</h2><p>Cuando alguien se postule a una oferta de tu empresa, aparecerá acá. Tus ofertas deben estar vinculadas a tu empresa.</p></section>}
    {[...groups.entries()].map(([jobId, g]) => <section key={jobId} className="profile-block">
      <header className="profile-heading"><h2>{g.titulo}</h2><p>{g.items.length} {g.items.length === 1 ? 'candidato' : 'candidatos'}</p></header>
      {g.items.map((c) => <div key={c.postulacion_id} className="profile-account-row" style={{ justifyContent: 'space-between' }}>
        <div className="profile-account-copy">
          <strong>{c.candidato}</strong><p>Postulado el {new Date(c.created_at).toLocaleDateString('es-UY')}</p>
          {c.mensaje && <p className="text-sm italic">“{c.mensaje}”</p>}
          {c.cv_snapshot ? <details className="text-sm"><summary className="cursor-pointer text-primary">Ver currículum</summary><CvSummary cv={c.cv_snapshot} /></details> : <p className="text-xs text-muted-foreground">Sin currículum adjunto</p>}
        </div>
        <select aria-label={`Estado de ${c.candidato}`} value={c.estado} onChange={(e) => void change(c.postulacion_id, e.target.value)} className="rounded-md border border-input bg-background px-2 py-1 text-sm">
          {ESTADOS.map((s) => <option key={s} value={s} disabled={s === 'Enviada'}>{LABEL[s] ?? s}</option>)}
        </select>
      </div>)}
    </section>)}
    <AppBottomNav active="perfil" />
  </main>;
}
