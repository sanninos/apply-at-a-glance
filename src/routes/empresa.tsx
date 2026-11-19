import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, type FormEvent } from 'react';
import { ChevronLeft } from 'lucide-react';
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
    { name: 'description', content: 'Registrá tu empresa y editá sus datos en URUJOBS.' },
    { property: 'og:title', content: 'URUJOBS · Mi empresa' },
    { property: 'og:description', content: 'Registrá tu empresa y editá sus datos en URUJOBS.' },
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
  const [form, setForm] = useState<Company>({});
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (company.data) setForm(company.data); }, [company.data]);

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
        <header className="profile-heading"><h2>OFERTAS</h2><p>Publicá y gestioná tus ofertas de empleo</p></header>
        <Link to="/empresa-ofertas"><Button variant="outline">Ir a mis ofertas</Button></Link>
      </section>}
    </>}
    <AppBottomNav active="perfil" />
  </main>;
}
