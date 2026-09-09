//! Axum router — registers all API routes and applies middleware.
//!
//! Route table (mirrors PRD-001 §A3 exactly):
//!
//!   GET    /api/events
//!
//!   GET    /api/sessions
//!   GET    /api/sessions/{id}
//!   POST   /api/sessions
//!   PATCH  /api/sessions/{id}
//!   DELETE /api/sessions/{id}
//!   POST   /api/sessions/{id}/sync
//!   POST   /api/sessions/{id}/reset-limits
//!   POST   /api/sessions/{id}/send-test
//!
//!   GET    /api/templates
//!   POST   /api/templates
//!   GET    /api/templates/{id}
//!   PATCH  /api/templates/{id}
//!   DELETE /api/templates/{id}
//!
//!   POST   /api/contacts/verify-batch
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
//!   POST   /api/queue/{id}/retry
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
    handlers::{health, media},
    middleware::auth_middleware,
    state::AppState,
};
use axum::{
    Router, middleware,
    routing::{get, post},
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

    // rorpc-generated router (mounts handlers with #[rorpc] attributes)
    let rorpc_routes = rorpc::router!(state.clone()).layer(middleware::from_fn_with_state(
        state.clone(),
        auth_middleware,
    ));

    let api = Router::new()
        // ── Media ─────────────────────────────────────────────────────────────
        // Keep manual route until rorpc supports multipart/form-data
        .route("/media/upload", post(media::upload))
        .with_state(state.clone())
        // ── Auth middleware on all /api routes ────────────────────────────────
        .layer(middleware::from_fn_with_state(
            state.clone(),
            auth_middleware,
        ));

    Router::new()
        .route("/health", get(health::health_check))
        .with_state(state.clone())
        .nest("/api", api)
        // ── Merge rorpc routes at /rpc ───────────────────────────────────────
        .nest("/rpc", rorpc_routes)
        .layer(cors)
        .layer(TraceLayer::new_for_http())
}
