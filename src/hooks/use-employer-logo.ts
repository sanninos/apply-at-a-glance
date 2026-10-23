import { useEffect, useRef, useState } from "react";
import { DEFAULT_EMPLOYER_LOGO } from "@/lib/job-branding";

type LogoSource = "photo" | "default" | "none";

/**
 * Resolves the logo for a job: the company photo when there is one, the shared
 * placeholder when there is none or the photo cannot be loaded, and finally the
 * icon when even the placeholder fails.
 *
 * The failure listener lives on the element itself, so a photo that fails while
 * it is loading is still replaced, and the stage guard keeps two handlers
 * reporting the same failure from skipping straight to the icon.
 */
export function useEmployerLogo(photo: string | null) {
  const [source, setSource] = useState<LogoSource>(photo ? "photo" : "default");
  const ref = useRef<HTMLImageElement>(null);
  const src = source === "photo" ? photo : source === "default" ? DEFAULT_EMPLOYER_LOGO : null;

  const advance = (from: LogoSource) =>
    setSource(current => (current === from ? (from === "photo" ? "default" : "none") : current));
  const onError = () => advance(source);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const fail = () => advance(source);
    // A photo that failed before React attached its own handler only shows it in
    // the element's load state. The placeholder is not re-checked that way, so a
    // never-loaded placeholder never cascades into the icon.
    if (source === "photo" && element.complete && element.naturalWidth === 0) fail();
    element.addEventListener("error", fail, { once: true });
    return () => element.removeEventListener("error", fail);
  }, [src, source]);

  return { src, ref, onError };
}
