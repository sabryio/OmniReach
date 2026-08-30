//! Settings handlers.
//!
//! Route → Handler mapping:
//!   GET   /api/settings → get
//!   PATCH /api/settings → update

use crate::{error::ApiError, state::AppState};
use axum::{Json, extract::State};

/// GET /api/settings
/// Returns all persisted settings, falling back to defaults for missing keys.
pub async fn get(State(_state): State<AppState>) -> Result<Json<serde_json::Value>, ApiError> {
    // TODO: store::settings::load(&state.db).await
    todo!("load AppSettings from DB, return as JSON")
}

/// PATCH /api/settings
/// Merges the provided fields into the stored settings and persists.
pub async fn update(
    State(_state): State<AppState>,
    Json(_patch): Json<serde_json::Value>,
) -> Result<Json<serde_json::Value>, ApiError> {
    // TODO:
    // 1. store::settings::load(&state.db).await
    // 2. merge patch fields onto loaded struct
    // 3. store::settings::save(&state.db, &merged).await
    // 4. return merged AppSettings as JSON
    todo!("merge patch into stored settings, persist, return updated")
}
