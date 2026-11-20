import { useState } from "react";
const MASCOTA_URL = "https://stkkqtkoeonowmpmhejb.supabase.co/storage/v1/object/public/iconos/Carpincho%20coronado%20con%20mate%20y%20bandera%20uruguaya.png";

import type { PaywallPlan, PlanId } from "@/lib/revenuecat";

const BENEFICIOS = [
  { titulo: "Alertas de avisos nuevos", detalle: "en tu zona y tu rubro" },
  { titulo: "Postulaciones ilimitadas", detalle: "con un solo toque" },
  { titulo: "Filtros avanzados", detalle: "por categoría, zona y horario" },
  { titulo: "Avisos destacados", detalle: "antes que el resto" },
];

const PASOS = (cobro: string, dias: number) => [
  { titulo: "Hoy", texto: "Empezás a usar todo Premium gratis." },
  ...(dias > 2 ? [{ titulo: `Día ${dias - 2}`, texto: "Podés cancelar desde Google Play antes de que termine la prueba." }] : []),
  { titulo: `Día ${dias}`, texto: `Se cobra ${cobro}. Cancelás antes y no pagás nada.` },
];

export type PaywallState = "ready" | "loading" | "unavailable" | "error" | "active";

const ESTADOS: Record<Exclude<PaywallState, "ready">, string> = {
  loading: "Cargando planes…",
  unavailable: "Los planes Premium solo se pueden contratar desde la app de Android.",
  error: "No pudimos cargar los planes. Revisá tu conexión e intentá nuevamente.",
  active: "Ya tenés UruJobs Premium activo. ¡Gracias por tu apoyo!",
};

interface PaywallProps {
  plans?: PaywallPlan[];
  state?: PaywallState;
  busy?: boolean;
  message?: { ok: boolean; text: string } | null;
  onStart?: (plan: PaywallPlan) => void;
  onClose?: () => void;
  onRetry?: () => void;
  onRestore?: () => void;
  onTerms?: () => void;
  onPrivacy?: () => void;
}

export function Paywall({ plans = [], state = "ready", busy = false, message, onStart, onClose, onRetry, onRestore, onTerms, onPrivacy }: PaywallProps) {
  const [elegido, setElegido] = useState<PlanId | null>(null);
  const actual = plans.find((p) => p.id === elegido) ?? plans.find((p) => p.id === "yearly") ?? plans[0];
  const dias = actual?.pruebaDias ?? null;
  const renovable = actual !== undefined && actual.id !== "lifetime";
  const listo = state === "ready" && actual !== undefined;

  return (
    <div className="mx-auto flex min-h-full w-full max-w-[430px] flex-col overflow-x-clip bg-[var(--paywall-surface)] font-['DM_Sans',system-ui,sans-serif] text-[var(--paywall-ink)]">
      {/* Hero */}
      <header
        className="relative bg-[var(--paywall-blue)] px-6 pt-5 text-center text-[var(--paywall-surface)]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(180deg, color-mix(in oklab, var(--paywall-surface) 7%, transparent) 0 26px, transparent 26px 52px)",
        }}
      >
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute right-3.5 top-3.5 z-10 grid h-9 w-9 place-items-center rounded-full bg-[color-mix(in_oklab,var(--paywall-surface)_15%,transparent)] text-xl leading-none text-[var(--paywall-surface)] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--paywall-yellow)]"
        >
          ×
        </button>

        <div className="relative z-[1] mt-7 inline-block rounded-[18px] bg-[var(--paywall-surface)] px-4 py-2 font-['Fredoka',sans-serif] text-[15px] font-semibold text-[var(--paywall-ink)]">
          ¡Tu próximo laburo te espera!
          <span className="absolute -bottom-[9px] left-1/2 h-[18px] w-[18px] -translate-x-1/2 rotate-45 rounded-[3px] bg-[var(--paywall-surface)]" />
        </div>

        <img
          src={MASCOTA_URL}
          alt="Carpincho coronado con mate y bandera de Uruguay, la mascota de UruJobs"
          className="relative z-[1] mx-auto mb-[-6px] mt-8 block w-[210px] max-w-[60%] motion-safe:animate-bounce [animation-duration:3.6s]"
        />
      </header>

      {/* Sheet */}
      <section className="relative z-[2] -mt-[18px] flex-1 rounded-t-[28px] bg-[var(--paywall-surface)] px-[22px] pb-5 pt-[26px]">
        <h1 className="text-center font-['Fredoka',sans-serif] text-[28px] font-bold leading-[1.1] tracking-tight">
          {dias ? `Probá UruJobs Premium ${dias} ${dias === 1 ? "día" : "días"} gratis` : "Pasate a UruJobs Premium"}
        </h1>
        <p className="mx-auto mb-[18px] mt-2 max-w-[30ch] text-center text-[15px] leading-snug text-[var(--paywall-muted)]">
          {dias ? "Encontrá trabajo más rápido, sin pagar nada hoy." : "Encontrá trabajo más rápido con todas las ventajas."}
        </p>

        <ul className="mb-5 grid gap-[11px]">
          {BENEFICIOS.map((b) => (
            <li key={b.titulo} className="flex items-start gap-3 text-[15px] leading-snug">
              <span className="grid h-7 w-7 flex-none place-items-center rounded-[9px] bg-[var(--paywall-cream)]">
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-[var(--paywall-blue)]" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12l5 5L20 7" />
                </svg>
              </span>
              <span>
                <b className="font-bold">{b.titulo}</b> {b.detalle}
              </span>
            </li>
          ))}
        </ul>

        {/* Planes */}
        {state !== "ready" || !actual ? (
          <div className="rounded-[18px] bg-[var(--paywall-cream)] px-4 py-5 text-center text-[15px] leading-snug" role={state === "error" ? "alert" : "status"}>
            {ESTADOS[state === "ready" ? "error" : state]}
            {state === "error" && onRetry && (
              <button onClick={onRetry} className="mt-3 block w-full font-bold underline">Reintentar</button>
            )}
          </div>
        ) : (
        <div role="radiogroup" aria-label="Elegí tu plan" className="grid grid-cols-2 gap-2.5">
          {plans.map((p) => {
            const activo = actual.id === p.id;
            return (
              <button
                key={p.id}
                role="radio"
                aria-checked={activo}
                disabled={busy}
                onClick={() => setElegido(p.id)}
                className={`relative rounded-[18px] border-2 px-3.5 pb-[13px] pt-4 text-left focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--paywall-yellow)] ${
                  plans.length % 2 === 1 && p === plans[plans.length - 1] ? "col-span-2" : ""
                } ${
                  activo
                    ? "border-[var(--paywall-blue)] bg-[var(--paywall-blue-soft)] shadow-[0_0_0_3px_var(--paywall-ring)]"
                    : "border-[var(--paywall-line)] bg-[var(--paywall-surface)]"
                }`}
              >
                {p.etiqueta && (
                  <span className="absolute -top-[11px] right-3 rounded-full bg-[var(--paywall-yellow)] px-2.5 py-[3px] text-xs font-bold text-[var(--paywall-on-yellow)]">
                    {p.etiqueta}
                  </span>
                )}
                <div className="text-[15px] font-bold">{p.nombre}</div>
                <div className="mt-1 font-['Fredoka',sans-serif] text-[22px] font-bold">
                  {p.precio} <small className="font-['DM_Sans',sans-serif] text-[13px] font-medium text-[var(--paywall-muted)]">{p.periodo}</small>
                </div>
                <div className="mt-0.5 text-[12.5px] text-[var(--paywall-muted)]">{p.nota}</div>
              </button>
            );
          })}
        </div>
        )}

        {listo && dias && (
        <ol className="mx-0.5 mb-1 mt-[18px]">
          {PASOS(actual.cobro, dias).map((s, i, arr) => (
            <li key={s.titulo} className="relative grid grid-cols-[22px_1fr] gap-3 pb-3 text-sm leading-snug last:pb-0">
              {i < arr.length - 1 && <span className="absolute bottom-[-2px] left-2.5 top-5 w-0.5 bg-[var(--paywall-line)]" />}
              <i
                className={`h-[22px] w-[22px] rounded-full border-[3px] border-[var(--paywall-surface)] not-italic ${
                  i === 0 ? "bg-[var(--paywall-yellow)] shadow-[0_0_0_2px_var(--paywall-yellow)]" : "bg-[var(--paywall-surface)] shadow-[0_0_0_2px_var(--paywall-line)]"
                }`}
              />
              <div>
                <b className="block font-bold">{s.titulo}</b>
                <span className="text-[var(--paywall-muted)]">{s.texto}</span>
              </div>
            </li>
          ))}
        </ol>
        )}
      </section>
      <div className="sticky bottom-0 z-[3] border-t border-[var(--paywall-line)] bg-[var(--paywall-surface)] px-[22px] pb-[calc(12px+env(safe-area-inset-bottom,0px))] pt-3">
        {message && (
          <p className={`mb-2 text-center text-[13.5px] leading-snug ${message.ok ? "text-[var(--paywall-muted)]" : "font-semibold text-destructive"}`} role={message.ok ? "status" : "alert"}>
            {message.text}
          </p>
        )}
        {listo && (
          <>
            <button
              onClick={() => onStart?.(actual)}
              disabled={busy}
              className="block w-full rounded-[18px] bg-[var(--paywall-yellow)] px-[18px] py-[17px] font-['Fredoka',sans-serif] text-[19px] font-bold text-[var(--paywall-on-yellow)] shadow-[0_4px_0_var(--paywall-yellow-shadow)] transition active:translate-y-[3px] active:shadow-[0_1px_0_var(--paywall-yellow-shadow)] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--paywall-blue)] disabled:opacity-60"
            >
              {busy ? "Procesando…" : dias ? `Empezar mis ${dias} ${dias === 1 ? "día" : "días"} gratis` : `Suscribirme por ${actual.precio}`}
            </button>
            <p className="mt-2 text-center text-[12.5px] leading-snug text-[var(--paywall-muted)]">
              {dias ? `${dias} ${dias === 1 ? "día" : "días"} gratis, después ${actual.cobro}.` : `${actual.cobro}.`}
              {renovable ? " Renovación automática." : ""}
            </p>
          </>
        )}

        <div className="mt-1 flex justify-center gap-[18px] text-[12.5px] text-[var(--paywall-muted)]">
          {listo && onRestore && <button onClick={onRestore} disabled={busy} className="p-1 underline">Restaurar compras</button>}
          {onTerms && <button onClick={onTerms} className="p-1 underline">Términos</button>}
          {onPrivacy && <button onClick={onPrivacy} className="p-1 underline">Privacidad</button>}
        </div>
      </div>
    </div>
  );
}