//! Session repository — all SQL for the `sessions` table.

use crate::{Db, StoreError};
use omnireach_core::types::{CreateSessionInput, Session, SessionStatus};
use uuid::Uuid;

// TODO: implement list_all
pub async fn list_all(_db: &Db) -> Result<Vec<Session>, StoreError> {
    todo!("SELECT * FROM sessions")
}

// TODO: implement get_by_id
pub async fn get_by_id(_db: &Db, _id: Uuid) -> Result<Session, StoreError> {
    todo!("SELECT * FROM sessions WHERE id = ?")
}

// TODO: implement insert
pub async fn insert(_db: &Db, _input: CreateSessionInput) -> Result<Session, StoreError> {
    todo!("INSERT INTO sessions ...")
}

// TODO: implement update_status
pub async fn update_status(
    _db: &Db,
    _id: Uuid,
    _status: SessionStatus,
    _qr_code_data: Option<String>,
    _phone_number: Option<String>,
) -> Result<Session, StoreError> {
    todo!("UPDATE sessions SET status = ?, qr_code_data = ?, phone_number = ? WHERE id = ?")
}

// TODO: implement append_sent_timestamp
/// Appends `now_ms` to both rolling timestamp arrays for rate-limit tracking.
/// Prunes timestamps older than 24 hours to keep the arrays compact.
pub async fn append_sent_timestamp(
    _db: &Db,
    _session_id: Uuid,
    _now_ms: i64,
) -> Result<(), StoreError> {
    todo!("load arrays, push now_ms, prune >24h, write back")
}

// TODO: implement reset_limits
/// Clears both timestamp arrays, effectively resetting rate-limit counters.
pub async fn reset_limits(_db: &Db, _id: Uuid) -> Result<Session, StoreError> {
    todo!("UPDATE sessions SET hourly_sent_timestamps = '[]', daily_sent_timestamps = '[]' WHERE id = ?")
}

// TODO: implement delete
pub async fn delete(_db: &Db, _id: Uuid) -> Result<(), StoreError> {
    todo!("DELETE FROM sessions WHERE id = ?")
}
