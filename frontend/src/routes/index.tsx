import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    // Redirect root path to default locale
    throw redirect({
      to: "/$locale",
      params: { locale: "en" },
    });
  },
});
