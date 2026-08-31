//! Settings repository — key-value store backed by the `settings` table.

use crate::{Db, StoreError};
use omnireach_core::types::{AppSettings, UpdateSettingsInput};

/// GET /api/settings — load settings, fall back to defaults for missing keys.
pub async fn load(db: &Db) -> Result<AppSettings, StoreError> {
    let rows = sqlx::query!(
        r#"
        SELECT key, value FROM settings
        "#
    )
    .fetch_all(db.pool())
    .await?;

    // Start with defaults
    let mut settings = AppSettings::default();

    // Override with persisted values
    for row in rows {
        let key = row.key.as_deref().unwrap_or("");
        let value = &row.value;

        match key {
            "scheduler_start_hour" => {
                settings.scheduler_start_hour = value.parse().map_err(|_| {
                    StoreError::InvalidData(format!("Invalid scheduler_start_hour: {}", value))
                })?;
            }
            "scheduler_end_hour" => {
                settings.scheduler_end_hour = value.parse().map_err(|_| {
                    StoreError::InvalidData(format!("Invalid scheduler_end_hour: {}", value))
                })?;
            }
            "scheduler_strict_time_window" => {
                settings.scheduler_strict_time_window = value == "true" || value == "1";
            }
            "wabridge_base_url" => {
                settings.wabridge_base_url = value.to_string();
            }
            "wabridge_timeout_ms" => {
                settings.wabridge_timeout_ms = value.parse().map_err(|_| {
                    StoreError::InvalidData(format!("Invalid wabridge_timeout_ms: {}", value))
                })?;
            }
            _ => {
                // Unknown key — log warning but don't fail
                tracing::warn!("Unknown settings key in database: {}", key);
            }
        }
    }

    Ok(settings)
}

/// PATCH /api/settings — merge patch into current settings and persist.
pub async fn save(db: &Db, settings: &AppSettings) -> Result<(), StoreError> {
    // Upsert each field as a separate row
    let fields = vec![
        (
            "scheduler_start_hour",
            settings.scheduler_start_hour.to_string(),
        ),
        (
            "scheduler_end_hour",
            settings.scheduler_end_hour.to_string(),
        ),
        (
            "scheduler_strict_time_window",
            settings.scheduler_strict_time_window.to_string(),
        ),
        ("wabridge_base_url", settings.wabridge_base_url.clone()),
        (
            "wabridge_timeout_ms",
            settings.wabridge_timeout_ms.to_string(),
        ),
    ];

    for (key, value) in fields {
        sqlx::query!(
            r#"
            INSERT INTO settings (key, value)
            VALUES (?, ?)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value
            "#,
            key,
            value
        )
        .execute(db.pool())
        .await?;
    }

    Ok(())
}

/// Merge a partial update onto the current settings and persist.
pub async fn update(db: &Db, patch: UpdateSettingsInput) -> Result<AppSettings, StoreError> {
    let mut current = load(db).await?;

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

    save(db, &current).await?;
    Ok(current)
}
