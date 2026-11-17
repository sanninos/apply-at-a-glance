import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import premiumAsset from "@/assets/premium.svg.asset.json";

/**
 * PRO upsell bar shown in the home list after the third offer. It is display
 * only: the animated badge plays, and the X closes it for the current visit.
 */
export function HomeProBar() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  return <section className="pro-bar" aria-label="Plan PRO">
    <div className="pro-bar-body">
      <img className="pro-bar-icon" src={premiumAsset.url} alt="" aria-hidden="true" />
      <span className="pro-bar-text">Adquiere PRO y obtén ventajas exclusivas</span>
    </div>
    <Button variant="ghost" size="icon" className="pro-bar-close" aria-label="Cerrar aviso de PRO" title="Cerrar aviso" onClick={() => setDismissed(true)}><X /></Button>
  </section>;
}
