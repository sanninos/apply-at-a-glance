import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { AnchorHTMLAttributes, ReactNode } from "react";

const badges = vi.hoisted(() => ({ alert: 0, social: 0, radar: 0 }));

vi.mock("@/lib/alert-badge", () => ({ useAlertBadgeCount: () => badges.alert }));
vi.mock("@/lib/social-badge", () => ({ useSocialBadgeCount: () => badges.social }));
vi.mock("@/lib/radar-badge", () => ({ useRadarBadgeCount: () => badges.radar }));
vi.mock("@/components/access-provider", () => ({
  useAccess: () => ({ user: null, ready: true }),
}));
vi.mock("@tanstack/react-router", () => ({
  Link: ({
    to,
    children,
    preload,
    preloadDelay,
    ...rest
  }: {
    to: string;
    children: ReactNode;
    preload?: string;
    preloadDelay?: number;
  } & AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}));

import { AppBottomNav, APP_NAV_SECTIONS } from "@/components/app-bottom-nav";

describe("menú inferior: Avanzado", () => {
  beforeEach(() => {
    badges.alert = 0;
    badges.social = 0;
    badges.radar = 0;
  });

  it("muestra Avanzado en lugar de Alertas", () => {
    render(<AppBottomNav active="empleos" />);
    expect(screen.getByRole("link", { name: "Avanzado" })).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Alertas" }),
    ).not.toBeInTheDocument();
  });

  it("Avanzado abre la pantalla de Alertas", () => {
    const avanzado = APP_NAV_SECTIONS.find((section) => section.id === "avanzado");
    expect(avanzado?.label).toBe("Avanzado");
    expect(avanzado?.to).toBe("/alertas");
    render(<AppBottomNav active="avanzado" />);
    const link = screen.getByRole("link", { name: "Avanzado" });
    expect(link).toHaveAttribute("href", "/alertas");
    expect(link).toHaveAttribute("aria-current", "page");
  });

  it("conserva el contador de avisos sin leer", () => {
    badges.alert = 3;
    render(<AppBottomNav active="empleos" />);
    expect(
      screen.getByRole("link", { name: "Avanzado, 3 avisos sin leer" }),
    ).toHaveAttribute("href", "/alertas");
  });

  it("usa el icono propio pintado con currentColor", () => {
    render(<AppBottomNav active="empleos" />);
    const svg = screen
      .getByRole("link", { name: "Avanzado" })
      .querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute("fill")).toBe("currentColor");
  });
});
