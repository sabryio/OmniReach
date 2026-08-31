//! Settings repository — key-value store backed by the `settings` table.

use crate::{Db, StoreError};
use omnireach_core::types::{AppSettings, UpdateSettingsInput};

/// GET /api/settings — load settings, fall back to defaults for missing keys.
///
/// TODO: Phase 2 — SELECT key, value FROM settings; deserialize each key
pub async fn load(_db: &Db) -> Result<AppSettings, StoreError> {
    Ok(AppSettings::default())
}

/// PATCH /api/settings — merge patch into current settings and persist.
///
/// TODO: Phase 2 — INSERT OR REPLACE INTO settings (key, value) for each field
pub async fn save(_db: &Db, settings: &AppSettings) -> Result<(), StoreError> {
    let _ = settings;
    Ok(())
}

/// Merge a partial update onto the current settings and persist.
pub async fn update(_db: &Db, patch: UpdateSettingsInput) -> Result<AppSettings, StoreError> {
    let mut current = load(_db).await?;

    if let Some(v) = patch.scheduler_start_hour {
        current.scheduler_start_hour = v;
    }
    if let Some(v) = patch.scheduler_end_hour {
        current.scheduler_end_hour = v;
    }
    if let Some(v) = patch.scheduler_strict_time_window {
        current.scheduler_strict_time_window = v;
    }
    if let Some(v) = patch.wabridge_base_url {
        current.wabridge_base_url = v;
    }
    if let Some(v) = patch.wabridge_timeout_ms {
        current.wabridge_timeout_ms = v;
    }

    save(_db, &current).await?;
    Ok(current)
}
