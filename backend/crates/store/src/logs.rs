//! Log entry repository — all SQL for the `logs` table.

use crate::{Db, StoreError};
use chrono::Utc;
use omnireach_core::types::{LogCategory, LogEntry, LogLevel};
use uuid::Uuid;

/// GET /api/logs — return most recent `limit` log entries, newest first
///
/// TODO: Phase 2 — implement real SQL query
pub async fn list_recent(_db: &Db, _limit: i64) -> Result<Vec<LogEntry>, StoreError> {
    let now = Utc::now();

    let mock = vec![
        LogEntry {
            id: Uuid::parse_str("10000000-0000-0000-0000-000000000001").unwrap(),
            timestamp: now - chrono::Duration::minutes(1),
            level: LogLevel::Info,
            category: LogCategory::Send,
            message: "Message sent successfully to +201012345678".to_string(),
            details: None,
        },
        LogEntry {
            id: Uuid::parse_str("10000000-0000-0000-0000-000000000002").unwrap(),
            timestamp: now - chrono::Duration::minutes(2),
            level: LogLevel::Warn,
            category: LogCategory::RateLimit,
            message: "Rate limit reached for session-001, message held".to_string(),
            details: None,
        },
        LogEntry {
            id: Uuid::parse_str("10000000-0000-0000-0000-000000000003").unwrap(),
            timestamp: now - chrono::Duration::minutes(3),
            level: LogLevel::Info,
            category: LogCategory::Send,
            message: "Campaign 'Monthly Prescription Refill Reminder' started".to_string(),
            details: None,
        },
        LogEntry {
            id: Uuid::parse_str("10000000-0000-0000-0000-000000000004").unwrap(),
            timestamp: now - chrono::Duration::minutes(4),
            level: LogLevel::Error,
            category: LogCategory::Send,
            message: "Failed to send message to +201023456789: Network timeout".to_string(),
            details: None,
        },
        LogEntry {
            id: Uuid::parse_str("10000000-0000-0000-0000-000000000005").unwrap(),
            timestamp: now - chrono::Duration::minutes(5),
            level: LogLevel::Info,
            category: LogCategory::Session,
            message: "Session 'Pharmacy Main Line' connected successfully".to_string(),
            details: None,
        },
    ];

    Ok(mock)
}

/// INSERT a single log entry
///
/// TODO: Phase 2 — implement real SQL INSERT
pub async fn insert(_db: &Db, _entry: LogEntry) -> Result<(), StoreError> {
    Ok(())
}

/// Batch insert log entries
///
/// TODO: Phase 2 — implement real SQL batch INSERT
pub async fn insert_many(_db: &Db, _entries: Vec<LogEntry>) -> Result<(), StoreError> {
    Ok(())
}

/// DELETE /api/logs — clear all logs
///
/// TODO: Phase 2 — implement real SQL DELETE
pub async fn clear_all(_db: &Db) -> Result<(), StoreError> {
    Ok(())
}
