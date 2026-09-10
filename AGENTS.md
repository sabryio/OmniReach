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

### Rule: Use RPC-generated types for backend data, Zod only for UI-specific types

**Backend types come from Rust via RPC bindings** — never manually define TypeScript types for data that exists in the backend.

#### Backend Types (From RPC Bindings)

All types representing backend data are automatically generated in `frontend/src/rpc/bindings.ts`:

```typescript
// ✅ CORRECT — Import from RPC bindings
import type {
  Campaign,
  Session,
  Template,
  Contact,
  QueueItem,
} from "@/rpc/bindings";

// These types mirror Rust structs exactly — you NEVER write them manually
```

**How backend types are generated:**

1. Rust defines types in `backend/crates/core/src/types/`
2. Types are used in `#[rorpc]` handler signatures
3. Build generates TypeScript equivalents in `frontend/src/rpc/bindings.ts`
4. Frontend imports and uses them

#### UI-Only Types (Zod Schemas)

**Only use Zod schemas for types that DON'T exist in the backend:**

```
features/<feature>/
  schemas/
    <feature>.schema.ts   ← UI-only types (theme, UI state, computed values)
```

**Examples of UI-only types:**

```typescript
// features/layout/schemas/layout.schema.ts
import { z } from "zod";

// ThemeMode — UI preference, not stored in backend
export const themeModeSchema = z.enum(["light", "dark", "system"]);
export type ThemeMode = z.infer<typeof themeModeSchema>;

// SchedulerState — runtime scheduler state, not persisted
export const schedulerStateSchema = z.object({
  isRunning: z.boolean(),
  isProcessingTick: z.boolean(),
  isWithinTimeWindow: z.boolean(),
  timeWindowText: z.string(),
  currentLocalTimeStr: z.string(),
  activeSendingCount: z.number(),
  totalQueuePending: z.number(),
  totalQueueHeld: z.number(),
  strictTimeWindow: z.boolean(),
  customWindowStartHour: z.number(),
  customWindowEndHour: z.number(),
  simulatedHourOffset: z.number(),
});
export type SchedulerState = z.infer<typeof schedulerStateSchema>;

// CSVParseResult — frontend-only CSV parsing result
export const csvParseResultSchema = z.object({
  contacts: z.array(
    z.object({
      phone: z.string(),
      name: z.string().optional(),
      // ...
    }),
  ),
  errors: z.array(z.string()),
});
export type CSVParseResult = z.infer<typeof csvParseResultSchema>;
```

#### Computed Types (Inline Definitions)

**Computed types derived from backend data** should be defined inline where they're computed:

```typescript
// features/dashboard/hooks/useDashboard.ts

// ✅ CORRECT — Computed type lives with its computation logic
export interface SessionRateQuota {
  hourlyUsed: number;
  dailyUsed: number;
  // Computed from Session.hourly_sent_timestamps and Session.daily_sent_timestamps
}

export function useDashboard({ sessions, ... }: Props) {
  const sessionQuotas: Record<string, SessionRateQuota> = useMemo(() => {
    const result: Record<string, SessionRateQuota> = {};
    for (const session of sessions) {
      const now = Date.now();
      const oneHourAgo = now - 3600_000;
      const oneDayAgo = now - 86400_000;

      result[session.id] = {
        hourlyUsed: session.hourly_sent_timestamps.filter(t => t >= oneHourAgo).length,
        dailyUsed: session.daily_sent_timestamps.filter(t => t >= oneDayAgo).length,
      };
    }
    return result;
  }, [sessions]);

  return { sessionQuotas, ... };
}
```

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

### Rule: RORPC Type-Safe RPC + TanStack Query Architecture

The frontend uses **RORPC** for type-safe RPC communication with the Rust backend and **TanStack Query** for server state management. **All types, query keys, and mutation/query options are automatically generated from Rust backend code** at `frontend/src/rpc/bindings.ts`.

**Single source of truth:** The Rust backend defines all types and endpoints. Frontend TypeScript types are generated automatically — never manually define duplicated schemas or API functions.

#### Per-Feature Structure

Every feature follows this structure:

```
features/<feature>/
  hooks/
    use<Feature>Query.ts        ← Query hooks wrapping orpc (GET operations)
    use<Feature>Mutations.ts    ← Mutation hooks wrapping orpc (POST/PATCH/DELETE)
    use<Feature>List.ts         ← UI state hooks (filters, selection, local state)
  components/
    <Feature>View.tsx           ← Presentational components
  schemas/                      ← ONLY for UI-only types not in backend
    layout.schema.ts            ← Example: ThemeMode, SchedulerState (UI-only)
  index.ts                      ← Barrel export (hooks, components)
```

**What's NOT in features:**

- ❌ No `api/` directories (except `media/api` for multipart uploads)
- ❌ No `schemas/` for backend types (use `@/rpc/bindings` instead)
- ❌ No `queryKeys.ts` files (use `orpc.{resource}.{method}.queryKey()`)
- ❌ No manual API functions (use `orpc.{resource}.{method}.mutate()`)

#### Layer 1: RPC Bindings (Auto-Generated Types & Client)

**Location:** `frontend/src/rpc/bindings.ts` (generated from Rust backend)

**What it contains:**

- All TypeScript types mirroring Rust structs
- RPC client (`orpc`) with type-safe methods for every backend endpoint
- Query keys: `orpc.{resource}.{method}.queryKey()`
- Query options: `orpc.{resource}.{method}.queryOptions()`
- Mutation options: `orpc.{resource}.{method}.mutationOptions()`

**How types are generated:**

1. Rust backend defines types in `backend/crates/core/src/types/`
2. Rust handlers annotated with `#[rorpc::get("/api/...")]`, `#[rorpc::post("/api/...")]`, etc.
3. Build script generates `frontend/src/rpc/bindings.ts` with TypeScript equivalents
4. Frontend imports types from `@/rpc/bindings` — never manually define them

**Example usage:**

```typescript
// Import types from generated bindings
import type { Campaign, Session, Template } from "@/rpc/bindings";

// Import orpc client
import { orpc } from "@/rpc";

// Use in hooks (see Layer 2 below)
const query = useQuery(orpc.campaigns.list.queryOptions());
const mutation = useMutation(orpc.campaigns.create.mutationOptions({ ... }));
```

#### Layer 2: Query Hooks (TanStack Query Wrappers)

**Location:** `features/<feature>/hooks/use<Feature>Query.ts`

**Rules:**

- Use `orpc.{resource}.{method}.queryOptions()` for all queries
- Return **named exports with defaults** (e.g., `sessions: data ?? []`)
- Use semantic boolean names (`isLoading`, `isFetching`, not generic `loading`)
- **Never** use manual `queryKey` or `queryFn` — always use orpc-generated options

**Pattern:**

```typescript
// features/sessions/hooks/useSessionsQuery.ts
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/rpc";

export function useSessions() {
  const query = useQuery(orpc.sessions.list.queryOptions());

  return {
    sessions: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useSession(id: string) {
  const query = useQuery(
    orpc.sessions.getById.queryOptions({
      input: { id },
      enabled: !!id, // Can add TanStack Query options
    }),
  );

  return {
    session: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
```

**Why this pattern:**

- `orpc.sessions.list.queryOptions()` returns a complete query configuration
- Type-safe: TypeScript knows the exact return type from the Rust handler
- Query key is automatically managed by rorpc
- No manual fetch needed — rorpc handles HTTP communication

#### Layer 3: Mutation Hooks (With Cache Invalidation)

**Location:** `features/<feature>/hooks/use<Feature>Mutations.ts`

**Rules:**

- Use `orpc.{resource}.{method}.mutationOptions()` for all mutations
- **ALWAYS** invalidate queries in `onSuccess` callback using `orpc.{resource}.{method}.queryOptions()`
- Use semantic names: `isCreating`, `isUpdating`, `isDeleting` (not just `isPending`)
- Return both `mutate` and `mutateAsync` for flexibility
- Include `reset()` for clearing errors

**Pattern:**

```typescript
// features/sessions/hooks/useSessionMutations.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/rpc";

export function useCreateSession() {
  const queryClient = useQueryClient();

  const mutation = useMutation(
    orpc.sessions.create.mutationOptions({
      onSuccess: () => {
        // Invalidate using orpc-generated query options
        queryClient.invalidateQueries(orpc.sessions.list.queryOptions());
      },
    }),
  );

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

  const mutation = useMutation(
    orpc.sessions.destroy.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(orpc.sessions.list.queryOptions());
      },
    }),
  );

  return {
    deleteSession: mutation.mutate,
    deleteSessionAsync: mutation.mutateAsync,
    isDeleting: mutation.isPending,
    error: mutation.error,
  };
}

export function useUpdateSession() {
  const queryClient = useQueryClient();

  const mutation = useMutation(
    orpc.sessions.update.mutationOptions({
      onSuccess: (_, variables) => {
        // Invalidate specific detail
        queryClient.invalidateQueries(
          orpc.sessions.getById.queryOptions({ input: { id: variables.id } }),
        );
        // Invalidate list
        queryClient.invalidateQueries(orpc.sessions.list.queryOptions());
      },
    }),
  );

  return {
    updateSession: mutation.mutate,
    updateSessionAsync: mutation.mutateAsync,
    isUpdating: mutation.isPending,
    error: mutation.error,
  };
}
```

**Cross-feature invalidation:**
When a mutation affects multiple features, invalidate all related caches:

```typescript
export function useCreateCampaign() {
  const queryClient = useQueryClient();

  const mutation = useMutation(
    orpc.campaigns.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(orpc.campaigns.list.queryOptions());
        queryClient.invalidateQueries(
          orpc.queue.list.queryOptions({ input: { campaign_id: null } }),
        );
      },
    }),
  );

  return {
    createCampaign: mutation.mutate,
    createCampaignAsync: mutation.mutateAsync,
    isCreating: mutation.isPending,
    error: mutation.error,
  };
}
```

#### Layer 4: Route Components (Data Owners)

**Location:** `routes/$locale/<feature>.tsx`

**Rules:**

- Each route **owns** its data fetching via query/mutation hooks
- Route component calls hooks and passes data to presentational components
- Handle loading states explicitly
- Use TanStack Router's `loader` for prefetching (optional)

**Pattern:**

```typescript
// routes/$locale/sessions.tsx
import { createFileRoute } from '@tanstack/react-router';
import { SessionsDashboard } from '@/features/sessions';
import { useSessions } from '@/features/sessions/hooks/useSessionsQuery';
import {
  useSyncSession,
  useDeleteSession,
  useSendTestMessage,
} from '@/features/sessions/hooks/useSessionMutations';

export const Route = createFileRoute('/$locale/sessions')({
  component: SessionsRoute,
});

function SessionsRoute() {
  const { sessions, isLoading } = useSessions();
  const { syncSession } = useSyncSession();
  const { deleteSession } = useDeleteSession();
  const { sendTestMessageAsync } = useSendTestMessage();

  if (isLoading) {
    return <div className="p-5">Loading sessions...</div>;
  }

  return (
    <SessionsDashboard
      sessions={sessions}
      onSyncSession={(id) => syncSession({ id })}
      onDeleteSession={(id) => deleteSession({ id })}
      onSendTest={async (id, phone, message) =>
        sendTestMessageAsync({ id, phone, message })
      }
    />
  );
}
```

**With prefetching (optional):**

```typescript
import { orpc } from "@/rpc";

export const Route = createFileRoute("/$locale/sessions")({
  loader: ({ context }) => {
    return context.queryClient.ensureQueryData(
      orpc.sessions.list.queryOptions(),
    );
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

**UI state hooks manage local presentation state** and are composed **explicitly** with data hooks:

```typescript
// features/campaigns/hooks/useCampaignsList.ts — UI state only
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
  // Data layer — RPC query hook
  const { campaigns } = useCampaignsQuery();

  // UI state layer — receives data, manages filters
  const uiState = useCampaignsList(campaigns);

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

#### Exception: Media Upload (Not in RPC Bindings)

**Media upload uses multipart form data** and is not part of the RPC bindings:

```typescript
// features/media/api/media.api.ts — Manual API for file upload
export async function uploadMedia(
  file: File,
  mediaType: "image" | "video" | "document",
): Promise<MediaUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("media_type", mediaType);

  const response = await fetch(`${config.apiBaseUrl}/api/media/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${config.authToken}` },
    body: formData,
  });

  if (!response.ok) throw new Error(`Upload failed: ${await response.text()}`);
  return response.json();
}

// features/media/hooks/useMediaUpload.ts — Manual mutation
export function useMediaUpload() {
  const mutation = useMutation({
    mutationFn: ({ file, mediaType }) => uploadMedia(file, mediaType),
  });

  return {
    uploadMedia: mutation.mutate,
    uploadMediaAsync: mutation.mutateAsync,
    isUploading: mutation.isPending,
    error: mutation.error,
  };
}
```

This is the **only** acceptable manual API implementation — all other endpoints use RPC bindings.

#### What NOT to Do

```typescript
// ❌ WRONG — Manual API functions (use orpc instead)
export async function getCampaigns(): Promise<Campaign[]> {
  const response = await fetch(`${API_BASE_URL}/api/campaigns`);
  return response.json();
}

// ❌ WRONG — Manual queryKeys (use orpc-generated keys)
const CampaignQueryKeys = {
  all: ["campaigns"] as const,
  list: () => ["campaigns", "list"] as const,
};

// ❌ WRONG — Manual mutationFn (use orpc.mutationOptions())
const mutation = useMutation({
  mutationFn: (data) => fetch(...).then(r => r.json()),
});

// ❌ WRONG — Duplicating backend types manually
export interface Campaign {
  id: string;
  title: string;
  // ...duplicates Rust struct
}

// ❌ WRONG — setQueryData for cache updates
queryClient.setQueryData(["campaigns"], newCampaigns);

// ❌ WRONG — Merged data + UI hooks
export function useCampaigns() {
  const query = useQuery(orpc.campaigns.list.queryOptions());
  const [search, setSearch] = useState('');  // Don't mix
  return { campaigns: query.data, search, setSearch };
}
```

#### What TO Do

```typescript
// ✅ CORRECT — Import types from RPC bindings
import type { Campaign, Session, Template } from "@/rpc/bindings";
import { orpc } from "@/rpc";

// ✅ CORRECT — Use orpc-generated query options
const query = useQuery(orpc.campaigns.list.queryOptions());

// ✅ CORRECT — Use orpc-generated mutation options
const mutation = useMutation(
  orpc.campaigns.create.mutationOptions({
    onSuccess: () => {
      queryClient.invalidateQueries(orpc.campaigns.list.queryOptions());
    },
  })
);

// ✅ CORRECT — Invalidate using orpc query options
queryClient.invalidateQueries(orpc.campaigns.list.queryOptions());

// ✅ CORRECT — Separate data and UI hooks
function CampaignsRoute() {
  const { campaigns } = useCampaignsQuery();  // Data (RPC)
  const uiState = useCampaignsList(campaigns); // UI state
  return <CampaignsList {...uiState} />;
}

// ✅ CORRECT — Computed types inline (not from backend)
export interface SessionRateQuota {
  hourlyUsed: number;
  dailyUsed: number;
  // Derived from Session timestamps, not a backend type
}
```

#### Key Principles

1. **RPC bindings are the single source of truth** — all types come from Rust backend
2. **Never duplicate types or API functions** — use `@/rpc/bindings` and `orpc` client
3. **Each route owns its data** — fetches via RPC query hooks, passes to components
4. **Components are purely presentational** — receive data as props, no data fetching
5. **Use `invalidateQueries` with orpc options** — let TanStack Query refetch automatically
6. **Separate data and UI hooks** — RPC hooks for server state, manager hooks for local state
7. **Computed types live with their logic** — e.g., SessionRateQuota in useDashboard hook
8. **Media upload is the only manual API** — everything else uses RPC bindings

#### Backend-Frontend Type Contract

**How it works:**

1. Backend defines Rust types in `backend/crates/core/src/types/`
2. Backend handlers use `#[rorpc]` attributes to expose endpoints
3. Build generates `frontend/src/rpc/bindings.ts` with TypeScript types
4. Frontend imports types: `import type { Campaign } from "@/rpc/bindings"`
5. Frontend makes calls: `orpc.campaigns.create.call({ input: {...} })`
6. TypeScript ensures type safety at compile time
7. Rust backend ensures correctness at runtime

**Benefits:**

- Zero manual type synchronization
- Compile-time type safety end-to-end
- Impossible to drift frontend/backend types
- Refactoring in Rust automatically updates TypeScript
- No manual API documentation needed — types ARE the docs
