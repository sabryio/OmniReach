//! TDD tests for settings repository.
//!
//! Tests cover:
//! - load() — returns defaults when no settings exist, overrides with persisted values
//! - save() — persists all fields, upserts on conflict
//! - update() — merges partial updates, preserves unspecified fields

use crate::{StoreError, db::Db, settings};
use omnireach_core::types::{AppSettings, UpdateSettingsInput};
use sqlx::SqlitePool;

async fn setup_test_db() -> Db {
    let pool = SqlitePool::connect("sqlite::memory:")
        .await
        .expect("Failed to create in-memory database");

    // Run migrations
    sqlx::migrate!("./src/migrations")
        .run(&pool)
        .await
        .expect("Failed to run migrations");

    Db::from(pool)
}

// ─── Load Tests ──────────────────────────────────────────────────────────────

#[tokio::test]
async fn test_load_returns_defaults_when_empty() {
    let db = setup_test_db().await;

    let settings = settings::load(&db).await.unwrap();

    // Verify default values from AppSettings::default()
    assert_eq!(settings.scheduler_start_hour, 9);
    assert_eq!(settings.scheduler_end_hour, 21);
    assert_eq!(settings.scheduler_strict_time_window, true);
    assert_eq!(settings.wabridge_base_url, "http://localhost:7171");
    assert_eq!(settings.wabridge_timeout_ms, 5000);
}

#[tokio::test]
async fn test_load_overrides_with_persisted_values() {
    let db = setup_test_db().await;

    // Insert custom settings
    sqlx::query!(
        "INSERT INTO settings (key, value) VALUES (?, ?)",
        "scheduler_start_hour",
        "6"
    )
    .execute(db.pool())
    .await
    .unwrap();

    sqlx::query!(
        "INSERT INTO settings (key, value) VALUES (?, ?)",
        "scheduler_end_hour",
        "20"
    )
    .execute(db.pool())
    .await
    .unwrap();

    sqlx::query!(
        "INSERT INTO settings (key, value) VALUES (?, ?)",
        "scheduler_strict_time_window",
        "false"
    )
    .execute(db.pool())
    .await
    .unwrap();

    sqlx::query!(
        "INSERT INTO settings (key, value) VALUES (?, ?)",
        "wabridge_base_url",
        "http://custom:8080"
    )
    .execute(db.pool())
    .await
    .unwrap();

    sqlx::query!(
        "INSERT INTO settings (key, value) VALUES (?, ?)",
        "wabridge_timeout_ms",
        "60000"
    )
    .execute(db.pool())
    .await
    .unwrap();

    let settings = settings::load(&db).await.unwrap();

    assert_eq!(settings.scheduler_start_hour, 6);
    assert_eq!(settings.scheduler_end_hour, 20);
    assert_eq!(settings.scheduler_strict_time_window, false);
    assert_eq!(settings.wabridge_base_url, "http://custom:8080");
    assert_eq!(settings.wabridge_timeout_ms, 60000);
}

#[tokio::test]
async fn test_load_handles_partial_persisted_values() {
    let db = setup_test_db().await;

    // Only set some values
    sqlx::query!(
        "INSERT INTO settings (key, value) VALUES (?, ?)",
        "scheduler_start_hour",
        "10"
    )
    .execute(db.pool())
    .await
    .unwrap();

    let settings = settings::load(&db).await.unwrap();

    // Overridden value
    assert_eq!(settings.scheduler_start_hour, 10);
    // Default values for unset keys
    assert_eq!(settings.scheduler_end_hour, 21);
    assert_eq!(settings.wabridge_base_url, "http://localhost:7171");
}

#[tokio::test]
async fn test_load_ignores_unknown_keys() {
    let db = setup_test_db().await;

    sqlx::query!(
        "INSERT INTO settings (key, value) VALUES (?, ?)",
        "unknown_key",
        "unknown_value"
    )
    .execute(db.pool())
    .await
    .unwrap();

    // Should not error, just log warning
    let settings = settings::load(&db).await.unwrap();
    assert_eq!(settings.scheduler_start_hour, 9); // Still default
}

#[tokio::test]
async fn test_load_errors_on_invalid_int_value() {
    let db = setup_test_db().await;

    sqlx::query!(
        "INSERT INTO settings (key, value) VALUES (?, ?)",
        "scheduler_start_hour",
        "not_a_number"
    )
    .execute(db.pool())
    .await
    .unwrap();

    let result = settings::load(&db).await;
    assert!(result.is_err());
    assert!(matches!(result.unwrap_err(), StoreError::InvalidData(_)));
}

#[tokio::test]
async fn test_load_parses_bool_true_variants() {
    let db = setup_test_db().await;

    // Test "true"
    sqlx::query!(
        "INSERT INTO settings (key, value) VALUES (?, ?)",
        "scheduler_strict_time_window",
        "true"
    )
    .execute(db.pool())
    .await
    .unwrap();

    let settings = settings::load(&db).await.unwrap();
    assert_eq!(settings.scheduler_strict_time_window, true);

    // Test "1"
    sqlx::query!(
        "UPDATE settings SET value = ? WHERE key = ?",
        "1",
        "scheduler_strict_time_window"
    )
    .execute(db.pool())
    .await
    .unwrap();

    let settings = settings::load(&db).await.unwrap();
    assert_eq!(settings.scheduler_strict_time_window, true);
}

// ─── Save Tests ──────────────────────────────────────────────────────────────

#[tokio::test]
async fn test_save_persists_all_fields() {
    let db = setup_test_db().await;

    let custom_settings = AppSettings {
        scheduler_start_hour: 7,
        scheduler_end_hour: 21,
        scheduler_strict_time_window: false,
        wabridge_base_url: "http://test:9090".to_string(),
        wabridge_timeout_ms: 45000,
    };

    settings::save(&db, &custom_settings).await.unwrap();

    // Verify persisted
    let loaded = settings::load(&db).await.unwrap();
    assert_eq!(loaded.scheduler_start_hour, 7);
    assert_eq!(loaded.scheduler_end_hour, 21);
    assert_eq!(loaded.scheduler_strict_time_window, false);
    assert_eq!(loaded.wabridge_base_url, "http://test:9090");
    assert_eq!(loaded.wabridge_timeout_ms, 45000);
}

#[tokio::test]
async fn test_save_upserts_on_conflict() {
    let db = setup_test_db().await;

    // First save
    let settings1 = AppSettings {
        scheduler_start_hour: 5,
        ..Default::default()
    };
    settings::save(&db, &settings1).await.unwrap();

    // Second save with different value
    let settings2 = AppSettings {
        scheduler_start_hour: 9,
        ..Default::default()
    };
    settings::save(&db, &settings2).await.unwrap();

    // Should have updated, not duplicated
    let loaded = settings::load(&db).await.unwrap();
    assert_eq!(loaded.scheduler_start_hour, 9);

    // Check only one row exists for this key
    let count: i64 =
        sqlx::query_scalar("SELECT COUNT(*) FROM settings WHERE key = 'scheduler_start_hour'")
            .fetch_one(db.pool())
            .await
            .unwrap();
    assert_eq!(count, 1);
}

// ─── Update Tests ────────────────────────────────────────────────────────────

#[tokio::test]
async fn test_update_merges_partial_input() {
    let db = setup_test_db().await;

    // Start with custom settings
    let initial = AppSettings {
        scheduler_start_hour: 6,
        scheduler_end_hour: 20,
        scheduler_strict_time_window: false,
        wabridge_base_url: "http://initial:8080".to_string(),
        wabridge_timeout_ms: 40000,
    };
    settings::save(&db, &initial).await.unwrap();

    // Update only some fields
    let patch = UpdateSettingsInput {
        scheduler_start_hour: Some(10),
        scheduler_end_hour: None,
        scheduler_strict_time_window: Some(true),
        wabridge_base_url: None,
        wabridge_timeout_ms: None,
    };

    let updated = settings::update(&db, patch).await.unwrap();

    // Updated fields
    assert_eq!(updated.scheduler_start_hour, 10);
    assert_eq!(updated.scheduler_strict_time_window, true);
    // Preserved fields
    assert_eq!(updated.scheduler_end_hour, 20);
    assert_eq!(updated.wabridge_base_url, "http://initial:8080");
    assert_eq!(updated.wabridge_timeout_ms, 40000);
}

#[tokio::test]
async fn test_update_returns_merged_result() {
    let db = setup_test_db().await;

    let patch = UpdateSettingsInput {
        scheduler_start_hour: Some(11),
        scheduler_end_hour: None,
        scheduler_strict_time_window: None,
        wabridge_base_url: None,
        wabridge_timeout_ms: None,
    };

    let result = settings::update(&db, patch).await.unwrap();

    // Verify returned value matches what's persisted
    assert_eq!(result.scheduler_start_hour, 11);

    let loaded = settings::load(&db).await.unwrap();
    assert_eq!(loaded.scheduler_start_hour, 11);
}

#[tokio::test]
async fn test_update_with_no_changes() {
    let db = setup_test_db().await;

    // Save initial
    let initial = AppSettings {
        scheduler_start_hour: 7,
        ..Default::default()
    };
    settings::save(&db, &initial).await.unwrap();

    // Update with all None (no-op)
    let patch = UpdateSettingsInput {
        scheduler_start_hour: None,
        scheduler_end_hour: None,
        scheduler_strict_time_window: None,
        wabridge_base_url: None,
        wabridge_timeout_ms: None,
    };

    let updated = settings::update(&db, patch).await.unwrap();

    // Should preserve all values
    assert_eq!(updated.scheduler_start_hour, 7);
    assert_eq!(updated.scheduler_end_hour, 21);
}

#[tokio::test]
async fn test_update_all_fields_at_once() {
    let db = setup_test_db().await;

    let patch = UpdateSettingsInput {
        scheduler_start_hour: Some(5),
        scheduler_end_hour: Some(23),
        scheduler_strict_time_window: Some(false),
        wabridge_base_url: Some("http://updated:7777".to_string()),
        wabridge_timeout_ms: Some(50000),
    };

    let updated = settings::update(&db, patch).await.unwrap();

    assert_eq!(updated.scheduler_start_hour, 5);
    assert_eq!(updated.scheduler_end_hour, 23);
    assert_eq!(updated.scheduler_strict_time_window, false);
    assert_eq!(updated.wabridge_base_url, "http://updated:7777");
    assert_eq!(updated.wabridge_timeout_ms, 50000);
}
