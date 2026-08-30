//! Log handlers.
//!
//! Route → Handler mapping:
//!   GET    /api/logs → list
//!   DELETE /api/logs → clear

use crate::{error::ApiError, state::AppState};
use axum::{Json, extract::State, http::StatusCode};

/// GET /api/logs
/// Returns the most recent 500 log entries, newest first.
pub async fn list(State(_state): State<AppState>) -> Result<Json<serde_json::Value>, ApiError> {
    // TODO: store::logs::list_recent(&state.db, 500).await
    todo!("return recent logs")
}

/// DELETE /api/logs
/// Clears all log entries. Returns 204 No Content.
pub async fn clear(State(_state): State<AppState>) -> Result<StatusCode, ApiError> {
    // TODO: store::logs::clear_all(&state.db).await
    todo!("delete all logs, return 204")
}
