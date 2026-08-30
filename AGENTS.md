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

### Rule: Use Zod schemas as single source of truth

**Never define TypeScript types manually.** All domain types must be defined as **Zod schemas** and TypeScript types inferred from them.

#### Structure

Every feature must have a `schemas/` folder:

```
features/<feature>/
  schemas/
    <feature>.schema.ts   ← Zod schemas + inferred types
```

#### Pattern

```typescript
// ✅ CORRECT — Zod schema with inferred type
import { z } from "zod";

export const sessionSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  status: z.enum(["connected", "disconnected", "qr_required", "connecting"]),
  hourlyLimit: z.number().int().nonnegative(),
  hourlySentTimestamps: z.array(z.number().int()),
});

// Infer TypeScript type from schema
export type Session = z.infer<typeof sessionSchema>;

// ❌ WRONG — Manual TypeScript interface
export interface Session {
  id: string;
  name: string;
  status: "connected" | "disconnected" | "qr_required" | "connecting";
  hourlyLimit: number;
  hourlySentTimestamps: number[];
}
```

#### Runtime Validation in API Calls

**Always parse API responses with Zod schemas:**

```typescript
// ✅ CORRECT — Runtime validation
export async function getSessions(): Promise<Session[]> {
  const response = await fetch(`${config.apiBaseUrl}/api/sessions`);
  if (!response.ok) throw new Error(response.statusText);

  const data = await response.json();

  // Throws ZodError if response shape doesn't match schema
  return sessionsSchema.parse(data);
}

// ❌ WRONG — No validation, assumes correct shape
export async function getSessions(): Promise<Session[]> {
  const response = await fetch(`${config.apiBaseUrl}/api/sessions`);
  return response.json();
}
```

#### Benefits

- **Runtime type safety** — Catches backend/frontend type mismatches immediately
- **Single source of truth** — No manual sync between Rust types and TypeScript types
- **Better error messages** — Zod provides detailed validation errors
- **Input validation** — Validate request bodies before sending to backend

#### Shared Types

For types used across multiple features (e.g., `ThemeMode`, `Language`), keep them in `@/types.ts` but consider migrating to shared Zod schemas over time.

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

---

## Frontend API Layer & Data Fetching

### Rule: TanStack Query + File-Based Routing Architecture

The frontend uses **TanStack Query** for server state management and **TanStack Router** for file-based routing. Each feature follows a strict three-layer pattern: API functions → Query/Mutation hooks → Route components.

#### Per-Feature Structure

Every feature **must** have this exact folder structure:

```
features/<feature>/
  api/
    queryKeys.ts           ← Query key constants
    <feature>.api.ts       ← API functions (return mocks for now)
  hooks/
    use<Feature>.ts        ← Query hooks (GET operations)
    use<Feature>Mutations.ts  ← Mutation hooks (POST/PATCH/DELETE)
    use<Feature>List.ts    ← UI state hooks (filters, selection) — existing
  components/
    <Feature>View.tsx      ← Presentational components
  index.ts                 ← Barrel export (api, hooks, components)
```

#### Layer 1: API Functions (Pure Data Fetching)

**Location:** `features/<feature>/api/<feature>.api.ts`

**Rules:**

- Return mocks from `@/mock-data` initially (Phase 1)
- Return domain types directly — **no wrapper objects**
- Use DTO objects for mutations with multiple params
- Use `Partial<T>` for flexible updates
- Add `// TODO: Phase 2 — await fetch(...)` comments for HTTP integration

**Pattern:**

```typescript
// features/sessions/api/sessions.api.ts
import type { WABridgeSession } from "@/types";
import { MOCK_SESSIONS } from "@/mock-data";

// ─── Queries ─────────────────────────────────────────────────────────────────

export async function getSessions(): Promise<WABridgeSession[]> {
  // TODO: Phase 2 — await fetch(`${API_BASE_URL}/api/sessions`)
  return MOCK_SESSIONS;
}

export async function getSession(id: string): Promise<WABridgeSession> {
  const session = MOCK_SESSIONS.find((s) => s.id === id);
  if (!session) throw new Error(`Session ${id} not found`);
  return session;
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export type CreateSessionParams = {
  id: string;
  accountName: string;
};

export async function createSession(
  params: CreateSessionParams,
): Promise<WABridgeSession> {
  // TODO: Phase 2 — await fetch(`${API_BASE_URL}/api/sessions`, { method: 'POST', ... })
  const newSession: WABridgeSession = {
    id: params.id,
    accountName: params.accountName,
    isConnected: false,
    messagesSentLast24h: 0,
    limitLast24h: 1000,
    sessionCreatedAt: new Date().toISOString(),
    lastSeenAt: null,
  };
  return newSession;
}

export async function deleteSession(id: string): Promise<void> {
  // TODO: Phase 2 — await fetch(`${API_BASE_URL}/api/sessions/${id}`, { method: 'DELETE' })
  return;
}
```

#### Layer 2: Query Keys (Hierarchical Cache Management)

**Location:** `features/<feature>/api/queryKeys.ts`

**Pattern:** Functional composition with `const base` for hierarchical invalidation.

```typescript
// features/sessions/api/queryKeys.ts
const base = ["sessions"] as const;

export const SessionQueryKeys = {
  all: base,
  lists: () => [...base, "list"] as const,
  list: (filters?: SessionFilters) => [...base, "list", filters] as const,
  details: () => [...base, "detail"] as const,
  detail: (id: string) => [...base, "detail", id] as const,
} as const;
```

**Invalidation examples:**

```typescript
// Invalidate ALL session queries
queryClient.invalidateQueries({ queryKey: SessionQueryKeys.all });

// Invalidate all list queries (but not details)
queryClient.invalidateQueries({ queryKey: SessionQueryKeys.lists() });

// Invalidate specific detail
queryClient.invalidateQueries({
  queryKey: SessionQueryKeys.detail("session-123"),
});
```

#### Layer 3: Query Hooks (TanStack Query Wrappers)

**Location:** `features/<feature>/hooks/use<Feature>.ts`

**Rules:**

- Import query keys from `../api/queryKeys`
- Import API functions from `../api/<feature>.api`
- Return **named exports with defaults** (e.g., `sessions: data ?? []`)
- Use semantic boolean names (`isLoading`, `isFetching`, not generic `loading`)

**Pattern:**

```typescript
// features/sessions/hooks/useSessions.ts
import { useQuery } from "@tanstack/react-query";
import { SessionQueryKeys } from "../api/queryKeys";
import { getSessions, getSession } from "../api/sessions.api";
import type { WABridgeSession } from "@/types";

export function useSessions() {
  const query = useQuery({
    queryKey: SessionQueryKeys.lists(),
    queryFn: getSessions,
  });

  return {
    sessions: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useSession(id: string) {
  const query = useQuery({
    queryKey: SessionQueryKeys.detail(id),
    queryFn: () => getSession(id),
    enabled: !!id,
  });

  return {
    session: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
```

#### Layer 4: Mutation Hooks (With Cache Invalidation)

**Location:** `features/<feature>/hooks/use<Feature>Mutations.ts`

**Rules:**

- Use `useMutation` from TanStack Query
- **ALWAYS** invalidate queries in `onSuccess` callback
- Use semantic names: `isCreating`, `isUpdating`, `isDeleting` (not just `isPending`)
- Return both `mutate` and `mutateAsync` for flexibility
- Include `reset()` for clearing errors

**Pattern:**

```typescript
// features/sessions/hooks/useSessionMutations.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { SessionQueryKeys } from "../api/queryKeys";
import { createSession, deleteSession } from "../api/sessions.api";
import type { CreateSessionParams } from "../api/sessions.api";

export function useCreateSession() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SessionQueryKeys.all });
    },
  });

  return {
    createSession: mutation.mutate,
    createSessionAsync: mutation.mutateAsync,
    isCreating: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
}

export function useDeleteSession() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: deleteSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SessionQueryKeys.all });
    },
  });

  return {
    deleteSession: mutation.mutate,
    deleteSessionAsync: mutation.mutateAsync,
    isDeleting: mutation.isPending,
    error: mutation.error,
  };
}
```

**Cross-feature invalidation:**
When a mutation affects multiple features, invalidate all related query keys:

```typescript
// Example: Creating a campaign invalidates campaigns + queue + dashboard
export function useCreateCampaign() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createCampaign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CampaignQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: QueueQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: DashboardQueryKeys.all });
    },
  });

  return {
    createCampaign: mutation.mutate,
    createCampaignAsync: mutation.mutateAsync,
    isCreating: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
}
```

#### Layer 5: Route Components (Data Owners)

**Location:** `routes/$locale/<feature>.tsx`

**Rules:**

- Each route **owns** its data fetching via hooks
- Route component calls hooks and passes data to presentational components
- **No direct mock imports** in route files — use hooks only
- Handle loading states explicitly
- Use TanStack Router's `loader` for prefetching (optional)

**Pattern:**

```typescript
// routes/$locale/sessions.tsx
import { createFileRoute } from '@tanstack/react-router';
import { SessionsDashboard } from '@/features/sessions';
import { useSessions, useSessionMutations } from '@/features/sessions';

export const Route = createFileRoute('/$locale/sessions')({
  component: SessionsRoute,
});

function SessionsRoute() {
  const { sessions, isLoading } = useSessions();
  const { deleteSession } = useSessionMutations();

  if (isLoading) {
    return <div className="p-5">Loading sessions...</div>;
  }

  return (
    <SessionsDashboard
      sessions={sessions}
      onDeleteSession={deleteSession}
    />
  );
}
```

**With prefetching (optional):**

```typescript
import { SessionQueryKeys } from "@/features/sessions/api/queryKeys";
import { getSessions } from "@/features/sessions/api/sessions.api";

export const Route = createFileRoute("/$locale/sessions")({
  loader: ({ context }) => {
    return context.queryClient.ensureQueryData({
      queryKey: SessionQueryKeys.lists(),
      queryFn: getSessions,
    });
  },
  component: SessionsRoute,
});
```

#### Shared Layout Structure

**Location:** `routes/$locale/route.tsx`

The shared layout contains the app shell (title bar, menu, sidebar, footer) and renders child routes via `<Outlet />`:

```typescript
// routes/$locale/route.tsx
import { Outlet, createFileRoute } from '@tanstack/react-router';
import { WindowsTitleBar, WindowsMenuBar, WindowsSidebar, AppFooter } from '@/features/layout';
import { useLayout } from '@/features/layout';

export const Route = createFileRoute('/$locale')({
  component: SharedLayout,
});

function SharedLayout() {
  const { locale } = Route.useParams();
  const layout = useLayout();

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-background text-foreground antialiased">
      <WindowsTitleBar />
      <WindowsMenuBar />

      <div className="flex-1 flex overflow-hidden">
        <WindowsSidebar />
        <main className="flex-1 overflow-y-auto bg-background p-5">
          <Outlet key={locale} />
        </main>
      </div>

      <AppFooter />
    </div>
  );
}
```

#### Navigation

**Use TanStack Router's `<Link>` and `navigate()` — NOT manual state management:**

```typescript
// ✅ CORRECT — TanStack Router Link
import { Link } from '@tanstack/react-router';

<Link
  to="/$locale/sessions"
  params={{ locale }}
  activeProps={{ className: "bg-primary/10" }}
>
  Sessions
</Link>

// ✅ CORRECT — Programmatic navigation
import { useNavigate } from '@tanstack/react-router';

const navigate = useNavigate();
const { locale } = useParams({ from: '/$locale' });
navigate({ to: '/$locale/campaigns', params: { locale } });

// ❌ WRONG — Manual activeTab state (DO NOT USE)
const [activeTab, setActiveTab] = useState('dashboard');
<button onClick={() => setActiveTab('campaigns')}>Campaigns</button>
```

#### UI State Hooks (Separate from Data Hooks)

**Existing UI state hooks remain unchanged** and are composed **explicitly** with data hooks:

```typescript
// Existing: features/campaigns/hooks/useCampaignsList.ts
export function useCampaignsList(campaigns: Campaign[]) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'running' | 'paused'>('all');

  const filtered = useMemo(
    () => campaigns.filter(c =>
      c.title.includes(search) &&
      (filter === 'all' || c.status === filter)
    ),
    [campaigns, search, filter]
  );

  return { search, setSearch, filter, setFilter, filteredCampaigns: filtered };
}

// Usage in route component:
function CampaignsRoute() {
  const { campaigns } = useCampaigns();           // ← Data hook
  const uiState = useCampaignsList(campaigns);    // ← UI state hook

  return <CampaignsList campaigns={uiState.filteredCampaigns} {...uiState} />;
}
```

**DO NOT merge data and UI hooks** — keep them separate for testability.

#### TanStack Query Provider Setup

**Location:** `routes/__root.tsx`

```typescript
import { Outlet, createRootRoute } from '@tanstack/react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '@/lib/query-client';

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <ReactQueryDevtools position="bottom-right" />
    </QueryClientProvider>
  );
}
```

**Query client configuration** (`src/lib/query-client.ts`):

```typescript
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
```

#### Mock Data Consolidation

**All mock data lives in `frontend/src/mock-data/`** — features NEVER import mocks directly:

```typescript
// ✅ CORRECT — API layer imports mocks
// features/sessions/api/sessions.api.ts
import { MOCK_SESSIONS } from '@/mock-data';

export async function getSessions(): Promise<WABridgeSession[]> {
  return MOCK_SESSIONS;
}

// ❌ WRONG — Component imports mocks (DO NOT DO THIS)
// features/sessions/components/SessionsDashboard.tsx
import { MOCK_SESSIONS } from '@/mock-data';  // ❌ Never import in components

function SessionsDashboard() {
  return <div>{MOCK_SESSIONS.map(...)}</div>;  // ❌ Wrong pattern
}
```

**Why:** Mock data serves as the **contract** between frontend and backend. Backend will return the same mocks initially to verify type parity before real implementation.

#### What NOT to Do

```typescript
// ❌ WRONG — useState for server data in route
function CampaignsRoute() {
  const [campaigns, setCampaigns] = useState<Campaign[]>(MOCK_CAMPAIGNS);
  return <CampaignsList campaigns={campaigns} />;
}

// ❌ WRONG — Direct mock imports in components
import { MOCK_CAMPAIGNS } from '@/mock-data';
function CampaignsList() {
  return <div>{MOCK_CAMPAIGNS.map(...)}</div>;
}

// ❌ WRONG — setQueryData for cache updates (use invalidateQueries)
queryClient.setQueryData(CampaignQueryKeys.all, newCampaigns);

// ❌ WRONG — Wrapper response types
export async function getCampaigns(): Promise<{ data: Campaign[] }> {
  return { data: MOCK_CAMPAIGNS };  // Don't wrap — return direct types
}

// ❌ WRONG — Merged data + UI hooks
export function useCampaigns() {
  const query = useQuery(...);
  const [search, setSearch] = useState('');  // Don't mix
  return { campaigns: query.data, search, setSearch };
}
```

#### What TO Do

```typescript
// ✅ CORRECT — TanStack Query in route
function CampaignsRoute() {
  const { campaigns } = useCampaigns();
  return <CampaignsList campaigns={campaigns} />;
}

// ✅ CORRECT — API layer imports mocks
export async function getCampaigns(): Promise<Campaign[]> {
  return MOCK_CAMPAIGNS;
}

// ✅ CORRECT — invalidateQueries for cache updates
queryClient.invalidateQueries({ queryKey: CampaignQueryKeys.all });

// ✅ CORRECT — Direct domain types
export async function getCampaigns(): Promise<Campaign[]> {
  return MOCK_CAMPAIGNS;
}

// ✅ CORRECT — Separate data and UI hooks
const { campaigns } = useCampaigns();           // Data
const uiState = useCampaignsList(campaigns);    // UI state
```

#### Key Principles

1. **TanStack Query cache is the single source of truth** — not route `useState`
2. **Each route owns its data** — fetches via hooks, passes to components
3. **Components are purely presentational** — receive data as props, no data fetching
4. **API layer is the only mock consumer** — components never import mocks
5. **Use `invalidateQueries`, not `setQueryData`** — let TanStack Query refetch
6. **Hierarchical query keys** — enables partial invalidation (all/lists/detail)
7. **Explicit composition** — data hooks + UI hooks stay separate, composed in route

#### Migration Checklist Reference

For detailed per-feature migration steps, see:

- **12-phase checklist:** `.ai/wayfinder/migration-checklist-template.md`
- **Feature audit:** `.ai/wayfinder/feature-coverage-audit.md`
- **79-task roadmap:** `.ai/blueprints/001-frontend-api-layer-migration-2026-08-30-tasks.md`

**Implementation order:**

1. Foundation (TanStack Query setup, shared layout)
2. Sessions (pilot — validates pattern)
3. Templates, Customers, Campaigns, Queue, Dashboard, Reports, Settings

**Success validation:** TypeScript compiles (`bunx tsc --noEmit`), all features render, CRUD operations work with mocks, TanStack Query devtools shows queries, cache invalidation works.
