//! Axum router — registers all API routes and applies middleware.
//!
//! Route table (mirrors PRD-001 §A3 exactly):
//!
//!   GET    /api/events
//!
//!   GET    /api/sessions
//!   POST   /api/sessions
//!   PATCH  /api/sessions/{id}
//!   DELETE /api/sessions/{id}
//!   POST   /api/sessions/{id}/sync
//!   GET    /api/sessions/{id}/qr
//!   POST   /api/sessions/{id}/reset-limits
//!
//!   GET    /api/templates
//!   POST   /api/templates
//!   GET    /api/templates/{id}
//!   PATCH  /api/templates/{id}
//!   DELETE /api/templates/{id}
//!
//!   POST   /api/contacts/verify
//!
//!   GET    /api/campaigns
//!   POST   /api/campaigns
//!   PATCH  /api/campaigns/{id}
//!   DELETE /api/campaigns/{id}
//!   POST   /api/campaigns/{id}/pause
//!   POST   /api/campaigns/{id}/resume
//!   POST   /api/campaigns/{id}/archive
//!   POST   /api/campaigns/{id}/unarchive
//!   POST   /api/campaigns/{id}/retry-failed
//!
//!   GET    /api/queue
//!   GET    /api/queue/stats
//!   POST   /api/queue/{id}/cancel
//!
//!   GET    /api/logs
//!   DELETE /api/logs
//!
//!   GET    /api/settings
//!   PATCH  /api/settings
//!
//!   POST   /api/scheduler/tick
//!
//!   POST   /api/media/upload

use crate::{
    handlers::{campaigns, contacts, logs, media, queue, scheduler, sessions, settings, templates},
    middleware::auth_middleware,
    state::AppState,
};
use axum::{
    Router, middleware,
    routing::{get, patch, post},
};
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;

/// Build the complete Axum `Router` for the OmniReach API.
///
/// Called once from `main.rs`; the returned router is served directly.
pub fn build(state: AppState) -> Router {
    // CORS — allow the Vite dev server (localhost:5173) and any local origin.
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_headers(Any)
        .allow_methods(Any);

    let api = Router::new()
        // ── SSE stream ──────────────────────────────────────────────────────
        .route("/events", get(sessions::sse_handler))
        // ── Sessions ────────────────────────────────────────────────────────
        .route("/sessions", get(sessions::list).post(sessions::create))
        .route(
            "/sessions/{id}",
            patch(sessions::update).delete(sessions::destroy),
        )
        .route("/sessions/{id}/sync", post(sessions::sync))
        .route("/sessions/{id}/qr", get(sessions::get_qr))
        .route("/sessions/{id}/reset-limits", post(sessions::reset_limits))
        // ── Contacts ────────────────────────────────────────────────────────
        .route("/contacts/verify", post(contacts::verify))
        // ── Templates ───────────────────────────────────────────────────────
        .route("/templates", get(templates::list).post(templates::create))
        .route(
            "/templates/{id}",
            get(templates::get)
                .patch(templates::update)
                .delete(templates::destroy),
        )
        // ── Campaigns ───────────────────────────────────────────────────────
        .route("/campaigns", get(campaigns::list).post(campaigns::create))
        .route(
            "/campaigns/{id}",
            patch(campaigns::update).delete(campaigns::destroy),
        )
        .route("/campaigns/{id}/pause", post(campaigns::pause))
        .route("/campaigns/{id}/resume", post(campaigns::resume))
        .route("/campaigns/{id}/archive", post(campaigns::archive))
        .route("/campaigns/{id}/unarchive", post(campaigns::unarchive))
        .route(
            "/campaigns/{id}/retry-failed",
            post(campaigns::retry_failed),
        )
        // ── Queue ────────────────────────────────────────────────────────────
        .route("/queue", get(queue::list))
        .route("/queue/stats", get(queue::stats))
        .route("/queue/{id}/cancel", post(queue::cancel))
        // ── Logs ─────────────────────────────────────────────────────────────
        .route("/logs", get(logs::list).delete(logs::clear))
        // ── Settings ─────────────────────────────────────────────────────────
        .route("/settings", get(settings::get).patch(settings::update))
        // ── Scheduler ────────────────────────────────────────────────────────
        .route("/scheduler/tick", post(scheduler::tick))
        // ── Media ─────────────────────────────────────────────────────────────
        .route("/media/upload", post(media::upload))
        // ── Auth middleware on all /api routes ────────────────────────────────
        .layer(middleware::from_fn_with_state(
            state.clone(),
            auth_middleware,
        ))
        .with_state(state);

    Router::new()
        .nest("/api", api)
        .layer(cors)
        .layer(TraceLayer::new_for_http())
}
