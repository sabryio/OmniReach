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
use serde::Deserialize;
use uuid::Uuid;

#[derive(Debug, Deserialize)]
pub struct ListQueueQuery {
    pub campaign_id: Option<Uuid>,
}

/// GET /api/queue?campaign_id=<uuid>
pub async fn list(
    State(_state): State<AppState>,
    Query(_q): Query<ListQueueQuery>,
) -> Result<Json<serde_json::Value>, ApiError> {
    // TODO: store::queue::list_all(&state.db, q.campaign_id).await
    todo!("return queue items filtered by optional campaign_id")
}

/// GET /api/queue/stats
pub async fn stats(State(_state): State<AppState>) -> Result<Json<serde_json::Value>, ApiError> {
    // TODO: store::queue::stats(&state.db).await
    // Returns: { pending, sending, sent, failed, held }
    todo!("return queue stats")
}

/// POST /api/queue/:id/cancel
pub async fn cancel(
    State(_state): State<AppState>,
    Path(_id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, ApiError> {
    // TODO: store::queue::cancel(&state.db, id).await
    todo!("set queue item status = cancelled")
}
