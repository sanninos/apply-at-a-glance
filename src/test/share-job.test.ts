import { describe, expect, it } from "vitest";
import { jobShareText, whatsappShareUrl } from "@/lib/share-job";

describe("job share text", () => {
  it("includes title, company, location and link", () => {
    const text = jobShareText({ titulo: "Docente", empresa: "ANEP", lugar: "Montevideo" }, "https://x.uy/llamado/1");
    expect(text).toBe("💼 *Docente*\n🏢 ANEP\n📍 Montevideo\n\nMirala y postulate en URUJOBS:\nhttps://x.uy/llamado/1");
  });
  it("skips missing company and location", () => {
    expect(jobShareText({ titulo: "Chofer" }, "u")).toBe("💼 *Chofer*\n\nMirala y postulate en URUJOBS:\nu");
  });
  it("encodes the WhatsApp link", () => {
    expect(whatsappShareUrl("a b")).toBe("https://wa.me/?text=a%20b");
  });
});
