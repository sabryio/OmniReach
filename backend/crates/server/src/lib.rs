//! omnireach-server
//!
//! Axum HTTP layer — routes, handlers, SSE broadcaster, auth middleware.
//!
//! Layer contract:
//!   - Depends on: omnireach-core, omnireach-store, omnireach-glue, axum, tokio
//!   - MUST NOT contain business logic — delegate to core/store/glue
//!   - Each handler is a thin function: extract → call store/glue → respond
//!
//! Entry point for the binary: call `router::build(state)` to get the Axum
//! `Router`, then serve it from `apps/omnireach-server/src/main.rs`.

pub mod error;
pub mod extractors;
pub mod middleware;
pub mod router;
pub mod sse;
pub mod state;

pub mod handlers {
    pub mod campaigns;
    pub mod contacts;
    pub mod logs;
    pub mod media;
    pub mod queue;
    pub mod scheduler;
    pub mod sessions;
    pub mod settings;
}
