//! Sessions CRUD tests (rate limit tests are in sessions_rate_limit_tests.rs)
//!
//! Tests verify the actual implemented functions:
//! - list_all, get_by_id, insert, delete
//! - update_status (with qr_code_data and phone_number)
//! - reset_limits

#[cfg(test)]
mod tests {
    use crate::{db::Db, sessions};
    use chrono::Utc;
    use omnireach_core::types::{CreateSessionInput, SessionStatus};
    use sqlx::SqlitePool;
    use uuid::Uuid;

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

    // ──────────────────────────────────────────────────────────────────────
    // list_all
    // ──────────────────────────────────────────────────────────────────────

    #[tokio::test]
    async fn test_list_all_returns_all_sessions() {
        let db = setup_test_db().await;

        for i in 0..3 {
            let input = CreateSessionInput {
                name: format!("Session {}", i),
                api_key: format!("key-{}", i),
                hourly_limit: Some(20),
                daily_limit: Some(200),
            };
            sessions::insert(&db, input).await.unwrap();
        }

        let all = sessions::list_all(&db).await.unwrap();

        assert_eq!(all.len(), 3);
    }

    #[tokio::test]
    async fn test_list_all_empty_database() {
        let db = setup_test_db().await;

        let all = sessions::list_all(&db).await.unwrap();

        assert_eq!(all.len(), 0);
    }

    // ──────────────────────────────────────────────────────────────────────
    // get_by_id
    // ──────────────────────────────────────────────────────────────────────

    #[tokio::test]
    async fn test_get_by_id_returns_correct_session() {
        let db = setup_test_db().await;

        let input = CreateSessionInput {
            name: "Test Session".to_string(),
            api_key: "test-key".to_string(),
            hourly_limit: Some(30),
            daily_limit: Some(300),
        };

        let inserted = sessions::insert(&db, input).await.unwrap();
        let retrieved = sessions::get_by_id(&db, inserted.id).await.unwrap();

        assert_eq!(retrieved.id, inserted.id);
        assert_eq!(retrieved.name, "Test Session");
        assert_eq!(retrieved.hourly_limit, 30);
    }

    #[tokio::test]
    async fn test_get_by_id_not_found() {
        let db = setup_test_db().await;
        let fake_id = Uuid::new_v4();

        let result = sessions::get_by_id(&db, fake_id).await;

        assert!(result.is_err());
        assert!(matches!(
            result.unwrap_err(),
            crate::StoreError::NotFound(_)
        ));
    }

    // ──────────────────────────────────────────────────────────────────────
    // insert
    // ──────────────────────────────────────────────────────────────────────

    #[tokio::test]
    async fn test_insert_session_with_custom_limits() {
        let db = setup_test_db().await;

        let input = CreateSessionInput {
            name: "Custom Session".to_string(),
            api_key: "custom-key".to_string(),
            hourly_limit: Some(50),
            daily_limit: Some(500),
        };

        let session = sessions::insert(&db, input).await.unwrap();

        assert_eq!(session.name, "Custom Session");
        assert_eq!(session.hourly_limit, 50);
        assert_eq!(session.daily_limit, 500);
        assert_eq!(session.status, SessionStatus::Disconnected);
        assert_eq!(session.hourly_sent_timestamps.len(), 0);
        assert_eq!(session.daily_sent_timestamps.len(), 0);
    }

    #[tokio::test]
    async fn test_insert_session_with_none_limits_uses_defaults() {
        let db = setup_test_db().await;

        let input = CreateSessionInput {
            name: "Default Limits".to_string(),
            api_key: "default-key".to_string(),
            hourly_limit: None,
            daily_limit: None,
        };

        let session = sessions::insert(&db, input).await.unwrap();

        assert_eq!(session.hourly_limit, 60, "Default hourly limit");
        assert_eq!(session.daily_limit, 600, "Default daily limit");
    }

    // ──────────────────────────────────────────────────────────────────────
    // update_status (with qr_code_data and phone_number)
    // ──────────────────────────────────────────────────────────────────────

    #[tokio::test]
    async fn test_update_status_to_connected() {
        let db = setup_test_db().await;

        let input = CreateSessionInput {
            name: "Status Test".to_string(),
            api_key: "test-key".to_string(),
            hourly_limit: Some(20),
            daily_limit: Some(200),
        };

        let session = sessions::insert(&db, input).await.unwrap();

        sessions::update_status(
            &db,
            session.id,
            SessionStatus::Connected,
            None,
            Some("+201234567890".to_string()),
        )
        .await
        .unwrap();

        let updated = sessions::get_by_id(&db, session.id).await.unwrap();

        assert_eq!(updated.status, SessionStatus::Connected);
        assert_eq!(updated.phone_number, Some("+201234567890".to_string()));
        assert!(updated.last_activity_at.is_some());
    }

    #[tokio::test]
    async fn test_update_status_with_qr_code() {
        let db = setup_test_db().await;

        let input = CreateSessionInput {
            name: "QR Test".to_string(),
            api_key: "test-key".to_string(),
            hourly_limit: Some(20),
            daily_limit: Some(200),
        };

        let session = sessions::insert(&db, input).await.unwrap();

        let qr_data = "data:image/png;base64,iVBORw0KGgo...".to_string();
        sessions::update_status(
            &db,
            session.id,
            SessionStatus::QrRequired,
            Some(qr_data.clone()),
            None,
        )
        .await
        .unwrap();

        let updated = sessions::get_by_id(&db, session.id).await.unwrap();

        assert_eq!(updated.status, SessionStatus::QrRequired);
        assert_eq!(updated.qr_code_data, Some(qr_data));
    }

    #[tokio::test]
    async fn test_update_status_clears_qr_on_connected() {
        let db = setup_test_db().await;

        let input = CreateSessionInput {
            name: "Clear QR Test".to_string(),
            api_key: "test-key".to_string(),
            hourly_limit: Some(20),
            daily_limit: Some(200),
        };

        let session = sessions::insert(&db, input).await.unwrap();

        // Set QR
        sessions::update_status(
            &db,
            session.id,
            SessionStatus::QrRequired,
            Some("qr-data".to_string()),
            None,
        )
        .await
        .unwrap();

        // Clear QR on connected
        sessions::update_status(&db, session.id, SessionStatus::Connected, None, None)
            .await
            .unwrap();

        let updated = sessions::get_by_id(&db, session.id).await.unwrap();

        assert!(updated.qr_code_data.is_none(), "QR should be cleared");
    }

    #[tokio::test]
    async fn test_all_status_values() {
        let db = setup_test_db().await;

        let input = CreateSessionInput {
            name: "All Status Test".to_string(),
            api_key: "test-key".to_string(),
            hourly_limit: Some(20),
            daily_limit: Some(200),
        };

        let session = sessions::insert(&db, input).await.unwrap();

        let statuses = vec![
            SessionStatus::Disconnected,
            SessionStatus::QrRequired,
            SessionStatus::Connecting,
            SessionStatus::Connected,
        ];

        for status in statuses {
            sessions::update_status(&db, session.id, status.clone(), None, None)
                .await
                .unwrap();

            let updated = sessions::get_by_id(&db, session.id).await.unwrap();
            assert_eq!(updated.status, status);
        }
    }

    // ──────────────────────────────────────────────────────────────────────
    // reset_limits
    // ──────────────────────────────────────────────────────────────────────

    #[tokio::test]
    async fn test_reset_limits_clears_timestamps() {
        let db = setup_test_db().await;

        let input = CreateSessionInput {
            name: "Reset Test".to_string(),
            api_key: "test-key".to_string(),
            hourly_limit: Some(10),
            daily_limit: Some(100),
        };

        let session = sessions::insert(&db, input).await.unwrap();

        // Acquire some slots
        let now_ms = Utc::now().timestamp_millis();
        for _ in 0..5 {
            sessions::try_acquire_send_slot(&db, session.id, now_ms)
                .await
                .unwrap();
        }

        // Verify timestamps exist
        let before = sessions::get_by_id(&db, session.id).await.unwrap();
        assert_eq!(before.hourly_sent_timestamps.len(), 5);

        // Reset
        sessions::reset_limits(&db, session.id).await.unwrap();

        // Verify timestamps cleared
        let after = sessions::get_by_id(&db, session.id).await.unwrap();
        assert_eq!(after.hourly_sent_timestamps.len(), 0);
        assert_eq!(after.daily_sent_timestamps.len(), 0);
    }

    // ──────────────────────────────────────────────────────────────────────
    // delete
    // ──────────────────────────────────────────────────────────────────────

    #[tokio::test]
    async fn test_delete_session() {
        let db = setup_test_db().await;

        let input = CreateSessionInput {
            name: "Delete Me".to_string(),
            api_key: "delete-key".to_string(),
            hourly_limit: Some(20),
            daily_limit: Some(200),
        };

        let session = sessions::insert(&db, input).await.unwrap();

        sessions::delete(&db, session.id).await.unwrap();

        let result = sessions::get_by_id(&db, session.id).await;
        assert!(result.is_err());
    }

    // ──────────────────────────────────────────────────────────────────────
    // Data Integrity
    // ──────────────────────────────────────────────────────────────────────

    #[tokio::test]
    async fn test_timestamp_arrays_json_serialization() {
        let db = setup_test_db().await;

        let input = CreateSessionInput {
            name: "JSON Test".to_string(),
            api_key: "test-key".to_string(),
            hourly_limit: Some(10),
            daily_limit: Some(100),
        };

        let session = sessions::insert(&db, input).await.unwrap();

        let now = Utc::now().timestamp_millis();
        sessions::try_acquire_send_slot(&db, session.id, now - 1000)
            .await
            .unwrap();
        sessions::try_acquire_send_slot(&db, session.id, now)
            .await
            .unwrap();

        let retrieved = sessions::get_by_id(&db, session.id).await.unwrap();

        assert_eq!(retrieved.hourly_sent_timestamps.len(), 2);
        assert!(retrieved.hourly_sent_timestamps.contains(&(now - 1000)));
        assert!(retrieved.hourly_sent_timestamps.contains(&now));
    }

    #[tokio::test]
    async fn test_unicode_in_session_name() {
        let db = setup_test_db().await;

        let input = CreateSessionInput {
            name: "صيدلية النور 🏥".to_string(),
            api_key: "unicode-key".to_string(),
            hourly_limit: Some(20),
            daily_limit: Some(200),
        };

        let session = sessions::insert(&db, input).await.unwrap();

        assert_eq!(session.name, "صيدلية النور 🏥");
    }
}
