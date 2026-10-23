import { useEffect, useRef, useState } from "react";
import { DEFAULT_EMPLOYER_LOGO } from "@/lib/job-branding";

/**
 * Resolves the logo for a job: the company photo when there is one, the shared
 * placeholder when there is none or the photo cannot be loaded, and finally the
 * building icon when even the placeholder fails.
 *
 * A photo that fails during the first paint never reaches React's onError, so
 * the loaded state is also checked once after mount.
 */
export function useEmployerLogo(photo: string | null) {
  const [source, setSource] = useState<"photo" | "default" | "none">(photo ? "photo" : "default");
  const ref = useRef<HTMLImageElement>(null);
  const src = source === "photo" ? photo : source === "default" ? DEFAULT_EMPLOYER_LOGO : null;
  const onError = () => setSource(current => (current === "photo" ? "default" : "none"));

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const fail = () => setSource(current => (current === "photo" ? "default" : current === "default" ? "none" : current));
    // A photo that failed before React could attach its own handler is only
    // visible through the element's load state; the placeholder is not re-checked
    // that way so a never-loaded placeholder never cascades into the icon.
    if (source === "photo" && element.complete && element.naturalWidth === 0) fail();
    element.addEventListener("error", fail, { once: true });
    return () => element.removeEventListener("error", fail);
  }, [src, source]);

  return { src, ref, onError };
}
