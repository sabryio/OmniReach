//! Settings handlers.
//!
//! Route → Handler mapping:
//!   GET   /api/settings → get
//!   PATCH /api/settings → update

use crate::{error::ApiError, state::AppState};
use axum::{Json, extract::State};
use omnireach_core::types::{AppSettings, UpdateSettingsInput};

/// GET /api/settings
/// Returns all persisted settings, falling back to defaults for missing keys.
pub async fn get(State(state): State<AppState>) -> Result<Json<AppSettings>, ApiError> {
    let settings = omnireach_store::settings::load(&state.db).await?;
    Ok(Json(settings))
}

/// PATCH /api/settings
/// Merges provided fields into stored settings and persists.
pub async fn update(
    State(state): State<AppState>,
    Json(patch): Json<UpdateSettingsInput>,
) -> Result<Json<AppSettings>, ApiError> {
    let updated = omnireach_store::settings::update(&state.db, patch).await?;
    // TODO: emit SSE event so open clients pick up setting changes
    Ok(Json(updated))
}
