// Locale switcher refs:
// - Paraglide docs: https://inlang.com/m/gerre34r/library-inlang-paraglideJs
// - Router example: https://github.com/TanStack/router/tree/main/examples/react/i18n-paraglide#switching-locale
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { getLocale, locales } from "@/paraglide/runtime";
import { m } from "@/paraglide/messages";

export default function ParaglideLocaleSwitcher() {
  const currentLocale = getLocale();
  const navigate = useNavigate();
  const routerState = useRouterState();

  const handleLocaleChange = (newLocale: string) => {
    // Get the current path without the locale prefix
    const currentPath = routerState.location.pathname;
    // Match any locale pattern (en, ar-EG, etc.) - strip everything after first segment
    const pathWithoutLocale = currentPath.replace(/^\/[^/]+(\/|$)/, "/");

    // Navigate to the same path but with new locale
    navigate({
      to: "/$locale" + (pathWithoutLocale === "/" ? "" : pathWithoutLocale),
      params: { locale: newLocale },
    });
  };

  return (
    <div
      style={{
        display: "flex",
        gap: "0.5rem",
        alignItems: "center",
        color: "inherit",
      }}
      aria-label={m.language_label()}
    >
      <span style={{ opacity: 0.85 }}>
        {m.current_locale({ locale: currentLocale })}
      </span>
      <div style={{ display: "flex", gap: "0.25rem" }}>
        {locales.map((locale) => (
          <button
            key={locale}
            onClick={() => handleLocaleChange(locale)}
            aria-pressed={locale === currentLocale}
            style={{
              cursor: "pointer",
              padding: "0.35rem 0.75rem",
              borderRadius: "999px",
              border: "1px solid #d1d5db",
              background: locale === currentLocale ? "#0f172a" : "transparent",
              color: locale === currentLocale ? "#f8fafc" : "inherit",
              fontWeight: locale === currentLocale ? 700 : 500,
              letterSpacing: "0.01em",
            }}
          >
            {locale.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
}
