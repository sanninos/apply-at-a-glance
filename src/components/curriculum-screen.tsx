import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { BriefcaseBusiness, Camera, Check, GraduationCap, Lightbulb, LogIn, Mail, Pencil, Plus, RefreshCw, Save, Smartphone, Trash2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppBottomNav } from "@/components/app-bottom-nav";
import { useAccessDialog } from "@/components/access-dialog";
import { useAccess } from "@/components/access-provider";
import { supabase } from "@/integrations/supabase/client";
import {
  curriculumPayload,
  emptyCurriculum,
  emptyEducation,
  emptyExperience,
  toCurriculumDraft,
  type CurriculumDraft,
  type CurriculumRow,
} from "@/lib/curriculum";

export function CurriculumScreen() {
  const { user, ready } = useAccess();
  const { open: openAccess } = useAccessDialog();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<CurriculumDraft>(emptyCurriculum);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [editingAbout, setEditingAbout] = useState(false);
  const [editingSummary, setEditingSummary] = useState(false);
  const [editingExperience, setEditingExperience] = useState<string | null>(null);
  const [editingEducation, setEditingEducation] = useState<string | null>(null);

  const curriculum = useQuery({
    queryKey: ["curriculum", user?.id],
    enabled: ready && Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase.from("curriculums").select("*").limit(1);
      if (error) throw new Error(error.message);
      return data[0] as CurriculumRow | undefined;
    },
  });

  function edit(patch: Partial<CurriculumDraft>) {
    setDraft((prev) => ({ ...prev, ...patch }));
    setSaved(false);
  }

  const signedIn = ready && Boolean(user);
  // Seed the draft once from the stored curriculum; a stored row with entries
  // keeps a trailing blank row so the user can keep adding.
  const draftLoaded = useRef(false);
  const seededRow = curriculum.data;
  useEffect(() => {
    if (!signedIn || !seededRow || draftLoaded.current) return;
    draftLoaded.current = true;
    setDraft(toCurriculumDraft(seededRow));
  }, [signedIn, seededRow]);

  async function save() {
    if (!user || busy) return;
    const parsed = curriculumPayload(draft);
    if (!parsed.ok) { setError(parsed.error); return; }
    setBusy(true); setError(""); setSaved(false);
    const { error } = await supabase.from("curriculums").upsert({ user_id: user.id, ...parsed.payload }, { onConflict: "user_id" });
    setBusy(false);
    if (error) { setError("No pudimos guardar tu curriculum. Intentá nuevamente."); return; }
    void queryClient.invalidateQueries({ queryKey: ["curriculum", user.id] });
    setSaved(true);
  }

  return <main className="curriculum-screen">
    <header className="curriculum-header">
      <div className="curriculum-avatar" aria-hidden="true"><User /><span><Camera /></span></div>
      <div className="curriculum-heading">
        <span className="curriculum-profile-tag">Mi perfil</span>
        <h1>{draft.fullName || user?.user_metadata?.['full_name'] || "Mi curriculum"}</h1>
        <p>{draft.experiences.find((entry) => entry.puesto.trim())?.puesto || "Tu profesión"}</p>
      </div>
    </header>

    {!ready && <p className="curriculum-note">Cargando tu cuenta…</p>}

    {ready && !user && <section className="curriculum-login">
      <LogIn aria-hidden="true" />
      <h2>Ingresá para editar tu curriculum</h2>
      <p>Se guarda en tu cuenta y solo vos lo ves.</p>
      <Button className="curriculum-login-cta" onClick={openAccess}>Ingresar o registrarse</Button>
    </section>}

    {signedIn && curriculum.isPending && <p className="curriculum-note">Cargando tu curriculum…</p>}

    {signedIn && curriculum.isError && <section className="curriculum-error" role="alert">
      <p>No pudimos cargar tu curriculum.</p>
      <Button variant="outline" onClick={() => void curriculum.refetch()}><RefreshCw />Reintentar</Button>
    </section>}

    {signedIn && !curriculum.isError && <form className="curriculum-form" onSubmit={(event) => { event.preventDefault(); void save(); }}>
      <section className="curriculum-block">
        <div className="curriculum-section-head"><h2 className="curriculum-block-title">SOBRE TI</h2><Button type="button" variant="ghost" size="icon" title="Editar datos personales" aria-label="Editar datos personales" onClick={() => setEditingAbout(!editingAbout)}><Pencil /></Button></div>
        {!editingAbout && <div className="curriculum-about">
          <p><Smartphone aria-hidden="true" /><span>{draft.phone || "Sin teléfono"}</span></p>
          <p><Mail aria-hidden="true" /><span>{user?.email || "Sin correo electrónico"}</span></p>
        </div>}
        {editingAbout && <div>
        <div className="curriculum-field">
          <label htmlFor="cv-name">Nombre completo</label>
          <input id="cv-name" value={draft.fullName} onChange={(event) => edit({ fullName: event.target.value })} placeholder="Ej: María Pérez" autoComplete="name" />
        </div>
        <div className="curriculum-field">
          <label htmlFor="cv-phone">Teléfono</label>
          <input id="cv-phone" value={draft.phone} onChange={(event) => edit({ phone: event.target.value })} placeholder="Ej: 099 123 456" type="tel" autoComplete="tel" />
        </div>
        <Button type="button" variant="ghost" className="curriculum-done" onClick={() => setEditingAbout(false)}><Check />Listo</Button></div>}
      </section>

      <section className="curriculum-summary">
        <div className="curriculum-summary-copy"><p>{draft.summary || "Una descripción bien detallada y extensa de tu perfil profesional te ayudará a destacar entre otros candidatos."}</p><Button type="button" variant="ghost" size="icon" title="Editar resumen profesional" aria-label="Editar resumen profesional" onClick={() => setEditingSummary(!editingSummary)}>{draft.summary ? <Pencil /> : <Lightbulb />}</Button></div>
        {editingSummary && <div>
        <div className="curriculum-field">
          <label htmlFor="cv-summary">Contá en pocas líneas quién sos y qué buscás</label>
          <textarea id="cv-summary" value={draft.summary} onChange={(event) => edit({ summary: event.target.value })} rows={4} placeholder="Ej: Atención al cliente con 3 años de experiencia en retail." />
        </div>
        <Button type="button" variant="ghost" className="curriculum-done" onClick={() => setEditingSummary(false)}><Check />Listo</Button></div>}
      </section>

      <section className="curriculum-block">
        <div className="curriculum-section-head"><h2 className="curriculum-block-title">EXPERIENCIA PROFESIONAL</h2><Button type="button" variant="ghost" size="icon" title="Añadir experiencia" aria-label="Añadir experiencia" onClick={() => { const entry = emptyExperience(); edit({ experiences: [...draft.experiences, entry] }); setEditingExperience(entry.id); }}><Plus /></Button></div>
        {draft.experiences.map((entry, index) => (
          (entry.puesto || entry.empresa || entry.desde || entry.hasta || entry.descripcion || editingExperience === entry.id) && <div className="curriculum-entry" key={entry.id}>
            {editingExperience !== entry.id && <div className="curriculum-item-summary"><span className="curriculum-timeline-dot" /><div><h3>{entry.puesto || "Experiencia"}{entry.empresa && ` en ${entry.empresa}`}</h3><p>{[entry.desde, entry.hasta].filter(Boolean).join(" - ")}</p></div><Button type="button" variant="ghost" size="icon" title="Editar experiencia" aria-label={`Editar experiencia ${index + 1}`} onClick={() => setEditingExperience(entry.id)}><Pencil /></Button></div>}
            {editingExperience === entry.id && <div className="curriculum-editor"><div className="curriculum-entry-head">
              <span className="curriculum-entry-label"><BriefcaseBusiness aria-hidden="true" />Experiencia {index + 1}</span>
              <Button variant="ghost" size="icon" type="button" className="curriculum-remove" aria-label={`Quitar experiencia ${index + 1}`} onClick={() => edit({ experiences: draft.experiences.filter((row) => row.id !== entry.id) })}>
                <Trash2 aria-hidden="true" />
              </Button>
            </div>
            <div className="curriculum-grid-2">
              <div className="curriculum-field"><label htmlFor={`cv-exp-puesto-${index}`}>Puesto</label><input id={`cv-exp-puesto-${index}`} value={entry.puesto} onChange={(event) => edit({ experiences: draft.experiences.map((row) => row.id === entry.id ? { ...row, puesto: event.target.value } : row) })} /></div>
              <div className="curriculum-field"><label htmlFor={`cv-exp-empresa-${index}`}>Empresa</label><input id={`cv-exp-empresa-${index}`} value={entry.empresa} onChange={(event) => edit({ experiences: draft.experiences.map((row) => row.id === entry.id ? { ...row, empresa: event.target.value } : row) })} /></div>
              <div className="curriculum-field"><label htmlFor={`cv-exp-desde-${index}`}>Desde</label><input id={`cv-exp-desde-${index}`} value={entry.desde} onChange={(event) => edit({ experiences: draft.experiences.map((row) => row.id === entry.id ? { ...row, desde: event.target.value } : row) })} placeholder="Ej: 2022" /></div>
              <div className="curriculum-field"><label htmlFor={`cv-exp-hasta-${index}`}>Hasta</label><input id={`cv-exp-hasta-${index}`} value={entry.hasta} onChange={(event) => edit({ experiences: draft.experiences.map((row) => row.id === entry.id ? { ...row, hasta: event.target.value } : row) })} placeholder="Ej: Actualidad" /></div>
            </div>
            <div className="curriculum-field"><label htmlFor={`cv-exp-desc-${index}`}>Descripción</label><textarea id={`cv-exp-desc-${index}`} value={entry.descripcion} onChange={(event) => edit({ experiences: draft.experiences.map((row) => row.id === entry.id ? { ...row, descripcion: event.target.value } : row) })} rows={2} /></div>
            <Button type="button" variant="ghost" className="curriculum-done" onClick={() => setEditingExperience(null)}><Check />Listo</Button></div>}
          </div>
        ))}
        <Button type="button" variant="ghost" className="curriculum-add" onClick={() => { const entry = emptyExperience(); edit({ experiences: [...draft.experiences, entry] }); setEditingExperience(entry.id); }}>Añadir experiencia</Button>
      </section>

      <section className="curriculum-block">
        <div className="curriculum-section-head"><h2 className="curriculum-block-title">EDUCACIÓN</h2><GraduationCap aria-hidden="true" /></div>
        {draft.education.map((entry, index) => (
          (entry.titulo || entry.institucion || entry.desde || entry.hasta || editingEducation === entry.id) && <div className="curriculum-entry" key={entry.id}>
            {editingEducation !== entry.id && <div className="curriculum-item-summary"><span className="curriculum-timeline-dot" /><div><h3>{entry.titulo || "Educación"}{entry.institucion && ` · ${entry.institucion}`}</h3><p>{[entry.desde, entry.hasta].filter(Boolean).join(" - ")}</p></div><Button type="button" variant="ghost" size="icon" title="Editar educación" aria-label={`Editar educación ${index + 1}`} onClick={() => setEditingEducation(entry.id)}><Pencil /></Button></div>}
            {editingEducation === entry.id && <div className="curriculum-editor"><div className="curriculum-entry-head">
              <span className="curriculum-entry-label"><GraduationCap aria-hidden="true" />Educación {index + 1}</span>
              <Button variant="ghost" size="icon" type="button" className="curriculum-remove" aria-label={`Quitar educación ${index + 1}`} onClick={() => edit({ education: draft.education.filter((row) => row.id !== entry.id) })}>
                <Trash2 aria-hidden="true" />
              </Button>
            </div>
            <div className="curriculum-grid-2">
              <div className="curriculum-field"><label htmlFor={`cv-edu-titulo-${index}`}>Título</label><input id={`cv-edu-titulo-${index}`} value={entry.titulo} onChange={(event) => edit({ education: draft.education.map((row) => row.id === entry.id ? { ...row, titulo: event.target.value } : row) })} /></div>
              <div className="curriculum-field"><label htmlFor={`cv-edu-institucion-${index}`}>Institución</label><input id={`cv-edu-institucion-${index}`} value={entry.institucion} onChange={(event) => edit({ education: draft.education.map((row) => row.id === entry.id ? { ...row, institucion: event.target.value } : row) })} /></div>
              <div className="curriculum-field"><label htmlFor={`cv-edu-desde-${index}`}>Desde</label><input id={`cv-edu-desde-${index}`} value={entry.desde} onChange={(event) => edit({ education: draft.education.map((row) => row.id === entry.id ? { ...row, desde: event.target.value } : row) })} placeholder="Ej: 2018" /></div>
              <div className="curriculum-field"><label htmlFor={`cv-edu-hasta-${index}`}>Hasta</label><input id={`cv-edu-hasta-${index}`} value={entry.hasta} onChange={(event) => edit({ education: draft.education.map((row) => row.id === entry.id ? { ...row, hasta: event.target.value } : row) })} placeholder="Ej: 2021" /></div>
            </div>
            <Button type="button" variant="ghost" className="curriculum-done" onClick={() => setEditingEducation(null)}><Check />Listo</Button></div>}
          </div>
        ))}
        <Button type="button" variant="ghost" className="curriculum-add" onClick={() => { const entry = emptyEducation(); edit({ education: [...draft.education, entry] }); setEditingEducation(entry.id); }}>Añadir educación</Button>
      </section>

      <section className="curriculum-block">
        <h2 className="curriculum-block-title"><User aria-hidden="true" />HABILIDADES</h2>
        <div className="curriculum-field">
          <label htmlFor="cv-skills">Separá tus habilidades con comas</label>
          <input id="cv-skills" value={draft.skills} onChange={(event) => edit({ skills: event.target.value })} placeholder="Ej: Caja, Atención al cliente, Excel" />
        </div>
        {draft.skills.split(",").some((skill) => skill.trim()) && <div className="curriculum-chips">
          {draft.skills.split(",").map((skill) => skill.trim()).filter(Boolean).map((skill) => <span className="curriculum-chip" key={skill}>{skill}</span>)}
        </div>}
      </section>

      {error && <p className="curriculum-error-inline" role="alert">{error}</p>}
      <Button type="submit" className="curriculum-save" disabled={busy}>{busy ? "Guardando…" : saved ? <><Check aria-hidden="true" />Guardado</> : <><Save aria-hidden="true" />Guardar curriculum</>}</Button>
      <p className="curriculum-privacy">Tu curriculum se guarda en tu cuenta y solo vos lo ves.</p>
    </form>}

    <AppBottomNav active="perfil" />
  </main>;
}
