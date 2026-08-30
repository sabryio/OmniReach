//! Queue item repository — all SQL for the `queue_items` table.

use crate::{Db, StoreError};
use omnireach_core::types::{QueueItem, QueueItemStatus};
use uuid::Uuid;

// TODO: implement list_all
pub async fn list_all(_db: &Db, _campaign_id: Option<Uuid>) -> Result<Vec<QueueItem>, StoreError> {
    todo!("SELECT * FROM queue_items [WHERE campaign_id = ?]")
}

// TODO: implement get_by_id
pub async fn get_by_id(_db: &Db, _id: Uuid) -> Result<QueueItem, StoreError> {
    todo!("SELECT * FROM queue_items WHERE id = ?")
}

// TODO: implement list_by_ids
/// Batch-load items by ID list — used by the scheduler tick handler.
pub async fn list_by_ids(_db: &Db, _ids: &[Uuid]) -> Result<Vec<QueueItem>, StoreError> {
    todo!("SELECT * FROM queue_items WHERE id IN (?)")
}

// TODO: implement list_pending_for_campaign
pub async fn list_pending_for_campaign(
    _db: &Db,
    _campaign_id: Uuid,
) -> Result<Vec<QueueItem>, StoreError> {
    todo!("SELECT * FROM queue_items WHERE campaign_id = ? AND status = 'pending'")
}

// TODO: implement update_status
pub async fn update_status(
    _db: &Db,
    _id: Uuid,
    _status: QueueItemStatus,
    _assigned_session_id: Option<Uuid>,
    _last_error: Option<String>,
    _response_payload: Option<String>,
) -> Result<QueueItem, StoreError> {
    todo!("UPDATE queue_items SET status = ?, assigned_session_id = ?, ... WHERE id = ?")
}

// TODO: implement stats
/// Returns counts by status for the queue overview tile.
pub async fn stats(_db: &Db) -> Result<QueueStats, StoreError> {
    todo!("SELECT status, COUNT(*) FROM queue_items GROUP BY status")
}

/// Aggregated queue status counts.
#[derive(Debug, serde::Serialize)]
pub struct QueueStats {
    pub pending: i64,
    pub sending: i64,
    pub sent: i64,
    pub failed: i64,
    pub held: i64,
}

// TODO: implement cancel
pub async fn cancel(_db: &Db, _id: Uuid) -> Result<QueueItem, StoreError> {
    todo!("UPDATE queue_items SET status = 'cancelled' WHERE id = ?")
}

// TODO: implement requeue_failed
/// Resets all `failed` items for a campaign back to `pending`.
pub async fn requeue_failed(_db: &Db, _campaign_id: Uuid) -> Result<i64, StoreError> {
    todo!("UPDATE queue_items SET status = 'pending', attempts = 0, last_error = NULL WHERE campaign_id = ? AND status = 'failed'")
}
