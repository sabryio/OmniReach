//! Template handlers.
//!
//! Route → Handler mapping:
//!   GET    /api/templates           → list
//!   POST   /api/templates           → create
//!   GET    /api/templates/:id       → get
//!   PATCH  /api/templates/:id       → update
//!   DELETE /api/templates/:id       → destroy

use crate::{error::ApiError, state::AppState};
use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use omnireach_core::types::{CreateTemplateInput, Template, UpdateTemplateInput};
use uuid::Uuid;

/// GET /api/templates
pub async fn list(State(state): State<AppState>) -> Result<Json<Vec<Template>>, ApiError> {
    let templates = omnireach_store::templates::list_all(&state.db).await?;
    Ok(Json(templates))
}

/// GET /api/templates/:id
pub async fn get(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<Template>, ApiError> {
    let template = omnireach_store::templates::get_by_id(&state.db, id).await?;
    Ok(Json(template))
}

/// POST /api/templates
pub async fn create(
    State(state): State<AppState>,
    Json(input): Json<CreateTemplateInput>,
) -> Result<(StatusCode, Json<Template>), ApiError> {
    let template = omnireach_store::templates::insert(&state.db, input).await?;
    // TODO: emit SSE event for new template
    // state.sse.send(SseEvent::TemplateCreated { ... })?;
    Ok((StatusCode::CREATED, Json(template)))
}

/// PATCH /api/templates/:id
pub async fn update(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(input): Json<UpdateTemplateInput>,
) -> Result<Json<Template>, ApiError> {
    let template = omnireach_store::templates::update(&state.db, id, input).await?;
    // TODO: emit SSE event
    // state.sse.send(SseEvent::TemplateUpdated { ... })?;
    Ok(Json(template))
}

/// DELETE /api/templates/:id
pub async fn destroy(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<StatusCode, ApiError> {
    omnireach_store::templates::delete(&state.db, id).await?;
    // TODO: emit SSE event
    // state.sse.send(SseEvent::TemplateDeleted { id })?;
    Ok(StatusCode::NO_CONTENT)
}
