import { Link } from "@tanstack/react-router";
import { Bell, Radar, BriefcaseBusiness, Layers, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

type AppSection = "alertas" | "empleos" | "social" | "radar" | "perfil";

const sections = [
  { id: "alertas", label: "Alertas", icon: Bell, to: '/alertas' },
  { id: "radar", label: "Radar", icon: Radar, to: '/radar' },
  { id: "empleos", label: "Empleos", icon: BriefcaseBusiness, to: '/' },
  { id: "social", label: "Social", icon: Layers, to: '/social' },
  { id: "perfil", label: "Perfil", icon: UserRound, to: '/perfil' },
] as const;

export function AppBottomNav({ active }: { active: AppSection }) {
  return (
    <nav className="employment-nav" aria-label="Navegación principal">
      {sections.map(({ id, label, icon: Icon, to }) => {
        const isActive = id === active;
        const inner = (
          <>
            <span className="nav-icon">
              <Icon />
            </span>
            <span>{label}</span>
          </>
        );
        return (
          <Link
            key={label}
            to={to}
            preload="intent"
            preloadDelay={0}
            aria-current={isActive ? "page" : undefined}
            className={cn("employment-nav-item", isActive && "active")}
          >
            {inner}
          </Link>
        );
      })}
    </nav>
  );
}
