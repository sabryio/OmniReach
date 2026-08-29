import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { locales, type Locale } from "@/paraglide/runtime";

export const Route = createFileRoute("/$locale")({
  beforeLoad: ({ params }) => {
    const locale = params.locale as Locale;

    // Validate locale and redirect to default if invalid
    if (!locales.includes(locale)) {
      throw redirect({
        to: "/$locale",
        params: { locale: "en" },
      });
    }
  },
  component: LocaleLayout,
});

function LocaleLayout() {
  const { locale } = Route.useParams();
  return <Outlet key={locale} />;
}
