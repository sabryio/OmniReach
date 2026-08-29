# OmniReach — Agent Rules

## Styling

### Rule: Use shadcn CSS variables via Tailwind utilities only

**NEVER** use hardcoded colors, hex values, rgb/hsl values, or custom semantic
class names (e.g. `bg-card-theme`, `text-main`, `text-sub`, `bg-accent-subtle`,
`text-accent-main`, `border-theme`) in any component.

**ALWAYS** use the standard Tailwind utility classes that are backed by the
shadcn CSS variables defined in `src/styles.css` via the `@theme inline` block.

#### Mapping reference

| Intent                           | Correct class                               |
| -------------------------------- | ------------------------------------------- |
| Page background                  | `bg-background`                             |
| Card / panel surface             | `bg-card`                                   |
| Subtle surface (one step darker) | `bg-muted`                                  |
| Hover surface                    | `hover:bg-muted/50` or `hover:bg-secondary` |
| Primary action background        | `bg-primary`                                |
| Primary action text              | `text-primary-foreground`                   |
| Accent tint background           | `bg-primary/10`                             |
| Main text                        | `text-foreground`                           |
| Secondary / label text           | `text-muted-foreground`                     |
| Accent / link text               | `text-primary`                              |
| Standard border                  | `border-border`                             |
| Subtle border                    | `border-border/50`                          |
| Accent border                    | `border-primary/20`                         |
| Success color                    | `text-success` / `bg-success`               |
| Warning color                    | `text-warning` / `bg-warning`               |
| Destructive color                | `text-destructive` / `bg-destructive`       |
| Sidebar background               | `bg-sidebar`                                |
| Sidebar text                     | `text-sidebar-foreground`                   |
| Sidebar border                   | `border-sidebar-border`                     |

#### Alpha tints

Use Tailwind's `/opacity` syntax to create tints from the base variable:

```
bg-primary/10     → accent tint background
bg-success/15     → success tint background
bg-warning/20     → warning tint background
border-primary/30 → accent tint border
text-success      → success text (from --color-success)
```

#### What NOT to do

```tsx
// ❌ hardcoded hex
<div className="bg-[#0a0a0a] text-[#f3f4f6]">

// ❌ custom semantic classes from old mockup
<div className="bg-card-theme border-theme text-main text-sub">

// ❌ inline style with raw color
<div style={{ backgroundColor: '#141414' }}>
```

#### What TO do

```tsx
// ✅ shadcn variables via Tailwind
<div className="bg-card border border-border text-foreground">
<p className="text-muted-foreground text-xs">...</p>
<button className="bg-primary text-primary-foreground hover:bg-primary/90">
<span className="text-success bg-success/10 border border-success/30">
```

---

## Components

### Rule: Feature-based folder structure

Every component lives under `src/features/<feature>/components/<Name>.tsx`.
Every hook lives under `src/features/<feature>/hooks/use<Name>.ts`.
Each feature exports everything through `src/features/<feature>/index.ts`.

No components or hooks in `src/components/` (reserved for truly shared,
feature-agnostic UI primitives only).

---

## Internationalization

### Rule: Use Paraglide for all user-facing strings

This project uses **Paraglide JS** (`@inlang/paraglide-js`) for i18n.

- Import message functions from `@/paraglide/messages`: `import { m } from '@/paraglide/messages'`
- Call them as functions: `{m.welcome_title()}` or `{m.edit_instruction({ code: 'foo' })}`
- Add new message keys to **both** `messages/en.json` and `messages/ar-EG.json`
- Never use `t('key')` — that is the old mockup pattern and does not exist here
- Hardcoded English strings are only acceptable as temporary placeholders marked with `// TODO: i18n`

#### Example

```tsx
// ✅ correct
import { m } from '@/paraglide/messages'
<h1>{m.welcome_title()}</h1>
<p>{m.edit_instruction({ code: 'src/routes/$locale/index.tsx' })}</p>

// ❌ wrong — t() does not exist
import { useThemeLanguage } from '@/context/ThemeLanguageContext'
const { t } = useThemeLanguage()
<h1>{t('welcome_title')}</h1>
```

#### Locale routing

The active locale is determined by the URL prefix (`/en/`, `/ar-EG/`).
The `$locale` route parameter is set by TanStack Router and Paraglide's
URL strategy reads from `window.location` automatically — no manual
`setLocale()` call is needed in components.

#### Adding a new message key

1. Add the key + English value to `messages/en.json`
2. Add the key + Arabic value to `messages/ar-EG.json`
3. Restart the dev server so Paraglide regenerates `src/paraglide/messages.js`
4. Import and use `m.your_new_key()` in the component

---

## Types

### Rule: Import from `@/types`

All shared types (`Campaign`, `QueueItem`, `WABridgeSession`, etc.) are
imported from `@/types`. Never redefine types locally if they already exist
in the shared types file.

---

## Services

### Rule: No direct API calls in components

Components never call fetch/axios/WABridgeService directly. All side effects
go through hooks. Hooks call services in `src/services/`.
