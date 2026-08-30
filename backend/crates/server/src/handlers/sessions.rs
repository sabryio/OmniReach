//! Session handlers + SSE stream endpoint.
//!
//! Route → Handler mapping:
//!   GET    /api/events                      → sse_handler
//!   GET    /api/sessions                    → list
//!   POST   /api/sessions                    → create
//!   PATCH  /api/sessions/:id                → update
//!   DELETE /api/sessions/:id                → destroy
//!   POST   /api/sessions/:id/sync           → sync
//!   GET    /api/sessions/:id/qr             → get_qr
//!   POST   /api/sessions/:id/reset-limits   → reset_limits

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
/// Implementation sketch:
///   use tokio_stream::wrappers::BroadcastStream;
///   use futures::StreamExt;
///   let rx = state.sse.subscribe();
///   let stream = BroadcastStream::new(rx)
///       .filter_map(|r| async move { r.ok() })
///       .map(|ev| Ok(ev.into_axum_event()));
///   Sse::new(stream).keep_alive(KeepAlive::default())
pub async fn sse_handler(
    State(_state): State<AppState>,
) -> Sse<impl Stream<Item = Result<Event, Infallible>>> {
    // Placeholder: return an empty stream until real implementation lands.
    let stream = futures::stream::empty::<Result<Event, Infallible>>();
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
    let hourly_limit = patch.get("hourlyLimit").and_then(|v| v.as_i64());
    let daily_limit = patch.get("dailyLimit").and_then(|v| v.as_i64());

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
    // 4. state.sse.send(SseEvent::SessionStatus { ... })

    // For now, just return the existing session
    let session = omnireach_store::sessions::get_by_id(&state.db, id).await?;
    Ok(Json(session))
}

/// GET /api/sessions/:id/qr
pub async fn get_qr(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, ApiError> {
    // TODO: Phase 2 — implement real WABridge QR fetch
    // 1. load session from DB
    // 2. state.wa.get_qr(wabridge_id, api_key).await
    // 3. return { qr_code_data: Option<String> }

    let session = omnireach_store::sessions::get_by_id(&state.db, id).await?;
    Ok(Json(serde_json::json!({
        "qrCodeData": session.qr_code_data
    })))
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
