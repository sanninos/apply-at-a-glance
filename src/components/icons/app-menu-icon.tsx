import type { SVGProps } from "react";

/**
 * Icono "Avanzado" del menú inferior.
 * Dibuja con currentColor para heredar el color activo/inactivo del nav.
 */
export function AppMenuIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      <path
        fillRule="evenodd"
        d="M2 1h8a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1Zm1 2v6h6V3H3Zm11-2h8a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-8a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1Zm1 2v6h6V3h-6ZM2 13h8a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1Zm1 2v6h6v-6H3Z"
      />
      <circle cx="14.35" cy="18" r=".95" />
      <circle cx="18" cy="18" r=".95" />
      <circle cx="21.65" cy="18" r=".95" />
    </svg>
  );
}
