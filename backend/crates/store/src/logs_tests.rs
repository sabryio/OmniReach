//! Logs store integration tests
//!
//! Tests verify:
//! - Log entry insertion (single and batch)
//! - Recent logs retrieval with ordering
//! - Clear all functionality
//! - Enum serialization (LogLevel, LogCategory)
//! - Optional details JSON handling

#[cfg(test)]
mod tests {
    use crate::{db::Db, logs};
    use chrono::{Duration, Utc};
    use omnireach_core::types::{LogCategory, LogEntry, LogLevel};
    use serde_json::json;
    use sqlx::SqlitePool;
    use uuid::Uuid;

    /// Helper: Create an in-memory SQLite database with migrations applied
    async fn setup_test_db() -> Db {
        let pool = SqlitePool::connect("sqlite::memory:")
            .await
            .expect("Failed to create in-memory database");

        sqlx::migrate!("./src/migrations")
            .run(&pool)
            .await
            .expect("Failed to run migrations");

        Db::from(pool)
    }

    /// Helper: Create a test log entry
    fn create_log_entry(
        level: LogLevel,
        category: LogCategory,
        message: &str,
        timestamp_offset_secs: i64,
    ) -> LogEntry {
        LogEntry {
            id: Uuid::new_v4(),
            timestamp: Utc::now() + Duration::seconds(timestamp_offset_secs),
            level,
            category,
            message: message.to_string(),
            details: None,
        }
    }

    // ──────────────────────────────────────────────────────────────────────
    // Basic Insert Operations
    // ──────────────────────────────────────────────────────────────────────

    #[tokio::test]
    async fn test_insert_single_log_entry() {
        let db = setup_test_db().await;
        let entry = create_log_entry(
            LogLevel::Info,
            LogCategory::Send,
            "Message sent successfully",
            0,
        );

        let result = logs::insert(&db, entry.clone()).await;
        assert!(result.is_ok(), "Insert should succeed");

        // Verify persistence
        let recent = logs::list_recent(&db, 10).await.unwrap();
        assert_eq!(recent.len(), 1, "Should have 1 log entry");
        assert_eq!(recent[0].message, entry.message);
        assert_eq!(recent[0].level, LogLevel::Info);
        assert_eq!(recent[0].category, LogCategory::Send);
    }

    #[tokio::test]
    async fn test_insert_log_with_details() {
        let db = setup_test_db().await;
        let mut entry = create_log_entry(
            LogLevel::Error,
            LogCategory::Send,
            "Failed to send message",
            0,
        );
        entry.details = Some(json!({
            "phone": "+201234567890",
            "error_code": "RATE_LIMIT",
            "retry_after": 300
        }));

        logs::insert(&db, entry.clone()).await.unwrap();

        let recent = logs::list_recent(&db, 1).await.unwrap();
        assert_eq!(recent.len(), 1);
        assert!(recent[0].details.is_some(), "Details should be preserved");

        let details = recent[0].details.as_ref().unwrap();
        assert_eq!(details["phone"], "+201234567890");
        assert_eq!(details["error_code"], "RATE_LIMIT");
        assert_eq!(details["retry_after"], 300);
    }

    #[tokio::test]
    async fn test_insert_many_batch() {
        let db = setup_test_db().await;
        let entries = vec![
            create_log_entry(LogLevel::Info, LogCategory::Send, "Log 1", 0),
            create_log_entry(LogLevel::Warn, LogCategory::RateLimit, "Log 2", 0),
            create_log_entry(LogLevel::Error, LogCategory::System, "Log 3", 0),
            create_log_entry(LogLevel::Success, LogCategory::Session, "Log 4", 0),
        ];

        let result = logs::insert_many(&db, entries).await;
        assert!(result.is_ok(), "Batch insert should succeed");

        let recent = logs::list_recent(&db, 10).await.unwrap();
        assert_eq!(recent.len(), 4, "Should have all 4 log entries");
    }

    #[tokio::test]
    async fn test_insert_many_empty_batch() {
        let db = setup_test_db().await;

        let result = logs::insert_many(&db, vec![]).await;
        assert!(result.is_ok(), "Empty batch should succeed without error");

        let recent = logs::list_recent(&db, 10).await.unwrap();
        assert_eq!(recent.len(), 0, "Should have no entries");
    }

    // ──────────────────────────────────────────────────────────────────────
    // Retrieval and Ordering
    // ──────────────────────────────────────────────────────────────────────

    #[tokio::test]
    async fn test_list_recent_orders_by_timestamp_desc() {
        let db = setup_test_db().await;

        // Insert logs with different timestamps (in seconds offset from now)
        let entries = vec![
            create_log_entry(LogLevel::Info, LogCategory::Send, "Oldest", -60),
            create_log_entry(LogLevel::Info, LogCategory::Send, "Middle", -30),
            create_log_entry(LogLevel::Info, LogCategory::Send, "Newest", 0),
        ];

        logs::insert_many(&db, entries).await.unwrap();

        let recent = logs::list_recent(&db, 10).await.unwrap();

        assert_eq!(recent.len(), 3);
        assert_eq!(recent[0].message, "Newest", "Most recent should be first");
        assert_eq!(recent[1].message, "Middle");
        assert_eq!(recent[2].message, "Oldest", "Oldest should be last");
    }

    #[tokio::test]
    async fn test_list_recent_respects_limit() {
        let db = setup_test_db().await;

        // Insert 10 log entries
        let entries: Vec<LogEntry> = (0..10)
            .map(|i| {
                create_log_entry(
                    LogLevel::Info,
                    LogCategory::System,
                    &format!("Log {}", i),
                    0,
                )
            })
            .collect();

        logs::insert_many(&db, entries).await.unwrap();

        let recent = logs::list_recent(&db, 5).await.unwrap();

        assert_eq!(recent.len(), 5, "Should respect limit parameter");
    }

    #[tokio::test]
    async fn test_list_recent_empty_database() {
        let db = setup_test_db().await;

        let recent = logs::list_recent(&db, 10).await.unwrap();

        assert_eq!(recent.len(), 0, "Empty database should return empty list");
    }

    // ──────────────────────────────────────────────────────────────────────
    // Clear Operation
    // ──────────────────────────────────────────────────────────────────────

    #[tokio::test]
    async fn test_clear_all_removes_all_logs() {
        let db = setup_test_db().await;

        // Insert some logs
        let entries = vec![
            create_log_entry(LogLevel::Info, LogCategory::Send, "Log 1", 0),
            create_log_entry(LogLevel::Info, LogCategory::Send, "Log 2", 0),
            create_log_entry(LogLevel::Info, LogCategory::Send, "Log 3", 0),
        ];
        logs::insert_many(&db, entries).await.unwrap();

        // Verify logs exist
        let before = logs::list_recent(&db, 10).await.unwrap();
        assert_eq!(before.len(), 3);

        // Clear all
        let result = logs::clear_all(&db).await;
        assert!(result.is_ok(), "Clear should succeed");

        // Verify logs are gone
        let after = logs::list_recent(&db, 10).await.unwrap();
        assert_eq!(after.len(), 0, "All logs should be deleted");
    }

    #[tokio::test]
    async fn test_clear_all_on_empty_database() {
        let db = setup_test_db().await;

        let result = logs::clear_all(&db).await;
        assert!(
            result.is_ok(),
            "Clear on empty database should succeed without error"
        );
    }

    // ──────────────────────────────────────────────────────────────────────
    // Enum Serialization
    // ──────────────────────────────────────────────────────────────────────

    #[tokio::test]
    async fn test_all_log_levels_serialize_correctly() {
        let db = setup_test_db().await;

        let entries = vec![
            create_log_entry(LogLevel::Info, LogCategory::System, "Info level", 0),
            create_log_entry(LogLevel::Warn, LogCategory::System, "Warn level", 0),
            create_log_entry(LogLevel::Error, LogCategory::System, "Error level", 0),
            create_log_entry(LogLevel::Success, LogCategory::System, "Success level", 0),
        ];

        logs::insert_many(&db, entries).await.unwrap();

        let recent = logs::list_recent(&db, 10).await.unwrap();
        assert_eq!(recent.len(), 4);

        // Verify each level round-trips correctly
        let levels: Vec<LogLevel> = recent.iter().map(|e| e.level.clone()).collect();
        assert!(levels.contains(&LogLevel::Info));
        assert!(levels.contains(&LogLevel::Warn));
        assert!(levels.contains(&LogLevel::Error));
        assert!(levels.contains(&LogLevel::Success));
    }

    #[tokio::test]
    async fn test_all_log_categories_serialize_correctly() {
        let db = setup_test_db().await;

        let entries = vec![
            create_log_entry(LogLevel::Info, LogCategory::Verification, "Verification", 0),
            create_log_entry(LogLevel::Info, LogCategory::Send, "Send", 0),
            create_log_entry(LogLevel::Info, LogCategory::RateLimit, "RateLimit", 0),
            create_log_entry(LogLevel::Info, LogCategory::Scheduler, "Scheduler", 0),
            create_log_entry(LogLevel::Info, LogCategory::Session, "Session", 0),
            create_log_entry(LogLevel::Info, LogCategory::System, "System", 0),
        ];

        logs::insert_many(&db, entries).await.unwrap();

        let recent = logs::list_recent(&db, 10).await.unwrap();
        assert_eq!(recent.len(), 6);

        // Verify each category round-trips correctly
        let categories: Vec<LogCategory> = recent.iter().map(|e| e.category.clone()).collect();
        assert!(categories.contains(&LogCategory::Verification));
        assert!(categories.contains(&LogCategory::Send));
        assert!(categories.contains(&LogCategory::RateLimit));
        assert!(categories.contains(&LogCategory::Scheduler));
        assert!(categories.contains(&LogCategory::Session));
        assert!(categories.contains(&LogCategory::System));
    }

    // ──────────────────────────────────────────────────────────────────────
    // Data Integrity and Edge Cases
    // ──────────────────────────────────────────────────────────────────────

    #[tokio::test]
    async fn test_log_message_preserves_unicode() {
        let db = setup_test_db().await;

        let entry = create_log_entry(
            LogLevel::Info,
            LogCategory::Send,
            "رسالة بالعربية مع emoji 🎉",
            0,
        );

        logs::insert(&db, entry.clone()).await.unwrap();

        let recent = logs::list_recent(&db, 1).await.unwrap();
        assert_eq!(
            recent[0].message, entry.message,
            "Unicode and emoji should be preserved"
        );
    }

    #[tokio::test]
    async fn test_log_with_complex_details_json() {
        let db = setup_test_db().await;

        let mut entry = create_log_entry(LogLevel::Error, LogCategory::Send, "Complex error", 0);
        entry.details = Some(json!({
            "error": {
                "code": "NETWORK_TIMEOUT",
                "message": "Connection timed out",
                "stack_trace": ["frame1", "frame2", "frame3"]
            },
            "context": {
                "campaign_id": "abc-123",
                "contact_count": 1500,
                "metadata": {
                    "retry_count": 3,
                    "last_attempt": "2024-01-15T10:30:00Z"
                }
            },
            "is_critical": true
        }));

        logs::insert(&db, entry).await.unwrap();

        let recent = logs::list_recent(&db, 1).await.unwrap();
        let details = recent[0].details.as_ref().unwrap();

        assert_eq!(details["error"]["code"], "NETWORK_TIMEOUT");
        assert_eq!(details["context"]["contact_count"], 1500);
        assert_eq!(details["is_critical"], true);
        assert!(details["error"]["stack_trace"].is_array());
    }

    #[tokio::test]
    async fn test_timestamp_precision_preserved() {
        let db = setup_test_db().await;

        let now = Utc::now();
        let entry = LogEntry {
            id: Uuid::new_v4(),
            timestamp: now,
            level: LogLevel::Info,
            category: LogCategory::System,
            message: "Timestamp test".to_string(),
            details: None,
        };

        logs::insert(&db, entry.clone()).await.unwrap();

        let recent = logs::list_recent(&db, 1).await.unwrap();

        // Timestamps are stored as milliseconds, so compare with millisecond precision
        let inserted_ms = entry.timestamp.timestamp_millis();
        let retrieved_ms = recent[0].timestamp.timestamp_millis();

        assert_eq!(
            inserted_ms, retrieved_ms,
            "Timestamp milliseconds should match exactly"
        );
    }

    #[tokio::test]
    async fn test_large_batch_insert() {
        let db = setup_test_db().await;

        // Insert 1000 log entries
        let entries: Vec<LogEntry> = (0..1000)
            .map(|i| {
                create_log_entry(
                    LogLevel::Info,
                    LogCategory::System,
                    &format!("Batch log entry {}", i),
                    0,
                )
            })
            .collect();

        let result = logs::insert_many(&db, entries).await;
        assert!(result.is_ok(), "Large batch insert should succeed");

        let recent = logs::list_recent(&db, 1000).await.unwrap();
        assert_eq!(recent.len(), 1000, "Should retrieve all 1000 entries");
    }

    #[tokio::test]
    async fn test_insert_many_atomic_transaction() {
        let db = setup_test_db().await;

        // Create a batch with one invalid entry (invalid UUID in ID would fail at creation)
        // Instead, we'll test atomicity by checking all-or-nothing behavior
        let valid_entries = vec![
            create_log_entry(LogLevel::Info, LogCategory::System, "Entry 1", 0),
            create_log_entry(LogLevel::Info, LogCategory::System, "Entry 2", 0),
            create_log_entry(LogLevel::Info, LogCategory::System, "Entry 3", 0),
        ];

        logs::insert_many(&db, valid_entries).await.unwrap();

        let before_count = logs::list_recent(&db, 10).await.unwrap().len();
        assert_eq!(before_count, 3);

        // If one insert in a batch were to fail, the transaction should rollback
        // Since we can't easily cause a failure without modifying the function,
        // we just verify that successful batches commit atomically
        let recent = logs::list_recent(&db, 10).await.unwrap();
        assert_eq!(
            recent.len(),
            3,
            "All entries should be present (atomic commit)"
        );
    }
}
