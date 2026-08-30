//! Log entry repository — all SQL for the `logs` table.

use crate::{Db, StoreError};
use omnireach_core::types::LogEntry;

// TODO: implement list_recent
/// Returns the most recent `limit` log entries, newest first.
pub async fn list_recent(_db: &Db, _limit: i64) -> Result<Vec<LogEntry>, StoreError> {
    todo!("SELECT * FROM logs ORDER BY timestamp DESC LIMIT ?")
}

// TODO: implement insert
pub async fn insert(_db: &Db, _entry: LogEntry) -> Result<(), StoreError> {
    todo!("INSERT INTO logs ...")
}

// TODO: implement insert_many
/// Batch insert — used by the scheduler tick handler after processing items.
pub async fn insert_many(_db: &Db, _entries: Vec<LogEntry>) -> Result<(), StoreError> {
    todo!("BEGIN; INSERT INTO logs ...; COMMIT (one statement per entry)")
}

// TODO: implement clear_all
pub async fn clear_all(_db: &Db) -> Result<(), StoreError> {
    todo!("DELETE FROM logs")
}
