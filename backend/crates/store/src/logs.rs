//! Log entry repository — all SQL for the `logs` table.

use crate::{Db, StoreError};
use omnireach_core::types::{LogCategory, LogEntry, LogLevel};
use uuid::Uuid;

/// GET /api/logs — return most recent `limit` log entries, newest first
pub async fn list_recent(db: &Db, limit: i64) -> Result<Vec<LogEntry>, StoreError> {
    let rows = sqlx::query!(
        r#"
        SELECT id, timestamp, level, category, message, details
        FROM logs
        ORDER BY timestamp DESC
        LIMIT ?
        "#,
        limit
    )
    .fetch_all(db.pool())
    .await?;

    rows.into_iter()
        .map(|row| {
            let id_str = row.id.as_deref().unwrap_or("");
            let id = Uuid::parse_str(id_str).map_err(|_| {
                StoreError::InvalidData(format!("Invalid log entry ID: {}", id_str))
            })?;

            let level_str = row.level.as_str();
            let level = match level_str {
                "info" => LogLevel::Info,
                "warn" => LogLevel::Warn,
                "error" => LogLevel::Error,
                "success" => LogLevel::Success,
                _ => {
                    return Err(StoreError::InvalidData(format!(
                        "Unknown log level: {}",
                        level_str
                    )));
                }
            };

            let category_str = row.category.as_str();
            let category = match category_str {
                "verification" => LogCategory::Verification,
                "send" => LogCategory::Send,
                "rate_limit" => LogCategory::RateLimit,
                "scheduler" => LogCategory::Scheduler,
                "session" => LogCategory::Session,
                "system" => LogCategory::System,
                _ => {
                    return Err(StoreError::InvalidData(format!(
                        "Unknown log category: {}",
                        category_str
                    )));
                }
            };

            let details = match row.details.as_deref() {
                Some(details_str) => Some(serde_json::from_str(details_str).map_err(|e| {
                    StoreError::InvalidData(format!("Invalid details JSON: {}", e))
                })?),
                None => None,
            };

            let timestamp =
                chrono::DateTime::from_timestamp_millis(row.timestamp).ok_or_else(|| {
                    StoreError::InvalidData(format!("Invalid timestamp: {}", row.timestamp))
                })?;

            Ok(LogEntry {
                id,
                timestamp,
                level,
                category,
                message: row.message,
                details,
            })
        })
        .collect()
}

/// INSERT a single log entry
pub async fn insert(db: &Db, entry: LogEntry) -> Result<(), StoreError> {
    let level_str = match entry.level {
        LogLevel::Info => "info",
        LogLevel::Warn => "warn",
        LogLevel::Error => "error",
        LogLevel::Success => "success",
    };

    let category_str = match entry.category {
        LogCategory::Verification => "verification",
        LogCategory::Send => "send",
        LogCategory::RateLimit => "rate_limit",
        LogCategory::Scheduler => "scheduler",
        LogCategory::Session => "session",
        LogCategory::System => "system",
    };

    let details_str = if let Some(details) = entry.details {
        Some(serde_json::to_string(&details)?)
    } else {
        None
    };

    sqlx::query!(
        r#"
        INSERT INTO logs (id, timestamp, level, category, message, details)
        VALUES (?, ?, ?, ?, ?, ?)
        "#,
        entry.id.to_string(),
        entry.timestamp.timestamp_millis(),
        level_str,
        category_str,
        entry.message,
        details_str
    )
    .execute(db.pool())
    .await?;

    Ok(())
}

/// Batch insert log entries
pub async fn insert_many(db: &Db, entries: Vec<LogEntry>) -> Result<(), StoreError> {
    if entries.is_empty() {
        return Ok(());
    }

    let mut tx = db.pool().begin().await?;

    for entry in entries {
        let level_str = match entry.level {
            LogLevel::Info => "info",
            LogLevel::Warn => "warn",
            LogLevel::Error => "error",
            LogLevel::Success => "success",
        };

        let category_str = match entry.category {
            LogCategory::Verification => "verification",
            LogCategory::Send => "send",
            LogCategory::RateLimit => "rate_limit",
            LogCategory::Scheduler => "scheduler",
            LogCategory::Session => "session",
            LogCategory::System => "system",
        };

        let details_str = if let Some(details) = entry.details {
            Some(serde_json::to_string(&details)?)
        } else {
            None
        };

        sqlx::query!(
            r#"
            INSERT INTO logs (id, timestamp, level, category, message, details)
            VALUES (?, ?, ?, ?, ?, ?)
            "#,
            entry.id.to_string(),
            entry.timestamp.timestamp_millis(),
            level_str,
            category_str,
            entry.message,
            details_str
        )
        .execute(&mut *tx)
        .await?;
    }

    tx.commit().await?;
    Ok(())
}

/// DELETE /api/logs — clear all logs
pub async fn clear_all(db: &Db) -> Result<(), StoreError> {
    sqlx::query!("DELETE FROM logs").execute(db.pool()).await?;

    Ok(())
}
