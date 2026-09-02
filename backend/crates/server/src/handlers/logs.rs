//! Log handlers.
//!
//! Route → Handler mapping:
//!   GET    /api/logs → list
//!   DELETE /api/logs → clear

use crate::{error::ApiError, state::AppState};
use axum::{Json, extract::State, http::StatusCode};
use omnireach_core::types::LogEntry;

/// GET /api/logs
/// Returns the most recent 500 log entries, newest first.
pub async fn list(State(state): State<AppState>) -> Result<Json<Vec<LogEntry>>, ApiError> {
    let start = std::time::Instant::now();
    let logs = omnireach_store::logs::list_recent(&state.db, 500).await?;
    let elapsed = start.elapsed();
    tracing::debug!(
        "GET /api/logs fetched {} entries in {:?}",
        logs.len(),
        elapsed
    );
    Ok(Json(logs))
}

/// DELETE /api/logs
/// Clears all log entries. Returns 204 No Content.
pub async fn clear(State(state): State<AppState>) -> Result<StatusCode, ApiError> {
    omnireach_store::logs::clear_all(&state.db).await?;
    Ok(StatusCode::NO_CONTENT)
}
