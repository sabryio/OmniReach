//! Session repository — all SQL for the `sessions` table.

use crate::{Db, StoreError};
use chrono::Utc;
use omnireach_core::types::{CreateSessionInput, Session, SessionStatus};
use uuid::Uuid;

/// GET /api/sessions — return all sessions
///
/// TODO: Phase 2 — implement real SQL query
/// For now, returns hardcoded mock data to verify type parity with frontend.
pub async fn list_all(_db: &Db) -> Result<Vec<Session>, StoreError> {
    let now = Utc::now();
    let mock_sessions = vec![
        Session {
            id: Uuid::parse_str("11111111-1111-1111-1111-111111111111").unwrap(),
            name: "Pharmacy Main Line".to_string(),
            phone_number: Some("+201012345001".to_string()),
            status: SessionStatus::Connected,
            api_key: "mock-api-key-001".to_string(),
            hourly_limit: 100,
            daily_limit: 1000,
            hourly_sent_timestamps: vec![
                now.timestamp_millis() - 300_000,
                now.timestamp_millis() - 600_000,
                now.timestamp_millis() - 900_000,
                now.timestamp_millis() - 1_200_000,
                now.timestamp_millis() - 1_500_000,
            ],
            daily_sent_timestamps: (0..245)
                .map(|i| now.timestamp_millis() - (i * 300_000))
                .collect(),
            qr_code_data: None,
            last_activity_at: Some(now),
        },
        Session {
            id: Uuid::parse_str("22222222-2222-2222-2222-222222222222").unwrap(),
            name: "Customer Support".to_string(),
            phone_number: Some("+201012345002".to_string()),
            status: SessionStatus::Connected,
            api_key: "mock-api-key-002".to_string(),
            hourly_limit: 80,
            daily_limit: 800,
            hourly_sent_timestamps: vec![
                now.timestamp_millis() - 400_000,
                now.timestamp_millis() - 800_000,
                now.timestamp_millis() - 1_200_000,
            ],
            daily_sent_timestamps: (0..156)
                .map(|i| now.timestamp_millis() - (i * 400_000))
                .collect(),
            qr_code_data: None,
            last_activity_at: Some(now),
        },
        Session {
            id: Uuid::parse_str("33333333-3333-3333-3333-333333333333").unwrap(),
            name: "Appointments".to_string(),
            phone_number: Some("+201012345003".to_string()),
            status: SessionStatus::Connected,
            api_key: "mock-api-key-003".to_string(),
            hourly_limit: 60,
            daily_limit: 600,
            hourly_sent_timestamps: vec![
                now.timestamp_millis() - 500_000,
                now.timestamp_millis() - 1_000_000,
            ],
            daily_sent_timestamps: (0..89)
                .map(|i| now.timestamp_millis() - (i * 500_000))
                .collect(),
            qr_code_data: None,
            last_activity_at: Some(now),
        },
    ];
    Ok(mock_sessions)
}

/// GET /api/sessions/:id — return single session by ID
///
/// TODO: Phase 2 — implement real SQL query
pub async fn get_by_id(_db: &Db, id: Uuid) -> Result<Session, StoreError> {
    let sessions = list_all(_db).await?;
    sessions
        .into_iter()
        .find(|s| s.id == id)
        .ok_or_else(|| StoreError::NotFound(format!("Session {} not found", id)))
}

/// POST /api/sessions — create new session
///
/// TODO: Phase 2 — implement real SQL INSERT
pub async fn insert(_db: &Db, input: CreateSessionInput) -> Result<Session, StoreError> {
    let now = Utc::now();
    let new_session = Session {
        id: Uuid::new_v4(),
        name: input.name,
        phone_number: None,
        status: SessionStatus::Disconnected,
        api_key: input.api_key,
        hourly_limit: input.hourly_limit.unwrap_or(60),
        daily_limit: input.daily_limit.unwrap_or(600),
        hourly_sent_timestamps: vec![],
        daily_sent_timestamps: vec![],
        qr_code_data: None,
        last_activity_at: Some(now),
    };
    Ok(new_session)
}

/// PATCH /api/sessions/:id — update session metadata
///
/// TODO: Phase 2 — implement real SQL UPDATE
pub async fn update_status(
    _db: &Db,
    id: Uuid,
    status: SessionStatus,
    qr_code_data: Option<String>,
    phone_number: Option<String>,
) -> Result<Session, StoreError> {
    let mut session = get_by_id(_db, id).await?;
    session.status = status;
    session.qr_code_data = qr_code_data;
    if phone_number.is_some() {
        session.phone_number = phone_number;
    }
    session.last_activity_at = Some(Utc::now());
    Ok(session)
}

/// Appends `now_ms` to both rolling timestamp arrays for rate-limit tracking.
/// Prunes timestamps older than 24 hours to keep the arrays compact.
///
/// TODO: Phase 2 — implement real SQL UPDATE
pub async fn append_sent_timestamp(
    _db: &Db,
    session_id: Uuid,
    now_ms: i64,
) -> Result<(), StoreError> {
    let mut session = get_by_id(_db, session_id).await?;

    let one_hour_ago = now_ms - 3_600_000;
    let one_day_ago = now_ms - 86_400_000;

    // Append and prune hourly
    session.hourly_sent_timestamps.push(now_ms);
    session
        .hourly_sent_timestamps
        .retain(|&ts| ts > one_hour_ago);

    // Append and prune daily
    session.daily_sent_timestamps.push(now_ms);
    session.daily_sent_timestamps.retain(|&ts| ts > one_day_ago);

    // TODO: persist to DB
    Ok(())
}

/// POST /api/sessions/:id/reset-limits — clear timestamp arrays
///
/// TODO: Phase 2 — implement real SQL UPDATE
pub async fn reset_limits(_db: &Db, id: Uuid) -> Result<Session, StoreError> {
    let mut session = get_by_id(_db, id).await?;
    session.hourly_sent_timestamps.clear();
    session.daily_sent_timestamps.clear();
    session.last_activity_at = Some(Utc::now());
    Ok(session)
}

/// DELETE /api/sessions/:id
///
/// TODO: Phase 2 — implement real SQL DELETE
pub async fn delete(_db: &Db, id: Uuid) -> Result<(), StoreError> {
    // Verify session exists
    let _ = get_by_id(_db, id).await?;
    // TODO: DELETE FROM sessions WHERE id = ?
    Ok(())
}
