//! Campaign handlers.
//!
//! Route → Handler mapping:
//!   GET    /api/campaigns                  → list
//!   POST   /api/campaigns                  → create
//!   PATCH  /api/campaigns/:id              → update
//!   DELETE /api/campaigns/:id              → destroy
//!   POST   /api/campaigns/:id/pause        → pause
//!   POST   /api/campaigns/:id/resume       → resume
//!   POST   /api/campaigns/:id/archive      → archive
//!   POST   /api/campaigns/:id/unarchive    → unarchive
//!   POST   /api/campaigns/:id/retry-failed → retry_failed

use crate::{error::ApiError, state::AppState};
use axum::{
    Json,
    extract::{Path, State},
    http::StatusCode,
};
use omnireach_core::types::CreateCampaignInput;
use uuid::Uuid;

/// GET /api/campaigns
pub async fn list(State(_state): State<AppState>) -> Result<Json<serde_json::Value>, ApiError> {
    // TODO: store::campaigns::list_all(&state.db).await
    todo!("return all campaigns with contacts embedded")
}

/// POST /api/campaigns
pub async fn create(
    State(_state): State<AppState>,
    Json(_input): Json<CreateCampaignInput>,
) -> Result<(StatusCode, Json<serde_json::Value>), ApiError> {
    // TODO:
    // 1. Validate: title non-empty, at least one contact, at least one session_id
    // 2. Render each contact's message via core::renderer::render()
    // 3. store::campaigns::insert(&state.db, input).await (transaction)
    // 4. state.sse.send(SseEvent::CampaignCreated { ... })
    // 5. Return 201 with full Campaign
    todo!("create campaign, render templates, queue items, emit SSE")
}

/// PATCH /api/campaigns/:id
pub async fn update(
    State(_state): State<AppState>,
    Path(_id): Path<Uuid>,
    Json(_patch): Json<serde_json::Value>,
) -> Result<Json<serde_json::Value>, ApiError> {
    // TODO: parse patch fields, store::campaigns::update(...)
    todo!("partial update campaign")
}

/// DELETE /api/campaigns/:id
pub async fn destroy(
    State(_state): State<AppState>,
    Path(_id): Path<Uuid>,
) -> Result<StatusCode, ApiError> {
    // TODO: store::campaigns::delete(&state.db, id).await → 204
    todo!("delete campaign (cascade)")
}

/// POST /api/campaigns/:id/pause
pub async fn pause(
    State(_state): State<AppState>,
    Path(_id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, ApiError> {
    // TODO: store::campaigns::update_status(&state.db, id, CampaignStatus::Paused).await
    todo!("set campaign status = paused")
}

/// POST /api/campaigns/:id/resume
pub async fn resume(
    State(_state): State<AppState>,
    Path(_id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, ApiError> {
    // TODO: store::campaigns::update_status(&state.db, id, CampaignStatus::Running).await
    todo!("set campaign status = running")
}

/// POST /api/campaigns/:id/archive
pub async fn archive(
    State(_state): State<AppState>,
    Path(_id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, ApiError> {
    // TODO: store::campaigns::set_archived(&state.db, id, true).await
    todo!("set is_archived = true, archived_at = now")
}

/// POST /api/campaigns/:id/unarchive
pub async fn unarchive(
    State(_state): State<AppState>,
    Path(_id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, ApiError> {
    // TODO: store::campaigns::set_archived(&state.db, id, false).await
    todo!("set is_archived = false, archived_at = null")
}

/// POST /api/campaigns/:id/retry-failed
pub async fn retry_failed(
    State(_state): State<AppState>,
    Path(_id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, ApiError> {
    // TODO:
    // 1. store::queue::requeue_failed(&state.db, id).await → count
    // 2. store::campaigns::update_status(&state.db, id, CampaignStatus::Running).await
    // 3. return Json(json!({ "queued_count": count }))
    todo!("reset failed queue items to pending")
}
