import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, type FormEvent } from 'react';
import { ChevronLeft, Pencil, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AppBottomNav } from '@/components/app-bottom-nav';
import { useAccess } from '@/components/access-provider';
import { useAccessDialog } from '@/components/access-dialog';
import { supabase } from '@/integrations/supabase/client';

export const Route = createFileRoute('/empresa')({
  head: () => ({ meta: [
    { title: 'URUJOBS · Mi empresa' },
    { name: 'description', content: 'Registrá tu empresa, editá sus datos y publicá ofertas de empleo.' },
    { property: 'og:title', content: 'URUJOBS · Mi empresa' },
    { property: 'og:description', content: 'Gestioná tu empresa y tus ofertas en URUJOBS.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
  ] }),
  component: CompanyScreen,
});

const COMPANY_FIELDS = [
  ['nombre', 'Nombre de la empresa *'], ['sector', 'Sector'], ['rut', 'RUT'], ['email', 'Correo de contacto'],
  ['telefono', 'Teléfono'], ['sitio_web', 'Sitio web'], ['direccion', 'Dirección'], ['ciudad', 'Ciudad'],
  ['departamento', 'Departamento'], ['imagen', 'URL del logo'],
] as const;
type Company = { id?: number; nombre?: string | null; descripcion?: string | null; imagen?: string | null } & Partial<Record<string, any>>;
type Offer = { id: number; titulo: string | null; descripcion: string | null; ubicacion: string | null; ciudad: string | null; jornada: string | null; tipoContrato: string | null; salario: number | null; puesto: string | null; created_at: string };
const emptyOffer = { titulo: '', descripcion: '', ubicacion: '', ciudad: '', jornada: '', tipoContrato: '', salario: '', puesto: '' };
type OfferDraft = typeof emptyOffer;
const db = supabase as any;

function CompanyScreen() {
  const { user, ready } = useAccess();
  const { open } = useAccessDialog();
  const qc = useQueryClient();
  const company = useQuery({
    queryKey: ['my-company', user?.id], enabled: ready && Boolean(user),
    queryFn: async () => {
      const { data, error } = await db.from('Empresa').select('id, nombre, descripcion, sector, rut, email, telefono, sitio_web, direccion, ciudad, departamento, imagen').eq('owner_id', user!.id).maybeSingle();
      if (error) throw error; return data as Company | null;
    },
  });
  const companyId = company.data?.id;
  const offers = useQuery({
    queryKey: ['my-offers', companyId], enabled: Boolean(companyId),
    queryFn: async () => {
      const { data, error } = await db.from('JobsDetails').select('id, titulo, descripcion, ubicacion, ciudad, jornada, tipoContrato, salario, puesto, created_at').eq('empresa_id', companyId).order('created_at', { ascending: false });
      if (error) throw error; return (data ?? []) as Offer[];
    },
  });
  const [form, setForm] = useState<Company>({});
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (company.data) setForm(company.data); }, [company.data]);
  const [draft, setDraft] = useState<OfferDraft | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [offerMsg, setOfferMsg] = useState('');

  async function saveCompany(e: FormEvent) {
    e.preventDefault(); setMsg('');
    const nombre = (form.nombre ?? '').trim();
    if (!nombre) { setMsg('Ingresá el nombre de la empresa.'); return; }
    setSaving(true);
    const payload: Record<string, string | null> = { descripcion: form.descripcion?.trim() || null };
    for (const [k] of COMPANY_FIELDS) payload[k] = (form[k] ?? '').toString().trim() || null;
    const res = companyId
      ? await db.from('Empresa').update(payload).eq('id', companyId)
      : await db.from('Empresa').insert({ ...payload, owner_id: user!.id, pais: 'Uruguay' });
    setSaving(false);
    if (res.error) { setMsg('No pudimos guardar los datos. Intentá nuevamente.'); return; }
    setMsg('Datos guardados.');
    await qc.invalidateQueries({ queryKey: ['my-company', user!.id] });
  }

  async function saveOffer(e: FormEvent) {
    e.preventDefault(); if (!draft || !companyId) return; setOfferMsg('');
    if (!draft.titulo.trim() || !draft.descripcion.trim()) { setOfferMsg('El título y la descripción son obligatorios.'); return; }
    const salario = draft.salario.trim() ? Number(draft.salario) : null;
    if (salario !== null && (!Number.isFinite(salario) || salario < 0)) { setOfferMsg('El salario debe ser un número válido.'); return; }
    const payload = {
      titulo: draft.titulo.trim(), descripcion: draft.descripcion.trim(), ubicacion: draft.ubicacion.trim() || null,
      ciudad: draft.ciudad.trim() || null, jornada: draft.jornada.trim() || null, tipoContrato: draft.tipoContrato.trim() || null,
      puesto: draft.puesto.trim() || null, salario, Empresa: company.data?.nombre ?? null, fotoEmpresa: company.data?.imagen ?? null,
    };
    const res = editingId
      ? await db.from('JobsDetails').update(payload).eq('id', editingId)
      : await db.from('JobsDetails').insert({ ...payload, empresa_id: companyId, isLlamado: false });
    if (res.error) { setOfferMsg('No pudimos guardar la oferta. Intentá nuevamente.'); return; }
    setDraft(null); setEditingId(null);
    await qc.invalidateQueries({ queryKey: ['my-offers', companyId] });
    await qc.invalidateQueries({ queryKey: ['jobs'] });
  }

  async function removeOffer(id: number) {
    if (!window.confirm('¿Borrar esta oferta? Se quitarán también sus postulaciones.')) return;
    const { error } = await db.from('JobsDetails').delete().eq('id', id);
    if (error) { setOfferMsg('No pudimos borrar la oferta.'); return; }
    await qc.invalidateQueries({ queryKey: ['my-offers', companyId] });
  }

  function edit(o: Offer) {
    setEditingId(o.id);
    setDraft({ titulo: o.titulo ?? '', descripcion: o.descripcion ?? '', ubicacion: o.ubicacion ?? '', ciudad: o.ciudad ?? '', jornada: o.jornada ?? '', tipoContrato: o.tipoContrato ?? '', salario: o.salario?.toString() ?? '', puesto: o.puesto ?? '' });
  }

  return <main className="profile-screen">
    <header className="profile-heading" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Link to="/perfil" aria-label="Volver"><ChevronLeft /></Link><h1>Mi empresa</h1>
    </header>
    {ready && !user && <section className="profile-block"><p>Ingresá para registrar tu empresa.</p><Button onClick={open}>Ingresar</Button></section>}
    {user && company.isPending && <p className="applications-note">Cargando…</p>}
    {company.isError && <p className="profile-error" role="alert">No pudimos cargar tu empresa.</p>}
    {user && company.isSuccess && <>
      <section className="profile-block">
        <header className="profile-heading"><h2>{companyId ? 'DATOS DE LA EMPRESA' : 'REGISTRÁ TU EMPRESA'}</h2><p>Se muestran en tus ofertas</p></header>
        <form onSubmit={saveCompany} className="grid gap-3">
          {COMPANY_FIELDS.map(([k, label]) => <label key={k} className="grid gap-1 text-sm">{label}
            <Input value={(form[k] as string) ?? ''} maxLength={200} onChange={(e) => setForm({ ...form, [k]: e.target.value })} /></label>)}
          <label className="grid gap-1 text-sm">Descripción<Textarea value={form.descripcion ?? ''} maxLength={1000} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} /></label>
          {msg && <p role="status" className="text-sm">{msg}</p>}
          <Button type="submit" disabled={saving}>{saving ? 'Guardando…' : companyId ? 'Guardar cambios' : 'Registrar empresa'}</Button>
        </form>
      </section>
      {companyId && <section className="profile-block">
        <header className="profile-heading"><h2>MIS OFERTAS</h2><p>{offers.data?.length ?? 0} publicadas</p></header>
        {!draft && <Button onClick={() => { setEditingId(null); setDraft({ ...emptyOffer }); }}><Plus />Publicar oferta</Button>}
        {draft && <form onSubmit={saveOffer} className="grid gap-3">
          {([['titulo', 'Título *'], ['puesto', 'Puesto'], ['ubicacion', 'Ubicación'], ['ciudad', 'Ciudad'], ['jornada', 'Jornada'], ['tipoContrato', 'Tipo de contrato'], ['salario', 'Salario (UYU)']] as const).map(([k, label]) =>
            <label key={k} className="grid gap-1 text-sm">{label}<Input value={draft[k]} inputMode={k === 'salario' ? 'numeric' : undefined} maxLength={200} onChange={(e) => setDraft({ ...draft, [k]: e.target.value })} /></label>)}
          <label className="grid gap-1 text-sm">Descripción *<Textarea value={draft.descripcion} maxLength={3000} rows={5} onChange={(e) => setDraft({ ...draft, descripcion: e.target.value })} /></label>
          {offerMsg && <p role="alert" className="profile-error">{offerMsg}</p>}
          <div className="flex gap-2"><Button type="submit">{editingId ? 'Guardar oferta' : 'Publicar'}</Button><Button type="button" variant="outline" onClick={() => { setDraft(null); setEditingId(null); }}>Cancelar</Button></div>
        </form>}
        {!draft && offerMsg && <p role="alert" className="profile-error">{offerMsg}</p>}
        {(offers.data ?? []).map((o) => <div key={o.id} className="profile-account-row" style={{ justifyContent: 'space-between' }}>
          <Link to="/llamado/$jobId" params={{ jobId: String(o.id) }} className="profile-account-copy"><strong>{o.titulo}</strong><p>{[o.ciudad, o.tipoContrato].filter(Boolean).join(' · ') || 'Sin detalles'}</p></Link>
          <div className="flex gap-1">
            <Button size="icon" variant="ghost" aria-label="Editar oferta" onClick={() => edit(o)}><Pencil /></Button>
            <Button size="icon" variant="ghost" aria-label="Borrar oferta" onClick={() => void removeOffer(o.id)}><Trash2 /></Button>
          </div>
        </div>)}
      </section>}
    </>}
    <AppBottomNav active="perfil" />
  </main>;
}
