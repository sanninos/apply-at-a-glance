import { Link } from "@tanstack/react-router";
import { Bookmark, BookmarkCheck, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSavedOffer } from "@/hooks/use-saved-offer";

export function SocialQuickActions({ jobId }: { jobId: number }) {
  const { saved, busy, error, toggle } = useSavedOffer(jobId);
  return (
    <div className="mt-4 flex flex-col gap-2">
      <div className="flex gap-2">
        <Button type="button" variant={saved ? "secondary" : "outline"} className="flex-1" disabled={busy} aria-pressed={saved} onClick={toggle}>
          {saved ? <BookmarkCheck aria-hidden="true" /> : <Bookmark aria-hidden="true" />}
          {saved ? "Guardada" : "Guardar"}
        </Button>
        <Button asChild className="flex-1">
          <Link to="/llamado/$jobId" params={{ jobId: String(jobId) }} preload="intent">
            <Send aria-hidden="true" /> Postularme
          </Link>
        </Button>
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
