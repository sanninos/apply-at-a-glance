import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { BriefcaseBusiness, Cake, Camera, Check, GraduationCap, Lightbulb, LogIn, Mail, Pencil, Plus, RefreshCw, Smartphone, Trash2, User, X } from "lucide-react";
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
  const { user } = useAccess();
  return <AccountCurriculumScreen key={user?.id ?? "signed-out"} />;
}

function AccountCurriculumScreen() {
  const { user, ready } = useAccess();
  const { open: openAccess } = useAccessDialog();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<CurriculumDraft>(emptyCurriculum);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [editingAbout, setEditingAbout] = useState(false);
  const [showExtraPhone, setShowExtraPhone] = useState(false);
  const [editingSummary, setEditingSummary] = useState(false);
  const [editingExperience, setEditingExperience] = useState<string | null>(null);
  const [editingEducation, setEditingEducation] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const dirty = useRef(false);
  const saving = useRef(false);
  const version = useRef(0);
  const lastAttempt = useRef(-1);
  const flush = useRef<() => void>(() => {});

  const curriculum = useQuery({
    queryKey: ["curriculum", user?.id],
    enabled: ready && Boolean(user),
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase.from("curriculums").select("*").eq("user_id", user.id).limit(1);
      if (error) throw new Error(error.message);
      return (data[0] as CurriculumRow | undefined) ?? null;
    },
  });

  function edit(patch: Partial<CurriculumDraft>) {
    dirty.current = true;
    version.current += 1;
    setDraft((prev) => ({ ...prev, ...patch }));
    setSaved(false);
  }

  const signedIn = ready && Boolean(user);
  // Seed the draft once from the stored curriculum; a stored row with entries
  // keeps a trailing blank row so the user can keep adding.
  const draftLoaded = useRef(false);
  const seededRow = curriculum.data;
  useEffect(() => {
    if (!signedIn || !curriculum.isSuccess || draftLoaded.current) return;
    draftLoaded.current = true;
    if (seededRow) {
      const seeded = toCurriculumDraft(seededRow);
      setDraft(seeded);
      if (seeded.extraPhone) setShowExtraPhone(true);
    }
    else setDraft({ ...emptyCurriculum(), fullName: typeof user?.user_metadata?.['full_name'] === "string" ? user.user_metadata['full_name'] : "" });
    setInitialized(true);
  }, [signedIn, seededRow, curriculum.isSuccess, user]);

  async function save() {
    if (!user || saving.current || !initialized || !dirty.current) return;
    const currentVersion = version.current;
    lastAttempt.current = currentVersion;
    const parsed = curriculumPayload(draft);
    if (!parsed.ok) { setError(parsed.error); return; }
    saving.current = true;
    setBusy(true); setError(""); setSaved(false);
    try {
      const { error } = await supabase.from("curriculums").upsert({ user_id: user.id, ...parsed.payload }, { onConflict: "user_id" });
      if (error) throw error;
      void queryClient.invalidateQueries({ queryKey: ["curriculum", user.id] });
      void queryClient.invalidateQueries({ queryKey: ["profile-stats", user.id] });
      if (version.current === currentVersion) {
        dirty.current = false;
        setSaved(true);
      }
    } catch {
      setError("No pudimos guardar tu curriculum. Intentá nuevamente.");
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }

  flush.current = () => { void save(); };
  useEffect(() => {
    if (!initialized || busy || !dirty.current || lastAttempt.current === version.current) return;
    const timer = window.setTimeout(() => flush.current(), 600);
    return () => window.clearTimeout(timer);
  }, [draft, initialized, busy]);
  useEffect(() => () => { flush.current(); }, []);

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

    {signedIn && initialized && !curriculum.isError && <form className="curriculum-form" onBlur={() => { if (lastAttempt.current !== version.current) void save(); }} onSubmit={(event) => { event.preventDefault(); void save(); }}>
      <fieldset className="curriculum-fields">
      <section className="curriculum-block">
        <div className="curriculum-section-head"><h2 className="curriculum-block-title">SOBRE TI</h2>
          {(!draft.phone || !draft.birthDate || !(draft.city || draft.country)) && <span className="curriculum-missing-hint">Faltan datos por configurar</span>}
          <Button type="button" variant="ghost" size="icon" title="Editar datos personales" aria-label="Editar datos personales" onClick={() => setEditingAbout(true)}><Pencil /></Button></div>
        <div className="curriculum-about">
          <p><Smartphone aria-hidden="true" /><span className={draft.phone ? undefined : "curriculum-missing"}>{draft.phone ? `${draft.phoneCountryCode.match(/\+\d+/)?.[0] ?? ""} ${draft.phone}`.trim() : "Teléfono sin configurar"}</span></p>
          <p><Mail aria-hidden="true" /><span className={user?.email ? undefined : "curriculum-missing"}>{user?.email || "Correo sin configurar"}</span></p>
          <p><Cake aria-hidden="true" /><span className={draft.birthDate ? undefined : "curriculum-missing"}>{draft.birthDate ? new Date(`${draft.birthDate}T00:00:00`).toLocaleDateString("es-UY", { day: "numeric", month: "long", year: "numeric" }) : "Cumpleaños sin configurar"}</span></p>
          <p><span aria-hidden="true">📍</span><span className={(draft.city || draft.country) ? undefined : "curriculum-missing"}>{[draft.city, draft.country].filter(Boolean).join(", ") || "Ubicación sin configurar"}</span></p>
        </div>
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

      </fieldset>
      {error && <div className="curriculum-error-inline" role="alert">{error}<Button type="button" variant="ghost" size="icon" title="Reintentar guardado" aria-label="Reintentar guardado" disabled={busy} onClick={() => void save()}><RefreshCw /></Button></div>}
      <p className="curriculum-privacy" role="status" aria-live="polite">{busy ? "Guardando…" : saved ? "Cambios guardados" : ""}</p>
      <p className="curriculum-privacy">Tu curriculum se guarda en tu cuenta y solo vos lo ves.</p>
    </form>}

    {signedIn && editingAbout && <div className="about-sheet-backdrop" onClick={() => { setEditingAbout(false); void save(); }}>
      <section className="about-sheet" role="dialog" aria-modal="true" aria-labelledby="about-sheet-title" onClick={(event) => event.stopPropagation()}>
        <span className="about-sheet-handle" aria-hidden="true" />
        <button type="button" className="about-sheet-close" aria-label="Cerrar" onClick={() => { setEditingAbout(false); void save(); }}><X aria-hidden="true" /></button>
        <h2 id="about-sheet-title">Sobre ti</h2>
        <p className="about-sheet-subtitle">Datos personales y de contacto</p>

        <div className="about-sheet-body">
          <div className="curriculum-field">
            <label>Nombre y apellidos</label>
            <div className="about-sheet-row">
              <input value={draft.firstName} onChange={(event) => edit({ firstName: event.target.value })} placeholder="Nombre" autoComplete="given-name" aria-label="Nombre" />
              <input value={draft.lastName} onChange={(event) => edit({ lastName: event.target.value })} placeholder="Apellidos" autoComplete="family-name" aria-label="Apellidos" />
            </div>
          </div>

          <div className="curriculum-field">
            <label>Identificación</label>
            <div className="about-sheet-row">
              <select value={draft.documentType} onChange={(event) => edit({ documentType: event.target.value })} aria-label="Tipo de documento">
                <option value="Cédula de identidad">Cédula de identidad</option>
                <option value="Pasaporte">Pasaporte</option>
                <option value="Documento extranjero">Documento extranjero</option>
              </select>
              <input value={draft.documentNumber} onChange={(event) => edit({ documentNumber: event.target.value })} placeholder="Número" inputMode="numeric" aria-label="Número de documento" />
            </div>
          </div>

          <div className="curriculum-field">
            <label htmlFor="cv-birthdate">Fecha de nacimiento</label>
            <input id="cv-birthdate" type="date" value={draft.birthDate} onChange={(event) => edit({ birthDate: event.target.value })} />
          </div>

          <div className="curriculum-field">
            <label>Género</label>
            <div className="about-gender" role="group" aria-label="Género">
              {(["Mujer", "Hombre", "Otro"] as const).map((option) => (
                <button key={option} type="button" className={draft.gender === option ? "about-gender-option is-selected" : "about-gender-option"} aria-pressed={draft.gender === option} onClick={() => edit({ gender: draft.gender === option ? "" : option })}>
                  <span className="about-gender-symbol" aria-hidden="true">{option === "Mujer" ? "♀" : option === "Hombre" ? "♂" : "○"}</span>
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="curriculum-field">
            <label>Teléfono</label>
            <div className="about-sheet-row">
              <select value={draft.phoneCountryCode} onChange={(event) => edit({ phoneCountryCode: event.target.value })} aria-label="Código de país">
                <option value="UY (+598)">UY (+598)</option>
                <option value="AR (+54)">AR (+54)</option>
                <option value="BR (+55)">BR (+55)</option>
                <option value="PY (+595)">PY (+595)</option>
                <option value="CL (+56)">CL (+56)</option>
              </select>
              <input value={draft.phone} onChange={(event) => edit({ phone: event.target.value })} placeholder="99 123 456" type="tel" autoComplete="tel-national" aria-label="Número de teléfono" />
            </div>
          </div>

          <div className="curriculum-field">
            <div className="about-toggle-row">
              <label htmlFor="cv-extra-phone-toggle">Teléfono adicional</label>
              <button id="cv-extra-phone-toggle" type="button" role="switch" aria-checked={showExtraPhone} className={showExtraPhone ? "about-toggle is-on" : "about-toggle"} onClick={() => setShowExtraPhone(!showExtraPhone)}>
                <span aria-hidden="true" />
              </button>
            </div>
            {showExtraPhone && <input value={draft.extraPhone} onChange={(event) => edit({ extraPhone: event.target.value })} placeholder="Otro teléfono de contacto" type="tel" aria-label="Teléfono adicional" />}
          </div>

          <div className="curriculum-field">
            <label>País y ciudad</label>
            <div className="about-sheet-row">
              <select value={draft.country} onChange={(event) => edit({ country: event.target.value })} aria-label="País">
                <option value="Uruguay">Uruguay</option>
                <option value="Argentina">Argentina</option>
                <option value="Brasil">Brasil</option>
                <option value="Paraguay">Paraguay</option>
                <option value="Chile">Chile</option>
                <option value="Otro">Otro</option>
              </select>
              <input value={draft.city} onChange={(event) => edit({ city: event.target.value })} placeholder="Seleccioná tu ciudad" aria-label="Ciudad" />
            </div>
          </div>

          <div className="curriculum-field">
            <label htmlFor="cv-nationality">Nacionalidad</label>
            <select id="cv-nationality" value={draft.nationality} onChange={(event) => edit({ nationality: event.target.value })}>
              <option value="Uruguaya">Uruguaya</option>
              <option value="Argentina">Argentina</option>
              <option value="Brasileña">Brasileña</option>
              <option value="Paraguaya">Paraguaya</option>
              <option value="Chilena">Chilena</option>
              <option value="Otra">Otra</option>
            </select>
          </div>
        </div>

        <Button type="button" className="about-sheet-save" disabled={busy} onClick={() => { setEditingAbout(false); void save(); }}>{busy ? "Guardando…" : "Guardar"}</Button>
      </section>
    </div>}

    <AppBottomNav active="perfil" />
  </main>;
}
