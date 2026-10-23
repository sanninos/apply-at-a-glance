import { Link } from "@tanstack/react-router";
import { Bell, Radar, BriefcaseBusiness, Layers, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AppSection = "empleos" | "social" | "radar" | "perfil";

const sections = [
  { id: "alertas", label: "Alertas", icon: Bell },
  { id: "radar", label: "Radar", icon: Radar },
  { id: "empleos", label: "Empleos", icon: BriefcaseBusiness },
  { id: "social", label: "Social", icon: Layers },
  { id: "perfil", label: "Perfil", icon: UserRound },
] as const;

export function AppBottomNav({ active }: { active: AppSection }) {
  return (
    <nav className="employment-nav" aria-label="Navegación principal">
      {sections.map(({ id, label, icon: Icon }) => {
        const isActive = id === active;
        const inner = (
          <>
            <span className="nav-icon">
              <Icon />
            </span>
            <span>{label}</span>
          </>
        );
        if (id === "empleos")
          return (
            <Link
              key={label}
              to="/"
              aria-current={isActive ? "page" : undefined}
              className={cn("employment-nav-item", isActive && "active")}
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              {inner}
            </Link>
          );
        if (id === "social" || id === "radar")
          return (
            <Link
              key={label}
              to={id === "social" ? "/social" : "/radar"}
              aria-current={isActive ? "page" : undefined}
              className={cn("employment-nav-item", isActive && "active")}
            >
              {inner}
            </Link>
          );
        if (id === 'perfil') return <Link key={label} to="/perfil" className={cn('employment-nav-item', isActive && 'active')} aria-current={isActive ? 'page' : undefined}>{inner}</Link>;
        return (
          <Button key={label} variant="ghost" disabled title={`${label}: próximamente`} className="employment-nav-item">
            {inner}
          </Button>
        );
      })}
    </nav>
  );
}
