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
pub async fn list(State(_state): State<AppState>) -> Result<Json<serde_json::Value>, ApiError> {
    // TODO: store::sessions::list_all(&state.db).await
    todo!("return all sessions")
}

/// POST /api/sessions
pub async fn create(
    State(_state): State<AppState>,
    Json(_input): Json<CreateSessionInput>,
) -> Result<(StatusCode, Json<serde_json::Value>), ApiError> {
    // TODO: store::sessions::insert(&state.db, input).await
    // Return 201 Created with full Session (api_key included once)
    todo!("insert session, return 201 with api_key in body")
}

/// PATCH /api/sessions/:id
pub async fn update(
    State(_state): State<AppState>,
    Path(_id): Path<Uuid>,
    Json(_patch): Json<serde_json::Value>,
) -> Result<Json<serde_json::Value>, ApiError> {
    // TODO: partial update of name / hourly_limit / daily_limit
    todo!("PATCH session fields")
}

/// DELETE /api/sessions/:id
pub async fn destroy(
    State(_state): State<AppState>,
    Path(_id): Path<Uuid>,
) -> Result<StatusCode, ApiError> {
    // TODO: store::sessions::delete(&state.db, id).await → 204
    todo!("delete session, return 204")
}

/// POST /api/sessions/:id/sync
pub async fn sync(
    State(_state): State<AppState>,
    Path(_id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, ApiError> {
    // TODO:
    // 1. load session from DB to get api_key
    // 2. state.wa.get_session(wabridge_id, api_key).await
    // 3. store::sessions::update_status(...)
    // 4. state.sse.send(SseEvent::SessionStatus { ... })
    todo!("sync session status from WABridge")
}

/// GET /api/sessions/:id/qr
pub async fn get_qr(
    State(_state): State<AppState>,
    Path(_id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, ApiError> {
    // TODO:
    // 1. load session from DB
    // 2. state.wa.get_qr(wabridge_id, api_key).await
    // 3. return { qr_code_data: Option<String> }
    todo!("fetch QR from WABridge and return")
}

/// POST /api/sessions/:id/reset-limits
pub async fn reset_limits(
    State(_state): State<AppState>,
    Path(_id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, ApiError> {
    // TODO: store::sessions::reset_limits(&state.db, id).await
    todo!("clear hourly/daily timestamp arrays")
}
