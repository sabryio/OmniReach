//! Queue handlers.
//!
//! Route → Handler mapping:
//!   GET  /api/queue            → list
//!   GET  /api/queue/stats      → stats
//!   POST /api/queue/:id/cancel → cancel

use crate::{error::ApiError, state::AppState};
use axum::{
    Json,
    extract::{Path, Query, State},
};
use omnireach_core::types::QueueItem;
use omnireach_store::queue::QueueStats;
use serde::Deserialize;
use uuid::Uuid;

#[derive(Debug, Deserialize)]
pub struct ListQueueQuery {
    pub campaign_id: Option<Uuid>,
}

/// GET /api/queue?campaign_id=<uuid>
pub async fn list(
    State(state): State<AppState>,
    Query(q): Query<ListQueueQuery>,
) -> Result<Json<Vec<QueueItem>>, ApiError> {
    let items = omnireach_store::queue::list_all(&state.db, q.campaign_id).await?;
    Ok(Json(items))
}

/// GET /api/queue/stats
pub async fn stats(State(state): State<AppState>) -> Result<Json<QueueStats>, ApiError> {
    let s = omnireach_store::queue::stats(&state.db).await?;
    Ok(Json(s))
}

/// POST /api/queue/:id/cancel
pub async fn cancel(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<QueueItem>, ApiError> {
    let item = omnireach_store::queue::cancel(&state.db, id).await?;
    // TODO: emit SSE event
    Ok(Json(item))
}
