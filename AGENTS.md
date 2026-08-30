# OmniReach — Agent Rules

## Styling

### Rule: Match mockup exactly — text, layout, and styling

When implementing components, **EXACTLY MATCH** the mockup's text content, layout structure, and visual styling. This ensures design consistency and proper behavior.

#### Text & Content

- Use the **exact text strings** from the mockup (e.g., "Broadcast & Compliance Operations", not "Broadcast Dashboard")
- Copy UI labels, button text, status messages, and placeholders character-for-character
- Maintain the mockup's information hierarchy and content grouping
- For now, hardcode English text directly (i18n will be added via Paraglide in Phase 3)

#### Layout & Structure

- Match the mockup's grid layouts, spacing, and component positioning precisely
- Preserve panel arrangements (e.g., 3-column dashboard: campaigns+queue left 2 cols, sessions right 1 col)
- Use the same icon placements, badge positions, and visual groupings
- Keep consistent sizing for cards, buttons, inputs, and other UI elements

#### Styling Rule: Use shadcn CSS variables via Tailwind utilities only

**NEVER** use hardcoded colors, hex values, rgb/hsl values, or custom semantic
class names (e.g. `bg-card-theme`, `text-main`, `text-sub`, `bg-accent-subtle`,
`text-accent-main`, `border-theme`) in any component.

**ALWAYS** use the standard Tailwind utility classes that are backed by the
shadcn CSS variables defined in `src/styles.css` via the `@theme inline` block.

This means translating the mockup's visual intent into proper shadcn variables:

- Mockup uses `bg-card-theme` → Use `bg-card`
- Mockup uses `text-main` → Use `text-foreground`
- Mockup uses `text-sub` → Use `text-muted-foreground`
- Mockup uses `bg-accent-subtle` → Use `bg-primary/10`
- Mockup uses custom colors → Map to shadcn semantic tokens

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

#### Visual Polish Guidelines

When implementing from the mockup:

- **Shadows**: Use `shadow-sm`, `shadow-md` appropriately for depth hierarchy
- **Rounded corners**: Maintain consistent `rounded-xl`, `rounded-lg` radius from mockup
- **Spacing**: Preserve the mockup's `gap-*` and `space-y-*` rhythm
- **Transitions**: Add `transition-colors`, `transition-all` for interactive elements
- **Hover states**: Include `hover:` variants for clickable elements (buttons, rows, links)
- **Font weights**: Match `font-bold`, `font-semibold`, `font-medium` exactly
- **Font sizes**: Use the mockup's text scale (`text-xs`, `text-sm`, `text-lg`, etc.)
- **Icon sizing**: Keep icon sizes consistent (`w-3.5 h-3.5`, `w-4 h-4`, `w-5 h-5`)
- **Responsive**: Preserve breakpoints (`sm:`, `md:`, `lg:`) for mobile/tablet/desktop layouts

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

---

## Architecture

### Rule: Separation of Presentation and Data Logic

All features follow a strict **presentational component + data hook** pattern:

#### Components (`.tsx` files)

- **Purely presentational** — receive all state and callbacks as props
- **No `useState`, `useEffect`, or data fetching** inside component files
- Focus only on rendering UI and handling user interactions
- All event handlers call callbacks passed as props

#### Hooks (`.ts` files)

- **All state management** — `useState`, `useMemo`, `useCallback`
- **All business logic** — filtering, searching, sorting, calculations
- **All side effects** — API calls, localStorage, timers
- Return computed values and handler functions
- Hooks are composable and testable in isolation

#### Example Pattern

```tsx
// ❌ BAD — Component manages its own state
export function CampaignsList({ campaigns }: Props) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const filtered = campaigns.filter(
    (c) =>
      c.title.includes(search) && (filter === "all" || c.status === filter),
  );

  return <div>...</div>;
}

// ✅ GOOD — Component is purely presentational
export function CampaignsList({
  campaigns,
  search,
  setSearch,
  filter,
  setFilter,
  filteredCampaigns,
}: Props) {
  return <div>...</div>;
}

// Hook manages all state
export function useCampaignsList(campaigns: Campaign[]) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const filteredCampaigns = useMemo(
    () =>
      campaigns.filter(
        (c) =>
          c.title.includes(search) && (filter === "all" || c.status === filter),
      ),
    [campaigns, search, filter],
  );

  return { search, setSearch, filter, setFilter, filteredCampaigns };
}
```

### Rule: Data flows from route level downward

**All application data originates in `frontend/src/routes/$locale/index.tsx`:**

1. **Route owns all mock data** — imports from `@/mock-data`
2. **Route owns global state** — campaigns, queue, sessions, logs, config, scheduler
3. **Route passes data down** to feature components via props
4. **Components call hooks** with the data they receive
5. **Hooks return derived state** and handlers back to components

This pattern makes it trivial to replace mock data with real API calls later:

- Change only the route file to fetch from backend
- All components and hooks remain unchanged
- No refactoring of feature code needed

#### Data Flow Diagram

```
routes/$locale/index.tsx
  ├─ useState(MOCK_CAMPAIGNS)  ← Mock data here
  ├─ useState(MOCK_QUEUE)
  ├─ useState(MOCK_SESSIONS)
  └─ Passes props down ↓

<CampaignsList campaigns={campaigns} queue={queue} ... />
  ├─ const { filtered, ... } = useCampaignsList(campaigns, queue)  ← Hook here
  └─ Renders with hook results

// Later: Real backend
routes/$locale/index.tsx
  ├─ const { data: campaigns } = useQuery('/api/campaigns')  ← Just change this
  ├─ const { data: queue } = useQuery('/api/queue')
  └─ Passes props down (components unchanged!)
```

### Rule: No DEFAULT data in hooks or components

**Never initialize data inside hooks or components.**

```tsx
// ❌ BAD — Hook owns default data
export function useTemplates() {
  const [templates, setTemplates] = useState(DEFAULT_TEMPLATES); // ❌ Wrong
  return { templates, setTemplates };
}

// ✅ GOOD — Hook receives data as parameter
export function useTemplateManager(initialTemplates: MessageTemplate[]) {
  const [templates, setTemplates] = useState(initialTemplates); // ✅ Correct
  return { templates, setTemplates };
}

// Route decides the data source
function App() {
  const templates = MOCK_TEMPLATES; // or fetch from API
  const hook = useTemplateManager(templates);
  return <TemplatesView {...hook} />;
}
```

**Exception:** Constants that are truly configuration (not data) may live in hooks:

- UI constants: `TABS = ['queue', 'logs']`
- Filter options: `STATUS_FILTERS = ['all', 'sent', 'failed']`
- Default form values: `DEFAULT_PHONE_PREFIX = '+966'`

### Available Hooks

Each feature exports these comprehensive hooks:

| Feature   | Hook Name             | Purpose                                    |
| --------- | --------------------- | ------------------------------------------ |
| Queue     | `useQueueAndLogs`     | Tabs, filters, search, modal state         |
| Campaigns | `useCampaignsList`    | View tabs, selection, contact filtering    |
| Campaigns | `useCampaignWizard`   | Wizard steps, form state                   |
| Templates | `useTemplateManager`  | CRUD, filters, editor modal, image upload  |
| Customers | `useCustomerManager`  | Filters, selection, verification, export   |
| Sessions  | `useSessionDashboard` | Quota calculation, verification testing    |
| Reports   | `useReportsManager`   | Date range, metrics, export formats        |
| Modals    | `useModals`           | Modal visibility (settings/verifier/about) |
| Modals    | `useSettings`         | Settings form, theme, scheduler debug      |
| Modals    | `useQuickVerifier`    | Phone verification state                   |
| Layout    | `useLayout`           | Tab navigation, sidebar, theme, compact    |

All hooks are exported from their feature's `index.ts` barrel file.

---

## Backend

### Rule: Vertical crate architecture — four layers, no upward dependencies

The backend workspace lives in `backend/` and consists of four library crates
plus one binary. The dependency graph is strictly top-down:

```
core   (no workspace deps — pure domain, zero I/O)
store  ← core
glue   ← core
server ← core + store + glue
binary (apps/omnireach) ← all four
```

**Never add an upward dependency.** `core` must never depend on `store`,
`glue`, or `server`. Violations are caught by `cargo check` as compile errors.

#### crates/core

- Pure domain types and business logic
- No `tokio`, no `sqlx`, no `reqwest`, no `axum`
- `quota.rs` — rolling-window rate-limit calculator (unit tested)
- `renderer.rs` — merge-tag template substitution `{{name}}` (unit tested)
- `types/` — canonical structs for `Campaign`, `QueueItem`, `Session`, `Contact`, `LogEntry`, `AppSettings`

#### crates/store

- SQLite persistence via `sqlx`
- One module per aggregate: `campaigns`, `contacts`, `queue`, `sessions`, `logs`, `settings`
- Migration at `src/migrations/0001_initial.sql`
- All functions take `&Db` (newtype around `SqlitePool`) and return `Result<_, StoreError>`
- No HTTP, no business logic

#### crates/glue

- WABridge HTTP adapter — the only place that calls `http://localhost:7171`
- `WaBridgeClient` methods: `check_contact`, `send_text`, `send_image`, `upload_media`, `get_session`, `get_qr`
- Maps all WABridge error shapes to `GlueError` variants: `Unregistered`, `RateLimit`, `Timeout`, `Unauthorized`, `ServerError`
- No Axum, no SQLite

#### crates/server

- Axum handlers, SSE broadcaster, auth middleware, router
- Handlers are thin: extract → call store/glue → emit SSE → respond
- `state.rs` — `AppState` holds `Db`, `Arc<WaBridgeClient>`, `Arc<SseBroadcaster>`, `Arc<String>` (auth token)
- `sse.rs` — `SseBroadcaster` wraps `tokio::sync::broadcast::Sender<SseEvent>`
- `middleware.rs` — bearer token auth applied to all `/api` routes
- All routes registered in `router.rs`; the route table in `router.rs` is the authoritative list

### Rule: Handler return types must be concrete, not `impl IntoResponse`

Always use a concrete response type in handler signatures so Rust can infer the
type when the body contains only `todo!()`:

```rust
// ❌ BAD — Rust cannot infer type when body is todo!()
pub async fn list(...) -> Result<impl IntoResponse, ApiError> {
    todo!("...")
}

// ✅ GOOD — concrete type compiles even with todo!() body
pub async fn list(...) -> Result<Json<serde_json::Value>, ApiError> {
    todo!("...")
}
```

### Rule: All env vars must be in `.env.example`

Every `std::env::var("KEY")` call in `backend/apps/omnireach/src/main.rs`
must have a matching entry in `backend/.env.example`. The two are the
canonical source of truth; the README derives from them.

Current variables: `OMNIREACH_ADDR`, `OMNIREACH_TOKEN`, `DATABASE_URL`,
`WABRIDGE_BASE_URL`, `WABRIDGE_TIMEOUT_MS`, `RUST_LOG`.

---
