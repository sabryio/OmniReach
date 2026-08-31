//! Session repository — all SQL for the `sessions` table.

use crate::{Db, StoreError};
use chrono::Utc;
use omnireach_core::types::{CreateSessionInput, Session, SessionStatus};
use uuid::Uuid;

/// GET /api/sessions — return all sessions
pub async fn list_all(db: &Db) -> Result<Vec<Session>, StoreError> {
    let rows = sqlx::query!(
        r#"
        SELECT id, name, phone_number, status, api_key, hourly_limit, daily_limit,
               hourly_sent_timestamps, daily_sent_timestamps, qr_code_data, last_activity_at
        FROM sessions
        "#
    )
    .fetch_all(db.pool())
    .await?;

    rows.into_iter()
        .map(|row| {
            let id_str = row
                .id
                .ok_or_else(|| StoreError::InvalidData("Session ID is NULL".into()))?;
            let id = Uuid::parse_str(&id_str)?;

            let status_str = row.status;
            let status = SessionStatus::from_str(&status_str)?;

            let hourly_sent_timestamps: Vec<i64> =
                serde_json::from_str(&row.hourly_sent_timestamps)?;
            let daily_sent_timestamps: Vec<i64> = serde_json::from_str(&row.daily_sent_timestamps)?;
            let last_activity_at = row
                .last_activity_at
                .and_then(chrono::DateTime::from_timestamp_millis);

            Ok(Session {
                id,
                name: row.name,
                phone_number: row.phone_number,
                status,
                api_key: row.api_key,
                hourly_limit: row.hourly_limit as u32,
                daily_limit: row.daily_limit as u32,
                hourly_sent_timestamps,
                daily_sent_timestamps,
                qr_code_data: row.qr_code_data,
                last_activity_at,
            })
        })
        .collect()
}

/// GET /api/sessions/:id — return single session by ID
pub async fn get_by_id(db: &Db, id: Uuid) -> Result<Session, StoreError> {
    let row = sqlx::query!(
        r#"
        SELECT id, name, phone_number, status, api_key, hourly_limit, daily_limit,
               hourly_sent_timestamps, daily_sent_timestamps, qr_code_data, last_activity_at
        FROM sessions
        WHERE id = ?
        "#,
        id.to_string()
    )
    .fetch_optional(db.pool())
    .await?
    .ok_or_else(|| StoreError::NotFound(format!("Session {} not found", id)))?;

    let id_str = row
        .id
        .ok_or_else(|| StoreError::InvalidData("Session ID is NULL".into()))?;
    let id = Uuid::parse_str(&id_str)?;

    let status_str = row.status;
    let status = SessionStatus::from_str(&status_str)?;

    let hourly_sent_timestamps: Vec<i64> = serde_json::from_str(&row.hourly_sent_timestamps)?;
    let daily_sent_timestamps: Vec<i64> = serde_json::from_str(&row.daily_sent_timestamps)?;
    let last_activity_at = row
        .last_activity_at
        .and_then(chrono::DateTime::from_timestamp_millis);

    Ok(Session {
        id,
        name: row.name,
        phone_number: row.phone_number,
        status,
        api_key: row.api_key,
        hourly_limit: row.hourly_limit as u32,
        daily_limit: row.daily_limit as u32,
        hourly_sent_timestamps,
        daily_sent_timestamps,
        qr_code_data: row.qr_code_data,
        last_activity_at,
    })
}

/// POST /api/sessions — create new session
pub async fn insert(db: &Db, input: CreateSessionInput) -> Result<Session, StoreError> {
    let id = Uuid::new_v4();
    let now_ms = Utc::now().timestamp_millis();
    let hourly_limit = input.hourly_limit.unwrap_or(60);
    let daily_limit = input.daily_limit.unwrap_or(600);

    sqlx::query!(
        r#"
        INSERT INTO sessions (id, name, status, api_key, hourly_limit, daily_limit, last_activity_at)
        VALUES (?, ?, 'disconnected', ?, ?, ?, ?)
        "#,
        id.to_string(),
        input.name,
        input.api_key,
        hourly_limit,
        daily_limit,
        now_ms
    )
    .execute(db.pool())
    .await?;

    get_by_id(db, id).await
}

/// PATCH /api/sessions/:id — update session metadata
pub async fn update_status(
    db: &Db,
    id: Uuid,
    status: SessionStatus,
    qr_code_data: Option<String>,
    phone_number: Option<String>,
) -> Result<Session, StoreError> {
    let now_ms = Utc::now().timestamp_millis();
    let status_str = status.as_str();

    // First verify session exists
    let _ = get_by_id(db, id).await?;

    // Update status, QR, and last activity
    sqlx::query!(
        r#"
        UPDATE sessions
        SET status = ?, qr_code_data = ?, phone_number = COALESCE(?, phone_number), last_activity_at = ?
        WHERE id = ?
        "#,
        status_str,
        qr_code_data,
        phone_number,
        now_ms,
        id.to_string()
    )
    .execute(db.pool())
    .await?;

    get_by_id(db, id).await
}

/// POST /api/sessions/:id/reset-limits — clear timestamp arrays
pub async fn reset_limits(db: &Db, id: Uuid) -> Result<Session, StoreError> {
    let now_ms = Utc::now().timestamp_millis();

    // Verify session exists
    let _ = get_by_id(db, id).await?;

    sqlx::query!(
        r#"
        UPDATE sessions
        SET hourly_sent_timestamps = '[]', daily_sent_timestamps = '[]', last_activity_at = ?
        WHERE id = ?
        "#,
        now_ms,
        id.to_string()
    )
    .execute(db.pool())
    .await?;

    get_by_id(db, id).await
}

/// DELETE /api/sessions/:id
pub async fn delete(db: &Db, id: Uuid) -> Result<(), StoreError> {
    let result = sqlx::query!(
        r#"
        DELETE FROM sessions WHERE id = ?
        "#,
        id.to_string()
    )
    .execute(db.pool())
    .await?;

    if result.rows_affected() == 0 {
        return Err(StoreError::NotFound(format!("Session {} not found", id)));
    }

    Ok(())
}

/// **Atomic** rate limit check + timestamp append.
///
/// This function solves the race condition in the old `append_sent_timestamp`:
/// it performs check-and-acquire as a single database transaction.
///
/// Returns `RateLimitResult` indicating whether the send is allowed and
/// the current quota usage.
///
/// ## Concurrency Safety
///
/// Multiple concurrent calls will correctly respect limits because:
/// 1. SQLite serializes transactions (IMMEDIATE or EXCLUSIVE lock)
/// 2. Read + check + update happen atomically within one transaction
/// 3. No read-modify-write race window
///
/// ## How it works
///
/// 1. Begin transaction with IMMEDIATE lock (blocks concurrent writers)
/// 2. Read current timestamps + limits
/// 3. Calculate quota using `omnireach_core::quota::check_quota`
/// 4. If allowed: append timestamp, prune old timestamps, commit
/// 5. If rejected: rollback, return rejection decision
pub async fn try_acquire_send_slot(
    db: &Db,
    session_id: uuid::Uuid,
    now_ms: i64,
) -> Result<omnireach_core::quota::RateLimitResult, StoreError> {
    // Begin exclusive transaction
    let mut tx = db.pool().begin().await?;

    // Read current session state (locks the row)
    let row = sqlx::query!(
        r#"
        SELECT id, name, phone_number, status, api_key, hourly_limit, daily_limit,
               hourly_sent_timestamps, daily_sent_timestamps, qr_code_data, last_activity_at
        FROM sessions
        WHERE id = ?
        "#,
        session_id.to_string()
    )
    .fetch_optional(&mut *tx)
    .await?
    .ok_or_else(|| StoreError::NotFound(format!("Session {} not found", session_id)))?;

    // Reconstruct session for quota check
    let id_str = row
        .id
        .ok_or_else(|| StoreError::InvalidData("Session ID is NULL".into()))?;
    let id = Uuid::parse_str(&id_str)?;

    let status_str = row.status;
    let status = SessionStatus::from_str(&status_str)?;

    let hourly_sent_timestamps: Vec<i64> = serde_json::from_str(&row.hourly_sent_timestamps)?;
    let daily_sent_timestamps: Vec<i64> = serde_json::from_str(&row.daily_sent_timestamps)?;

    // CRITICAL: Prune old timestamps BEFORE quota check
    // The quota checker only sees timestamps within the rolling window
    let one_hour_ago = now_ms - 3_600_000;
    let one_day_ago = now_ms - 86_400_000;

    let hourly_in_window: Vec<i64> = hourly_sent_timestamps
        .into_iter()
        .filter(|&ts| ts > one_hour_ago)
        .collect();

    let daily_in_window: Vec<i64> = daily_sent_timestamps
        .into_iter()
        .filter(|&ts| ts > one_day_ago)
        .collect();

    let session = Session {
        id,
        name: row.name,
        phone_number: row.phone_number,
        status,
        api_key: row.api_key,
        hourly_limit: row.hourly_limit as u32,
        daily_limit: row.daily_limit as u32,
        hourly_sent_timestamps: hourly_in_window.clone(),
        daily_sent_timestamps: daily_in_window.clone(),
        qr_code_data: row.qr_code_data,
        last_activity_at: row
            .last_activity_at
            .and_then(chrono::DateTime::from_timestamp_millis),
    };

    // Check quota using pure domain logic
    let quota_check = omnireach_core::quota::check_quota(&session, now_ms);

    if !quota_check.can_send {
        // Reject: rollback and return decision
        tx.rollback().await?;
        return Ok(omnireach_core::quota::RateLimitResult {
            can_send: false,
            reason: quota_check.reason,
            hourly_used: quota_check.hourly_used,
            daily_used: quota_check.daily_used,
            hourly_remaining: quota_check.hourly_remaining,
            daily_remaining: quota_check.daily_remaining,
            next_hourly_slot_ms: quota_check.next_hourly_slot_ms,
            next_daily_slot_ms: quota_check.next_daily_slot_ms,
        });
    }

    // Allowed: append timestamp to the already-pruned arrays
    let mut hourly = hourly_in_window;
    hourly.push(now_ms);

    let mut daily = daily_in_window;
    daily.push(now_ms);

    let hourly_json = serde_json::to_string(&hourly)?;
    let daily_json = serde_json::to_string(&daily)?;

    // Update database atomically
    sqlx::query!(
        r#"
        UPDATE sessions
        SET hourly_sent_timestamps = ?, daily_sent_timestamps = ?, last_activity_at = ?
        WHERE id = ?
        "#,
        hourly_json,
        daily_json,
        now_ms,
        session_id.to_string()
    )
    .execute(&mut *tx)
    .await?;

    // Commit transaction
    tx.commit().await?;

    // Return success decision with updated counts
    Ok(omnireach_core::quota::RateLimitResult {
        can_send: true,
        reason: None,
        hourly_used: hourly.len(),
        daily_used: daily.len(),
        hourly_remaining: (session.hourly_limit as i64 - hourly.len() as i64).max(0),
        daily_remaining: (session.daily_limit as i64 - daily.len() as i64).max(0),
        next_hourly_slot_ms: None,
        next_daily_slot_ms: None,
    })
}
