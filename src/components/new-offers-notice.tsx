import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NewOffersNotice({ count, signature, onView }: { count: number; signature: string; onView: () => void }) {
  const [dismissed, setDismissed] = useState<string | null>(null);
  if (!count || dismissed === signature) return null;
  return <section className="new-offers-notice" aria-label="Nuevas ofertas sin ver">
    <Button variant="ghost" className="new-offers-notice-view" onClick={onView}>
      <span className="new-offers-notice-dot" aria-hidden="true" />
      <span>{count === 1 ? "1 nueva oferta sin ver" : `${count} nuevas ofertas sin ver`}</span>
    </Button>
    <Button variant="ghost" size="icon" className="new-offers-notice-close" aria-label="Cerrar aviso de nuevas ofertas" title="Cerrar aviso" onClick={() => setDismissed(signature)}><X /></Button>
  </section>;
}