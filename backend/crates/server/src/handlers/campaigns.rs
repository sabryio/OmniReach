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
use omnireach_core::types::{Campaign, CampaignStatus, CreateCampaignInput};
use uuid::Uuid;

/// GET /api/campaigns
pub async fn list(State(state): State<AppState>) -> Result<Json<Vec<Campaign>>, ApiError> {
    let campaigns = omnireach_store::campaigns::list_all(&state.db).await?;
    Ok(Json(campaigns))
}

/// POST /api/campaigns
pub async fn create(
    State(state): State<AppState>,
    Json(input): Json<CreateCampaignInput>,
) -> Result<(StatusCode, Json<Campaign>), ApiError> {
    let campaign = omnireach_store::campaigns::insert(&state.db, input).await?;

    // Emit SSE event for campaign creation
    state.sse.send(crate::sse::SseEvent::CampaignCreated {
        campaign_id: campaign.id.to_string(),
        title: campaign.title.clone(),
    });

    Ok((StatusCode::CREATED, Json(campaign)))
}

/// PATCH /api/campaigns/:id
pub async fn update(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(patch): Json<serde_json::Value>,
) -> Result<Json<Campaign>, ApiError> {
    // Extract optional status change from patch
    let status = patch
        .get("status")
        .and_then(|v| v.as_str())
        .and_then(|s| match s {
            "running" => Some(CampaignStatus::Running),
            "paused" => Some(CampaignStatus::Paused),
            "cancelled" => Some(CampaignStatus::Cancelled),
            _ => None,
        });

    let campaign = if let Some(ref status) = status {
        omnireach_store::campaigns::update_status(&state.db, id, status.clone()).await?
    } else {
        omnireach_store::campaigns::get_by_id(&state.db, id).await?
    };

    // Emit SSE event for campaign status change
    if status.is_some() {
        state.sse.send(crate::sse::SseEvent::CampaignStatus {
            campaign_id: campaign.id.to_string(),
            status: campaign.status.as_str().to_string(),
        });
    }

    Ok(Json(campaign))
}

/// DELETE /api/campaigns/:id
pub async fn destroy(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<StatusCode, ApiError> {
    omnireach_store::campaigns::delete(&state.db, id).await?;
    // TODO: emit SSE event
    Ok(StatusCode::NO_CONTENT)
}

/// POST /api/campaigns/:id/pause
pub async fn pause(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<Campaign>, ApiError> {
    let campaign =
        omnireach_store::campaigns::update_status(&state.db, id, CampaignStatus::Paused).await?;

    // Emit SSE event for pause
    state.sse.send(crate::sse::SseEvent::CampaignStatus {
        campaign_id: campaign.id.to_string(),
        status: "paused".to_string(),
    });

    Ok(Json(campaign))
}

/// POST /api/campaigns/:id/resume
pub async fn resume(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<Campaign>, ApiError> {
    let campaign =
        omnireach_store::campaigns::update_status(&state.db, id, CampaignStatus::Running).await?;

    // Emit SSE event for resume
    state.sse.send(crate::sse::SseEvent::CampaignStatus {
        campaign_id: campaign.id.to_string(),
        status: "running".to_string(),
    });

    Ok(Json(campaign))
}

/// POST /api/campaigns/:id/archive
pub async fn archive(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<Campaign>, ApiError> {
    let campaign = omnireach_store::campaigns::set_archived(&state.db, id, true).await?;
    Ok(Json(campaign))
}

/// POST /api/campaigns/:id/unarchive
pub async fn unarchive(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<Campaign>, ApiError> {
    let campaign = omnireach_store::campaigns::set_archived(&state.db, id, false).await?;
    Ok(Json(campaign))
}

/// POST /api/campaigns/:id/retry-failed
pub async fn retry_failed(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, ApiError> {
    let queued_count = omnireach_store::queue::requeue_failed(&state.db, id).await?;
    omnireach_store::campaigns::update_status(&state.db, id, CampaignStatus::Running).await?;

    // Emit SSE event for retry
    state.sse.send(crate::sse::SseEvent::CampaignStatus {
        campaign_id: id.to_string(),
        status: "running".to_string(),
    });

    Ok(Json(serde_json::json!({ "queuedCount": queued_count })))
}
