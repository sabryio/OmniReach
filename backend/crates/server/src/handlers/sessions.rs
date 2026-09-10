//! Session handlers + SSE stream endpoint.
//!
//! Route → Handler mapping:
//!   GET    /api/events                      → sse_handler
//!   GET    /api/sessions                    → list
//!   GET    /api/sessions/:id                → get
//!   POST   /api/sessions                    → create
//!   PATCH  /api/sessions/:id                → update
//!   DELETE /api/sessions/:id                → destroy
//!   POST   /api/sessions/:id/sync           → sync
//!   POST   /api/sessions/:id/reset-limits   → reset_limits
//!   POST   /api/sessions/:id/send-test      → send_test

use crate::{error::ApiError, sse::SseEvent, state::AppState};
use axum::{
    Json,
    extract::{Path, State},
    response::sse::{Event, KeepAlive, Sse},
};
use futures::{StreamExt, stream::Stream};
use omnireach_core::types::CreateSessionInput;
use std::{convert::Infallible, time::Duration};
use tokio_stream::{iter, wrappers::BroadcastStream};
use uuid::Uuid;

// ── SSE helpers ───────────────────────────────────────────────────────────────

fn sse_flush() -> Result<Event, Infallible> {
    Ok(Event::default().comment(""))
}

fn sse_close() -> Result<Event, Infallible> {
    Ok(Event::default().event("close").data(""))
}

fn sse_message<T: serde::Serialize>(payload: &T) -> Result<Event, Infallible> {
    let data = serde_json::to_string(payload).unwrap_or_default();
    Ok(Event::default().event("message").data(data))
}

/// Wraps an inner stream with a flush header and close trailer.
fn sse_stream<S>(inner: S) -> impl Stream<Item = Result<Event, Infallible>> + Send + 'static
where
    S: Stream<Item = Result<Event, Infallible>> + Send + 'static,
{
    iter([sse_flush()]).chain(inner).chain(iter([sse_close()]))
}

// ── SSE ───────────────────────────────────────────────────────────────────────

/// GET /api/events
/// Opens a long-lived SSE connection; streams `SseEvent` frames to the client.
#[rorpc::get("/api/events", data = "SseEvent")]
pub async fn events(
    State(state): State<AppState>,
) -> Sse<impl Stream<Item = Result<Event, Infallible>>> {
    let rx = state.sse.subscribe();

    let broadcast = BroadcastStream::new(rx)
        .filter_map(|r| async move { r.ok() })
        .enumerate()
        .map(|(_id, ev)| sse_message(&ev));

    Sse::new(sse_stream(broadcast))
        .keep_alive(KeepAlive::new().interval(Duration::from_secs(15)).text(""))
}

// ── Sessions ──────────────────────────────────────────────────────────────────

/// GET /api/sessions
#[rorpc::get("/api/sessions")]
pub async fn list(
    State(state): State<AppState>,
) -> Result<Json<Vec<omnireach_core::types::Session>>, ApiError> {
    let sessions = omnireach_store::sessions::list_all(&state.db).await?;
    Ok(Json(sessions))
}

/// GET /api/sessions/:id
#[rorpc::get("/api/sessions/{id}")]
pub async fn get_by_id(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<omnireach_core::types::Session>, ApiError> {
    let session = omnireach_store::sessions::get_by_id(&state.db, id).await?;
    Ok(Json(session))
}

/// POST /api/sessions
#[rorpc::post("/api/sessions")]
pub async fn create(
    State(state): State<AppState>,
    Json(input): Json<CreateSessionInput>,
) -> Result<Json<omnireach_core::types::Session>, ApiError> {
    let session = omnireach_store::sessions::insert(&state.db, input).await?;
    // TODO: emit SSE event for new session
    // state.sse.send(SseEvent::SessionCreated { ... })?;
    Ok(Json(session))
}

/// PATCH /api/sessions/:id
#[rorpc::patch("/api/sessions/{id}")]
pub async fn update(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(input): Json<omnireach_core::types::UpdateSessionInput>,
) -> Result<Json<omnireach_core::types::Session>, ApiError> {
    let session = omnireach_store::sessions::update(
        &state.db,
        id,
        input.name.as_deref(),
        input.api_key.as_deref(),
        input.hourly_limit,
        input.daily_limit,
    )
    .await?;

    Ok(Json(session))
}

/// DELETE /api/sessions/:id
#[rorpc::delete("/api/sessions/{id}")]
pub async fn destroy(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<()>, ApiError> {
    omnireach_store::sessions::delete(&state.db, id).await?;
    // TODO: emit SSE event
    // state.sse.send(SseEvent::SessionDeleted { id })?;
    Ok(Json(()))
}

/// POST /api/sessions/:id/sync
#[rorpc::post("/api/sessions/{id}/sync")]
pub async fn sync(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<omnireach_core::types::Session>, ApiError> {
    // TODO: Phase 2 — implement real WABridge sync
    // 1. load session from DB to get api_key
    // 2. state.wa.get_session(wabridge_id, api_key).await
    // 3. store::sessions::update(db, id, None, None, None, None) to refresh last_activity_at
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
#[rorpc::post("/api/sessions/{id}/reset-limits")]
pub async fn reset_limits(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<omnireach_core::types::Session>, ApiError> {
    let session = omnireach_store::sessions::reset_limits(&state.db, id).await?;
    // TODO: emit SSE event
    // state.sse.send(SseEvent::SessionLimitsReset { id })?;
    Ok(Json(session))
}

#[derive(serde::Deserialize, rorpc::ZodTs)]
pub struct SendTestRequest {
    pub phone: String,
    pub message: String,
}

/// POST /api/sessions/:id/send-test
#[rorpc::post("/api/sessions/{id}/send-test")]
pub async fn send_test(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(body): Json<SendTestRequest>,
) -> Result<Json<()>, ApiError> {
    let now_ms = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_millis() as i64;

    // Load session to get API key
    let session = omnireach_store::sessions::get_by_id(&state.db, id).await?;

    // Check quota BEFORE incrementing (read-only check)
    let quota = omnireach_core::quota::check_quota(&session, now_ms);

    if !quota.can_send {
        return Err(ApiError::BadRequest(
            quota
                .reason
                .unwrap_or_else(|| "Session quota exhausted".to_string()),
        ));
    }

    // Build JID and send message
    let normalized_phone = body.phone.trim().trim_start_matches('+');
    let jid = format!("{}@s.whatsapp.net", normalized_phone);

    // Send the message FIRST (if this fails, quota is not consumed)
    let _message_receipt = state
        .wa
        .send_text(&jid, &body.message, &session.api_key)
        .await?;

    // Only increment quota AFTER successful send
    let _result = omnireach_store::sessions::try_acquire_send_slot(&state.db, id, now_ms).await?;

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

    Ok(Json(()))
}
