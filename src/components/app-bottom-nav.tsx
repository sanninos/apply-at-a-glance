import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Radar, BriefcaseBusiness, Layers, UserRound } from "lucide-react";
import { AppMenuIcon } from "@/components/icons/app-menu-icon";
import { cn } from "@/lib/utils";
import { useAlertBadgeCount } from "@/lib/alert-badge";
import { useSocialBadgeCount } from "@/lib/social-badge";
import { useRadarBadgeCount } from "@/lib/radar-badge";
import { useAccess } from "@/components/access-provider";

export function avatarUrlOf(user: { user_metadata?: Record<string, unknown> } | null): string | null {
  const meta = user?.user_metadata ?? {};
  const url = meta["avatar_url"] ?? meta["picture"];
  return typeof url === "string" && url.trim() ? url : null;
}

type AppSection = "explorar" | "empleos" | "social" | "radar" | "perfil";

export const APP_NAV_SECTIONS = [
  { id: "explorar", label: "Explorar", icon: AppMenuIcon, to: '/alertas' },
  { id: "radar", label: "Radar", icon: Radar, to: '/radar' },
  { id: "empleos", label: "Empleos", icon: BriefcaseBusiness, to: '/' },
  { id: "social", label: "Social", icon: Layers, to: '/social' },
  { id: "perfil", label: "Perfil", icon: UserRound, to: '/perfil' },
] as const;

export function AppBottomNav({ active }: { active: AppSection }) {
  const alertBadge = useAlertBadgeCount();
  const socialBadge = useSocialBadgeCount();
  const radarBadge = useRadarBadgeCount();
  const { user } = useAccess();
  const avatarUrl = avatarUrlOf(user);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const showAvatar = Boolean(avatarUrl) && !avatarFailed;
  return (
    <nav className="employment-nav" aria-label="Navegación principal">
      {APP_NAV_SECTIONS.map(({ id, label, icon: Icon, to }) => {
        const isActive = id === active;
        const badge = id === "explorar" ? alertBadge : id === "social" ? socialBadge : id === "radar" ? radarBadge : 0;
        const badgeLabel = badge > 99 ? "99+" : String(badge);
        const inner = (
          <>
            <span className="nav-icon">
              {id === "perfil" && showAvatar ? (
                <img
                  src={avatarUrl ?? undefined}
                  alt=""
                  className="nav-avatar"
                  referrerPolicy="no-referrer"
                  onError={() => setAvatarFailed(true)}
                />
              ) : (
                <Icon />
              )}
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
            aria-label={badge > 0 ? `${label}, ${badge} ${id === 'explorar' ? 'avisos sin leer' : id === 'radar' ? 'ofertas nuevas en el mapa' : 'pósteres sin ver'}` : label}
            className={cn("employment-nav-item", isActive && "active")}
          >
            {inner}
          </Link>
        );
      })}
    </nav>
  );
}
