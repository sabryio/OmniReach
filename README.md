# OmniReach

WhatsApp broadcast management platform for healthcare and pharmacy operators.
Import a patient CSV, compose a personalized message, launch a campaign, and
watch it drain through a rate-limited queue — all live via Server-Sent Events.

---

## Architecture

OmniReach is a full-stack monorepo with three top-level workspaces:

```
OmniReach/
├── frontend/          React 19 desktop-style SPA (Vite + TanStack Router)
├── backend/           Rust/Axum HTTP server + WABridge proxy
└── mockup/            Reference design (read-only, not deployed)
```

The **frontend** talks only to the **backend**. The backend proxies all
WhatsApp operations to the **WABridge daemon** — a separate Rust process
that owns the WhatsApp device pairing and protocol. The frontend never
calls WABridge directly.

```
Browser (React)
    │  REST + SSE  (http://localhost:3000)
    ▼
OmniReach Backend (Axum)
    │  HTTP  (http://localhost:7171)
    ▼
WABridge Daemon (Rust, pre-existing)
    │  WhatsApp protocol
    ▼
WhatsApp
```

---

## Tech Stack

### Frontend (`frontend/`)

| Layer          | Technology                                                |
| -------------- | --------------------------------------------------------- |
| Framework      | React 19                                                  |
| Routing        | TanStack Router (file-based, `$locale` prefix)            |
| Build          | Vite 8                                                    |
| Styling        | Tailwind CSS 4 + shadcn/ui (CSS variable tokens)          |
| State          | React `useState` / `useMemo` — data flows from route down |
| UI primitives  | Radix UI, Base UI                                         |
| i18n           | Paraglide JS (`messages/en.json`, `messages/ar-EG.json`)  |
| Charts         | Recharts                                                  |
| Linting/Format | Biome                                                     |
| Type check     | TypeScript 7 (`bunx tsc --noEmit`)                        |

### Backend (`backend/`)

| Layer          | Technology                                              |
| -------------- | ------------------------------------------------------- |
| Language       | Rust (edition 2024)                                     |
| HTTP framework | Axum 0.8                                                |
| Database       | SQLite via sqlx 0.9 (compile-time queries + migrations) |
| HTTP client    | reqwest 0.13 (WABridge proxy)                           |
| SSE            | `tokio::sync::broadcast` → `axum::response::sse`        |
| Logging        | tracing + tracing-subscriber                            |
| Error handling | thiserror 2                                             |

---

## Repository Structure

### Frontend

```
frontend/
├── src/
│   ├── features/          Feature modules (one folder per domain)
│   │   ├── campaigns/     Broadcast campaign CRUD + wizard
│   │   ├── customers/     Contact management + verification
│   │   ├── dashboard/     Overview dashboard
│   │   ├── layout/        App shell (title bar, sidebar, menu bar)
│   │   ├── modals/        Settings, quick verifier, about
│   │   ├── queue/         Live queue + event stream + analytics + logs
│   │   ├── reports/       Delivery analytics + CSV export
│   │   ├── sessions/      WABridge session management
│   │   └── templates/     Reusable message templates
│   ├── mock-data/         MOCK_CAMPAIGNS, MOCK_SESSIONS, MOCK_QUEUE, MOCK_LOGS
│   ├── routes/            TanStack Router file-based routes
│   ├── types.ts           All shared domain types (single source of truth)
│   └── styles.css         shadcn CSS variable definitions (@theme inline)
├── messages/
│   ├── en.json            English translations
│   └── ar-EG.json         Arabic translations
├── package.json
└── vite.config.ts
```

Each feature follows a strict structure:

```
features/<name>/
  components/   Purely presentational TSX — no useState inside
  hooks/        All state logic, filtering, side effects
  index.ts      Barrel export
```

### Backend

```
backend/
├── Cargo.toml             Workspace root (resolver = "2")
├── .env.example           Environment variable reference
├── apps/
│   └── omnireach/         Binary crate — wires deps, calls axum::serve
└── crates/
    ├── core/              Domain types + pure logic (no I/O)
    │   ├── types/         Campaign, QueueItem, Session, Contact, LogEntry, …
    │   ├── quota.rs       Rolling-window rate-limit calculator
    │   └── renderer.rs    Merge-tag template substitution ({{name}})
    ├── store/             SQLite persistence (sqlx repositories)
    │   └── migrations/    0001_initial.sql — 6 tables
    ├── glue/              WABridge HTTP adapter (reqwest)
    └── server/            Axum handlers, SSE broadcaster, auth middleware
        └── handlers/      One file per API resource group
```

Layer dependency rule (enforced by Cargo):

```
core  ←  store
core  ←  glue
core + store + glue  ←  server
server  ←  binary (apps/omnireach)
```

---

## Features

- **Campaign wizard** — 4-step flow: CSV import → message composer → session selection → review & launch
- **Live queue** — real-time dispatch table with status filters, payload inspector, rate-limit holds
- **Scheduler** — time-window enforcement (default 9 AM–9 PM) + rolling hourly/daily rate limits per session
- **Merge tags** — `{{name}}`, `{{prescription}}`, `{{doctor}}` etc. substituted per-recipient at queue time
- **Contact verification** — checks WhatsApp registration via WABridge before sending
- **Session management** — multi-session load balancing, QR pairing, per-session API keys
- **Templates** — reusable message templates with optional image attachment
- **Reports** — delivery rate, unregistered rate, per-campaign CSV export
- **SSE event stream** — real-time UI updates without polling
- **Bilingual UI** — English + Arabic (ar-EG) via Paraglide JS

---

## Quick Start

### Prerequisites

- [Bun](https://bun.sh) ≥ 1.0 (frontend)
- [Rust](https://rustup.rs) stable (backend)
- [WABridge daemon](https://localhost:7171) running and paired

### Frontend

```bash
cd frontend
bun install
bun run dev          # http://localhost:5173
```

Available scripts (from `package.json`):

| Script            | Command                | Purpose                         |
| ----------------- | ---------------------- | ------------------------------- |
| `dev`             | `vite dev --port 5173` | Development server              |
| `build`           | `vite build`           | Production build                |
| `typecheck`       | `bunx tsc --noEmit`    | TypeScript check                |
| `check`           | `biome check`          | Lint + format check             |
| `format`          | `biome format`         | Auto-format                     |
| `generate-routes` | `tsr generate`         | Regenerate TanStack Router tree |

### Backend

```bash
cd backend
cp .env.example .env
# Edit .env — set OMNIREACH_TOKEN

cargo run -p omnireach                 # dev
cargo build --release -p omnireach     # release
```

Run tests:

```bash
cargo test -p omnireach-core           # unit tests (quota + renderer, no I/O)
cargo test --workspace                 # all tests
```

---

## Environment Variables

All variables are read by `backend/apps/omnireach/src/main.rs`.
Copy `backend/.env.example` to `backend/.env` before running.

| Variable              | Default                 | Required | Description                                                         |
| --------------------- | ----------------------- | -------- | ------------------------------------------------------------------- |
| `OMNIREACH_TOKEN`     | —                       | **Yes**  | Static bearer token. Frontend sends `Authorization: Bearer <token>` |
| `OMNIREACH_ADDR`      | `127.0.0.1:3000`        | No       | Bind address for the Axum server                                    |
| `DATABASE_URL`        | `sqlite://omnireach.db` | No       | SQLite file path. Use `sqlite://:memory:` for tests                 |
| `WABRIDGE_BASE_URL`   | `http://localhost:7171` | No       | WABridge daemon base URL                                            |
| `WABRIDGE_TIMEOUT_MS` | `5000`                  | No       | HTTP timeout for WABridge calls (milliseconds)                      |
| `RUST_LOG`            | `info`                  | No       | Log filter for tracing-subscriber (e.g. `debug`, `omnireach=trace`) |

---

## API

All routes are prefixed `/api` and require `Authorization: Bearer <OMNIREACH_TOKEN>`.

| Method | Path                              | Description                                 |
| ------ | --------------------------------- | ------------------------------------------- |
| GET    | `/api/events`                     | SSE stream — live queue/session/log events  |
| GET    | `/api/sessions`                   | List WABridge sessions                      |
| POST   | `/api/sessions`                   | Create session                              |
| POST   | `/api/sessions/:id/sync`          | Sync status from WABridge                   |
| GET    | `/api/sessions/:id/qr`            | Fetch QR code for pairing                   |
| POST   | `/api/sessions/:id/reset-limits`  | Clear rate-limit counters                   |
| POST   | `/api/contacts/verify`            | Verify a phone number via WABridge          |
| GET    | `/api/campaigns`                  | List campaigns (with contacts embedded)     |
| POST   | `/api/campaigns`                  | Create campaign + queue all contacts        |
| POST   | `/api/campaigns/:id/pause`        | Pause running campaign                      |
| POST   | `/api/campaigns/:id/resume`       | Resume paused campaign                      |
| POST   | `/api/campaigns/:id/retry-failed` | Re-queue failed items                       |
| GET    | `/api/queue`                      | List queue items (`?campaign_id=` optional) |
| GET    | `/api/queue/stats`                | Counts by status                            |
| POST   | `/api/scheduler/tick`             | Execute verify→send for a batch of item IDs |
| POST   | `/api/media/upload`               | Upload image to WABridge, get `media_ref`   |
| GET    | `/api/logs`                       | Recent 500 log entries                      |
| DELETE | `/api/logs`                       | Clear all logs                              |
| GET    | `/api/settings`                   | Load persisted settings                     |
| PATCH  | `/api/settings`                   | Update settings                             |

---

## Frontend Architecture Rules

These rules are enforced via `AGENTS.md` and apply to all contributors and AI agents:

1. **Presentational components** — `.tsx` files contain no `useState`, no `useEffect`, no data fetching. They render props.
2. **Data hooks** — `.ts` files own all state, filtering, business logic, and side effects.
3. **Data flows from route down** — `frontend/src/routes/$locale/index.tsx` owns all app state. Components receive data as props. Replacing mock data with real API calls means editing only the route file.
4. **shadcn CSS variables only** — no hardcoded hex values, no custom semantic class names. Use `bg-card`, `text-foreground`, `bg-primary/10`, etc.
5. **Types from `@/types`** — never redefine shared types locally.
6. **Paraglide for i18n** — `m.key()` from `@/paraglide/messages`. No `t('key')`.

---

## Database Schema

Six SQLite tables (created by migration `0001_initial.sql`):

| Table         | Purpose                                                           |
| ------------- | ----------------------------------------------------------------- |
| `campaigns`   | Broadcast campaigns with counters (sent, failed, unregistered)    |
| `contacts`    | Recipients, one row per contact per campaign                      |
| `queue_items` | Dispatch queue — one row per contact, tracks status lifecycle     |
| `sessions`    | WABridge sessions with per-session rate-limit timestamp arrays    |
| `logs`        | Structured log entries (level + category + optional JSON details) |
| `settings`    | Key-value store for runtime configuration                         |

Queue item status lifecycle:

```
pending → verifying → sending → sent
                    ↘ skipped_unregistered
                    ↘ failed
                    ↘ held_rate_limit  (retried automatically)
                    ↘ held_time_window (retried when window opens)
                    ↘ cancelled
```

---

## Development Status

The frontend UI is feature-complete with mock data. The backend scaffold is
in place with all routes registered and handler stubs. Implementation work
follows the order in `backend/.ai/blueprints/001-backend-scaffold.md`:

1. **Phase 1** — Store layer (`store::campaigns::insert` transaction, all repositories)
2. **Phase 2** — Glue layer (WABridge HTTP client methods)
3. **Phase 3** — Server layer (handlers, scheduler tick pipeline)
4. **Phase 4** — Frontend wiring (replace mock data with API calls)
