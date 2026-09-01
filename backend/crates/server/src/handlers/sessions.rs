//! Session handlers + SSE stream endpoint.
//!
//! Route → Handler mapping:
//!   GET    /api/events                      → sse_handler
//!   GET    /api/sessions                    → list
//!   POST   /api/sessions                    → create
//!   PATCH  /api/sessions/:id                → update
//!   DELETE /api/sessions/:id                → destroy
//!   POST   /api/sessions/:id/sync           → sync
//!   POST   /api/sessions/:id/reset-limits   → reset_limits
//!   POST   /api/sessions/:id/send-test      → send_test

use crate::{error::ApiError, state::AppState};
use axum::{
    Json,
    extract::{Path, State},
    http::StatusCode,
    response::sse::{Event, KeepAlive, Sse},
};
use futures::stream::Stream;
use omnireach_core::types::CreateSessionInput;
use std::convert::Infallible;
use uuid::Uuid;

// ── SSE ───────────────────────────────────────────────────────────────────────

/// GET /api/events
/// Opens a long-lived SSE connection; streams `SseEvent` frames to the client.
///
/// TODO: implement — subscribe to SseBroadcaster, map to Event, return Sse stream.
pub async fn sse_handler(
    State(state): State<AppState>,
) -> Sse<impl Stream<Item = Result<Event, Infallible>>> {
    use futures::StreamExt;
    use tokio_stream::wrappers::BroadcastStream;

    let rx = state.sse.subscribe();
    let stream = BroadcastStream::new(rx)
        .filter_map(|r| async move { r.ok() })
        .map(|ev| Ok(ev.into_axum_event()));

    Sse::new(stream).keep_alive(KeepAlive::default())
}

// ── Sessions ──────────────────────────────────────────────────────────────────

/// GET /api/sessions
pub async fn list(
    State(state): State<AppState>,
) -> Result<Json<Vec<omnireach_core::types::Session>>, ApiError> {
    let sessions = omnireach_store::sessions::list_all(&state.db).await?;
    Ok(Json(sessions))
}

/// POST /api/sessions
pub async fn create(
    State(state): State<AppState>,
    Json(input): Json<CreateSessionInput>,
) -> Result<(StatusCode, Json<omnireach_core::types::Session>), ApiError> {
    let session = omnireach_store::sessions::insert(&state.db, input).await?;
    // TODO: emit SSE event for new session
    // state.sse.send(SseEvent::SessionCreated { ... })?;
    Ok((StatusCode::CREATED, Json(session)))
}

/// PATCH /api/sessions/:id
pub async fn update(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(patch): Json<serde_json::Value>,
) -> Result<Json<omnireach_core::types::Session>, ApiError> {
    // Extract fields from patch object
    let name = patch.get("name").and_then(|v| v.as_str());
    let hourly_limit = patch
        .get("hourlyLimit")
        .and_then(|v| v.as_u64())
        .map(|v| v as u32);
    let daily_limit = patch
        .get("dailyLimit")
        .and_then(|v| v.as_u64())
        .map(|v| v as u32);

    // TODO: Phase 2 — implement partial update in store layer
    // For now, just fetch and return the existing session
    let mut session = omnireach_store::sessions::get_by_id(&state.db, id).await?;

    if let Some(n) = name {
        session.name = n.to_string();
    }
    if let Some(h) = hourly_limit {
        session.hourly_limit = h;
    }
    if let Some(d) = daily_limit {
        session.daily_limit = d;
    }

    // TODO: persist changes to DB
    // TODO: emit SSE event
    Ok(Json(session))
}

/// DELETE /api/sessions/:id
pub async fn destroy(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<StatusCode, ApiError> {
    omnireach_store::sessions::delete(&state.db, id).await?;
    // TODO: emit SSE event
    // state.sse.send(SseEvent::SessionDeleted { id })?;
    Ok(StatusCode::NO_CONTENT)
}

/// POST /api/sessions/:id/sync
pub async fn sync(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<omnireach_core::types::Session>, ApiError> {
    // TODO: Phase 2 — implement real WABridge sync
    // 1. load session from DB to get api_key
    // 2. state.wa.get_session(wabridge_id, api_key).await
    // 3. store::sessions::update_status(...)
    // 4. After status update, emit SSE:
    //    state.sse.send(crate::sse::SseEvent::SessionStatus {
    //        session_id: session.id.to_string(),
    //        status: session.status.as_str().to_string(),
    //    });

    // For now, just return the existing session
    let session = omnireach_store::sessions::get_by_id(&state.db, id).await?;
    Ok(Json(session))
}

/// POST /api/sessions/:id/reset-limits
pub async fn reset_limits(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<omnireach_core::types::Session>, ApiError> {
    let session = omnireach_store::sessions::reset_limits(&state.db, id).await?;
    // TODO: emit SSE event
    // state.sse.send(SseEvent::SessionLimitsReset { id })?;
    Ok(Json(session))
}

#[derive(serde::Deserialize)]
pub struct SendTestRequest {
    pub phone: String,
    pub message: String,
}

/// POST /api/sessions/:id/send-test
pub async fn send_test(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(body): Json<SendTestRequest>,
) -> Result<StatusCode, ApiError> {
    let now_ms = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_millis() as i64;

    // Try to acquire send slot (checks quota and increments atomically)
    let result = omnireach_store::sessions::try_acquire_send_slot(&state.db, id, now_ms).await?;

    if !result.can_send {
        return Err(ApiError::BadRequest(
            result
                .reason
                .unwrap_or_else(|| "Session quota exhausted".to_string()),
        ));
    }

    // Load session to get phone number (API key)
    let session = omnireach_store::sessions::get_by_id(&state.db, id).await?;

    // Build JID and send message
    let normalized_phone = body.phone.trim().trim_start_matches('+');
    let jid = format!("{}@s.whatsapp.net", normalized_phone);

    state
        .wa
        .send_text(&jid, &body.message, &session.phone_number)
        .await?;

    // Log the test send
    let log_entry = omnireach_core::types::LogEntry {
        id: Uuid::new_v4(),
        timestamp: chrono::Utc::now(),
        level: omnireach_core::types::LogLevel::Info,
        category: omnireach_core::types::LogCategory::Send,
        message: format!(
            "Test message sent to {} via session {}",
            body.phone, session.name
        ),
        details: None,
    };
    omnireach_store::logs::insert(&state.db, log_entry).await?;

    Ok(StatusCode::OK)
}
