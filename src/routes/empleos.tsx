import { createFileRoute, redirect } from "@tanstack/react-router";

// The employment list is the home screen; /empleos keeps working as an alias so
// links shared before the change still land on it.
export const Route = createFileRoute("/empleos")({
  beforeLoad: () => {
    throw redirect({ to: "/", code: 301 });
  },
});
