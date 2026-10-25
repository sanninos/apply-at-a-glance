import { Link } from "@tanstack/react-router";
import { Bell, Radar, BriefcaseBusiness, Layers, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAlertBadgeCount } from "@/lib/alert-badge";
import { useSocialBadgeCount } from "@/lib/social-badge";

type AppSection = "alertas" | "empleos" | "social" | "radar" | "perfil";

const sections = [
  { id: "alertas", label: "Alertas", icon: Bell, to: '/alertas' },
  { id: "radar", label: "Radar", icon: Radar, to: '/radar' },
  { id: "empleos", label: "Empleos", icon: BriefcaseBusiness, to: '/' },
  { id: "social", label: "Social", icon: Layers, to: '/social' },
  { id: "perfil", label: "Perfil", icon: UserRound, to: '/perfil' },
] as const;

export function AppBottomNav({ active }: { active: AppSection }) {
  const alertBadge = useAlertBadgeCount();
  const socialBadge = useSocialBadgeCount();
  return (
    <nav className="employment-nav" aria-label="Navegación principal">
      {sections.map(({ id, label, icon: Icon, to }) => {
        const isActive = id === active;
        const badge = id === "alertas" ? alertBadge : id === "social" ? socialBadge : 0;
        const badgeLabel = badge > 99 ? "99+" : String(badge);
        const inner = (
          <>
            <span className="nav-icon">
              <Icon />
            </span>
            <span>{label}</span>
            {badge > 0 && (
              <span className="employment-nav-badge" aria-hidden="true">{badgeLabel}</span>
            )}
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
