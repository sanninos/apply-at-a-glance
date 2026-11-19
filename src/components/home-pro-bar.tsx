import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Paywall } from "@/components/paywall";
import premiumAsset from "@/assets/premium.svg.asset.json";

/**
 * PRO upsell bar shown in the home list after the third offer. Tapping the bar
 * opens the Premium plans screen; the X closes the bar for the current visit.
 */
export function HomeProBar() {
  const [dismissed, setDismissed] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);

  useEffect(() => {
    if (!paywallOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPaywallOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [paywallOpen]);

  if (dismissed) return null;

  return (
    <>
      <section className="pro-bar" aria-label="Plan PRO">
        <button type="button" className="pro-bar-body" onClick={() => setPaywallOpen(true)}>
          <img className="pro-bar-icon" src={premiumAsset.url} alt="" aria-hidden="true" />
          <span className="pro-bar-text">Adquiere PRO y obtén ventajas exclusivas</span>
        </button>
        <Button
          variant="ghost"
          size="icon"
          className="pro-bar-close"
          aria-label="Cerrar aviso de PRO"
          title="Cerrar aviso"
          onClick={() => setDismissed(true)}
        >
          <X />
        </Button>
      </section>
      {paywallOpen && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-background"
          role="dialog"
          aria-modal="true"
          aria-label="Planes UruJobs Premium"
        >
          <Paywall
            onClose={() => setPaywallOpen(false)}
            onStart={() => {}}
            onRestore={() => {}}
            onTerms={() => {}}
            onPrivacy={() => {}}
          />
        </div>
      )}
    </>
  );
}
