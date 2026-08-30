//! Settings repository — key-value store backed by the `settings` table.

use crate::{Db, StoreError};
use omnireach_core::types::AppSettings;

// TODO: implement load
/// Reads all settings rows and deserializes into `AppSettings`.
/// Missing keys fall back to `AppSettings::default()`.
pub async fn load(_db: &Db) -> Result<AppSettings, StoreError> {
    todo!("SELECT key, value FROM settings; deserialize each key; fill defaults")
}

// TODO: implement save
/// Persists all `AppSettings` fields as individual key-value rows (upsert).
pub async fn save(_db: &Db, _settings: &AppSettings) -> Result<(), StoreError> {
    todo!("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?) for each field")
}
