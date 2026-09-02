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
    let start = std::time::Instant::now();
    let items = omnireach_store::queue::list_all(&state.db, q.campaign_id).await?;
    let elapsed = start.elapsed();
    tracing::debug!(
        "GET /api/queue fetched {} entries in {:?}",
        items.len(),
        elapsed
    );
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

    // Emit SSE event for queue item update
    state.sse.send(crate::sse::SseEvent::QueueItemUpdated {
        item_id: item.id.to_string(),
        new_status: item.status.to_string(),
        campaign_id: item.campaign_id.to_string(),
    });

    Ok(Json(item))
}
