//! Scheduler tick handler — the backend's core execution workhorse.
//!
//! Route → Handler mapping:
//!   POST /api/scheduler/tick → tick
//!
//! The frontend scheduler loop calls this every 5 s with the IDs it has
//! selected to send. The backend executes the full verify → send pipeline
//! for each item, updates the DB, emits SSE events, and returns results.

use crate::{error::ApiError, state::AppState};
use axum::{Json, extract::State};
use omnireach_core::types::LogEntry;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Deserialize)]
pub struct TickRequest {
    pub item_ids: Vec<Uuid>,
}

#[derive(Debug, Serialize)]
pub struct ProcessedItem {
    pub item_id: Uuid,
    pub new_status: String,
    pub sent_at: Option<i64>,
    pub error: Option<String>,
    pub response_payload: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct TickResponse {
    pub processed: Vec<ProcessedItem>,
    pub new_logs: Vec<LogEntry>,
}

/// POST /api/scheduler/tick
///
/// For each item_id:
///   1. Load item + campaign + contact from DB
///   2. If contact unverified → call wa.check_contact()
///      → unregistered: mark skipped_unregistered, continue
///   3. If campaign has image_url and no cached media_ref → call wa.upload_media()
///   4. Call wa.send_text() or wa.send_image()
///   5. On success: mark sent, append timestamp to session, increment campaign counter
///   6. On GlueError: mark failed / held_rate_limit, record error
///   7. Insert LogEntry per outcome
///   8. Emit SSE: QueueItemUpdated per item, QueueStats once at end
///   9. Return TickResponse { processed, new_logs }
pub async fn tick(
    State(_state): State<AppState>,
    Json(_body): Json<TickRequest>,
) -> Result<Json<TickResponse>, ApiError> {
    // TODO: implement the full verify → (upload media) → send pipeline
    todo!("verify → send pipeline for each item_id")
}
