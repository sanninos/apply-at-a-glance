import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Cake, Camera, Check, ChevronLeft, FileUp, Lightbulb, LogIn, Mail, Pencil, Plus, RefreshCw, Smartphone, Star, Trash2, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppBottomNav } from "@/components/app-bottom-nav";
import { useAccessDialog } from "@/components/access-dialog";
import { useAccess } from "@/components/access-provider";
import { supabase } from "@/integrations/supabase/client";
import { importCurriculumFile } from "@/lib/curriculum-import.functions";
import {
  applyImportedCurriculum,
  curriculumPayload,
  emptyCurriculum,
  emptyEducation,
  emptyExperience,
  toCurriculumDraft,
  type CurriculumDraft,
  type CurriculumRow,
  type EducationDraft,
  type ExperienceDraft,
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
  const [experienceIsNew, setExperienceIsNew] = useState(false);
  const [editingEducation, setEditingEducation] = useState<string | null>(null);
  const [educationIsNew, setEducationIsNew] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState("");
  const importInput = useRef<HTMLInputElement | null>(null);
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

  function openExperience(id?: string) {
    if (id) {
      setExperienceIsNew(false);
      setEditingExperience(id);
      return;
    }
    const entry = emptyExperience();
    edit({ experiences: [...draft.experiences, entry] });
    setExperienceIsNew(true);
    setEditingExperience(entry.id);
  }

  function updateExperience(id: string, patch: Partial<ExperienceDraft>) {
    edit({ experiences: draft.experiences.map((row) => (row.id === id ? { ...row, ...patch } : row)) });
  }

  function closeExperience() {
    setEditingExperience(null);
    void save();
  }

  function openEducation(id?: string) {
    if (id) {
      setEducationIsNew(false);
      setEditingEducation(id);
      return;
    }
    const entry = emptyEducation();
    edit({ education: [...draft.education, entry] });
    setEducationIsNew(true);
    setEditingEducation(entry.id);
  }

  function updateEducation(id: string, patch: Partial<EducationDraft>) {
    edit({ education: draft.education.map((row) => (row.id === id ? { ...row, ...patch } : row)) });
  }

  function closeEducation() {
    setEditingEducation(null);
    void save();
  }

  const editingExperienceEntry = editingExperience ? draft.experiences.find((entry) => entry.id === editingExperience) ?? null : null;
  const editingEducationEntry = editingEducation ? draft.education.find((entry) => entry.id === editingEducation) ?? null : null;

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

  async function handleImportFile(file: File) {
    setImporting(true);
    setImportMessage("");
    try {
      const buffer = await file.arrayBuffer();
      let binary = "";
      const bytes = new Uint8Array(buffer);
      const chunk = 0x8000;
      for (let i = 0; i < bytes.length; i += chunk) binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
      const imported = await importCurriculumFile({ data: { fileName: file.name, mimeType: file.type, base64: btoa(binary) } });
      edit(applyImportedCurriculum(draft, imported));
      setImportMessage("Listo: completamos los campos con los datos de tu currículum. Revisalos antes de seguir.");
    } catch (cause) {
      setImportMessage(cause instanceof Error ? cause.message : "No pudimos importar el archivo.");
    } finally {
      setImporting(false);
      if (importInput.current) importInput.current.value = "";
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
      <input ref={importInput} type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="curriculum-import-input" aria-hidden="true" tabIndex={-1} onChange={(event) => { const file = event.target.files?.[0]; if (file) void handleImportFile(file); }} />
      <section className="curriculum-import">
        <Button type="button" variant="outline" className="curriculum-import-button" disabled={importing} onClick={() => importInput.current?.click()}>
          <FileUp aria-hidden="true" />{importing ? "Analizando tu currículum…" : "Importar currículum (PDF o Word)"}
        </Button>
        <p className="curriculum-import-hint">Completamos los campos automáticamente con los datos del archivo.</p>
        {importMessage && <p className="curriculum-import-message" role="status">{importMessage}</p>}
      </section>
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
        <div className="curriculum-section-head"><h2 className="curriculum-block-title">EXPERIENCIA PROFESIONAL</h2><Button type="button" variant="ghost" size="icon" title="Añadir experiencia" aria-label="Añadir experiencia" onClick={() => openExperience()}><Plus /></Button></div>
        {draft.experiences.map((entry, index) => (
          (entry.puesto || entry.empresa || entry.desde || entry.hasta || entry.descripcion) && <div className="curriculum-entry" key={entry.id}>
            <div className="curriculum-item-summary"><span className="curriculum-timeline-dot" /><div><h3>{entry.puesto || "Experiencia"}{entry.empresa && ` en ${entry.empresa}`}</h3><p>{[entry.desde, entry.actualmente ? "Actualidad" : entry.hasta].filter(Boolean).join(" - ")}</p></div><Button type="button" variant="ghost" size="icon" title="Editar experiencia" aria-label={`Editar experiencia ${index + 1}`} onClick={() => openExperience(entry.id)}><Pencil /></Button></div>
          </div>
        ))}
        <Button type="button" variant="ghost" className="curriculum-add" onClick={() => openExperience()}>Añadir experiencia</Button>
      </section>

      <section className="curriculum-block">
        <div className="curriculum-section-head"><h2 className="curriculum-block-title">EDUCACIÓN</h2><Button type="button" variant="ghost" size="icon" title="Añadir educación" aria-label="Añadir educación" onClick={() => openEducation()}><Plus /></Button></div>
        {draft.education.map((entry, index) => (
          (entry.nivel || entry.titulo || entry.institucion || entry.desde || entry.hasta || entry.descripcion || entry.lugar) && <div className="curriculum-entry" key={entry.id}>
            <div className="curriculum-item-summary"><span className="curriculum-timeline-dot" /><div><h3>{entry.titulo || entry.nivel || "Educación"}{entry.institucion && ` · ${entry.institucion}`}</h3><p>{[entry.desde, entry.actualmente ? "Actualidad" : entry.hasta].filter(Boolean).join(" - ")}</p></div><Button type="button" variant="ghost" size="icon" title="Editar educación" aria-label={`Editar educación ${index + 1}`} onClick={() => openEducation(entry.id)}><Pencil /></Button></div>
          </div>
        ))}
        <Button type="button" variant="ghost" className="curriculum-add" onClick={() => openEducation()}>Añadir educación</Button>
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

    {signedIn && editingExperienceEntry && <div className="experience-screen" role="dialog" aria-modal="true" aria-labelledby="experience-screen-title">
      <header className="experience-screen-head">
        <button type="button" className="experience-screen-back" aria-label="Volver" onClick={closeExperience}><ChevronLeft aria-hidden="true" /></button>
        <h2 id="experience-screen-title">Experiencias</h2>
      </header>
      <div className="experience-screen-body">
        <div className="curriculum-field">
          <label htmlFor="exp-cargo">Cargo</label>
          <input id="exp-cargo" value={editingExperienceEntry.puesto} onChange={(event) => updateExperience(editingExperienceEntry.id, { puesto: event.target.value })} />
        </div>
        <div className="curriculum-field">
          <label htmlFor="exp-empresa">Empresa</label>
          <input id="exp-empresa" value={editingExperienceEntry.empresa} onChange={(event) => updateExperience(editingExperienceEntry.id, { empresa: event.target.value })} />
        </div>
        <div className="curriculum-field">
          <label htmlFor="exp-funciones">Funciones y logros del cargo</label>
          <textarea id="exp-funciones" value={editingExperienceEntry.descripcion} maxLength={500} rows={5} onChange={(event) => updateExperience(editingExperienceEntry.id, { descripcion: event.target.value })} />
          <span className="experience-counter">{editingExperienceEntry.descripcion.length}/500 · máximo 500 caracteres</span>
        </div>
        <div className="curriculum-field">
          <label htmlFor="exp-lugar">Lugar</label>
          <input id="exp-lugar" value={editingExperienceEntry.lugar} onChange={(event) => updateExperience(editingExperienceEntry.id, { lugar: event.target.value })} placeholder="Ej: Montevideo" />
        </div>
        <div className="about-toggle-row">
          <label htmlFor="exp-actualmente">Actualmente trabajo aquí</label>
          <button id="exp-actualmente" type="button" role="switch" aria-checked={editingExperienceEntry.actualmente} className={editingExperienceEntry.actualmente ? "about-toggle is-on" : "about-toggle"} onClick={() => updateExperience(editingExperienceEntry.id, { actualmente: !editingExperienceEntry.actualmente, hasta: !editingExperienceEntry.actualmente ? "Actualidad" : "" })}>
            <span aria-hidden="true" />
          </button>
        </div>
        <div className="experience-dates">
          <div className="curriculum-field">
            <label htmlFor="exp-inicio">Inicio</label>
            <input id="exp-inicio" value={editingExperienceEntry.desde} onChange={(event) => updateExperience(editingExperienceEntry.id, { desde: event.target.value })} placeholder="Ej: 2022" />
          </div>
          <div className="curriculum-field">
            <label htmlFor="exp-fin">Fin</label>
            <input id="exp-fin" value={editingExperienceEntry.actualmente ? "Actualidad" : editingExperienceEntry.hasta} disabled={editingExperienceEntry.actualmente} onChange={(event) => updateExperience(editingExperienceEntry.id, { hasta: event.target.value })} placeholder="Ej: 2024" />
          </div>
        </div>
        <div className="about-toggle-row">
          <label htmlFor="exp-recomienda">Recomienda trabajar aquí</label>
          <button id="exp-recomienda" type="button" role="switch" aria-checked={editingExperienceEntry.recomienda} className={editingExperienceEntry.recomienda ? "about-toggle is-on" : "about-toggle"} onClick={() => updateExperience(editingExperienceEntry.id, { recomienda: !editingExperienceEntry.recomienda })}>
            <span aria-hidden="true" />
          </button>
        </div>
        {([
          ["Evaluación general de la empresa", "ratingGeneral"],
          ["Ambiente de trabajo", "ratingAmbiente"],
          ["Director general", "ratingDirector"],
          ["Salario y prestaciones", "ratingSalario"],
          ["Oportunidades de carrera", "ratingOportunidades"],
        ] as const).map(([label, key]) => (
          <div className="experience-rating" key={key}>
            <span className="experience-rating-label">{label}</span>
            <div className="experience-stars" role="group" aria-label={label}>
              {[1, 2, 3, 4, 5].map((value) => (
                <button key={value} type="button" className={editingExperienceEntry[key] >= value ? "experience-star is-active" : "experience-star"} aria-label={`${label}: ${value} de 5`} aria-pressed={editingExperienceEntry[key] >= value} onClick={() => updateExperience(editingExperienceEntry.id, { [key]: editingExperienceEntry[key] === value ? 0 : value })}>
                  <Star aria-hidden="true" fill="currentColor" />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <footer className="experience-screen-foot">
        {!experienceIsNew && <Button type="button" variant="ghost" className="experience-screen-delete" onClick={() => { edit({ experiences: draft.experiences.filter((row) => row.id !== editingExperienceEntry.id) }); closeExperience(); }}><Trash2 aria-hidden="true" />Quitar</Button>}
        <Button type="button" className="experience-screen-save" disabled={busy} onClick={closeExperience}>{busy ? "Guardando…" : experienceIsNew ? "Añadir" : "Guardar"}</Button>
      </footer>
    </div>}

    {signedIn && editingEducationEntry && <div className="experience-screen" role="dialog" aria-modal="true" aria-labelledby="education-screen-title">
      <header className="experience-screen-head">
        <button type="button" className="experience-screen-back" aria-label="Volver" onClick={closeEducation}><ChevronLeft aria-hidden="true" /></button>
        <h2 id="education-screen-title">Educación</h2>
      </header>
      <div className="experience-screen-body">
        <div className="curriculum-field">
          <label htmlFor="edu-nivel">Nivel de estudios</label>
          <select id="edu-nivel" value={editingEducationEntry.nivel} onChange={(event) => updateEducation(editingEducationEntry.id, { nivel: event.target.value })}>
            <option value="">Seleccioná el nivel</option>
            <option value="Primaria">Primaria</option>
            <option value="Secundaria">Secundaria</option>
            <option value="UTU">UTU</option>
            <option value="Terciario / Universitario">Terciario / Universitario</option>
            <option value="Posgrado">Posgrado</option>
            <option value="Curso o taller">Curso o taller</option>
          </select>
        </div>
        <div className="curriculum-field">
          <label htmlFor="edu-titulo">Título</label>
          <input id="edu-titulo" value={editingEducationEntry.titulo} onChange={(event) => updateEducation(editingEducationEntry.id, { titulo: event.target.value })} placeholder="Ej: Bachillerato, Licenciatura en…" />
        </div>
        <div className="curriculum-field">
          <label htmlFor="edu-institucion">Institución</label>
          <input id="edu-institucion" value={editingEducationEntry.institucion} onChange={(event) => updateEducation(editingEducationEntry.id, { institucion: event.target.value })} />
        </div>
        <div className="curriculum-field">
          <label htmlFor="edu-descripcion">Descripción y logros</label>
          <textarea id="edu-descripcion" value={editingEducationEntry.descripcion} maxLength={500} rows={5} onChange={(event) => updateEducation(editingEducationEntry.id, { descripcion: event.target.value })} />
          <span className="experience-counter">{editingEducationEntry.descripcion.length}/500 · máximo 500 caracteres</span>
        </div>
        <div className="curriculum-field">
          <label htmlFor="edu-lugar">Lugar</label>
          <input id="edu-lugar" value={editingEducationEntry.lugar} onChange={(event) => updateEducation(editingEducationEntry.id, { lugar: event.target.value })} placeholder="Ej: Montevideo" />
        </div>
        <div className="about-toggle-row">
          <label htmlFor="edu-actualmente">Actualmente estudio aquí</label>
          <button id="edu-actualmente" type="button" role="switch" aria-checked={editingEducationEntry.actualmente} className={editingEducationEntry.actualmente ? "about-toggle is-on" : "about-toggle"} onClick={() => updateEducation(editingEducationEntry.id, { actualmente: !editingEducationEntry.actualmente, hasta: !editingEducationEntry.actualmente ? "Actualidad" : "" })}>
            <span aria-hidden="true" />
          </button>
        </div>
        <div className="experience-dates">
          <div className="curriculum-field">
            <label htmlFor="edu-inicio">Inicio</label>
            <input id="edu-inicio" value={editingEducationEntry.desde} onChange={(event) => updateEducation(editingEducationEntry.id, { desde: event.target.value })} placeholder="Ej: 2018" />
          </div>
          <div className="curriculum-field">
            <label htmlFor="edu-fin">Fin</label>
            <input id="edu-fin" value={editingEducationEntry.actualmente ? "Actualidad" : editingEducationEntry.hasta} disabled={editingEducationEntry.actualmente} onChange={(event) => updateEducation(editingEducationEntry.id, { hasta: event.target.value })} placeholder="Ej: 2021" />
          </div>
        </div>
      </div>
      <footer className="experience-screen-foot">
        {!educationIsNew && <Button type="button" variant="ghost" className="experience-screen-delete" onClick={() => { edit({ education: draft.education.filter((row) => row.id !== editingEducationEntry.id) }); closeEducation(); }}><Trash2 aria-hidden="true" />Quitar</Button>}
        <Button type="button" className="experience-screen-save" disabled={busy} onClick={closeEducation}>{busy ? "Guardando…" : educationIsNew ? "Añadir" : "Guardar"}</Button>
      </footer>
    </div>}

    <AppBottomNav active="perfil" />
  </main>;
}
