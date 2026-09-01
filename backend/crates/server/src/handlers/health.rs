//! Health check endpoint — simple uptime probe for monitoring.

use axum::{extract::State, http::StatusCode, Json};
use serde::Serialize;

use crate::state::AppState;

#[derive(Serialize)]
pub struct HealthResponse {
    pub status: &'static str,
    pub uptime_seconds: u64,
}

/// GET /health — unauthenticated health check endpoint.
///
/// Returns:
/// - 200 OK: `{ "status": "ok", "uptime_seconds": N }`
///
/// Used by load balancers, monitoring tools, and QA scripts to verify
/// the backend is running and responsive.
pub async fn health_check(State(state): State<AppState>) -> (StatusCode, Json<HealthResponse>) {
    let uptime_seconds = state.start_time().elapsed().as_secs();

    (
        StatusCode::OK,
        Json(HealthResponse {
            status: "ok",
            uptime_seconds,
        }),
    )
}
