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
    Json,
    extract::{Path, State},
};
use omnireach_core::types::{CreateTemplateInput, Template, UpdateTemplateInput};
use uuid::Uuid;

/// GET /api/templates
#[rorpc::get("/api/templates")]
pub async fn list(State(state): State<AppState>) -> Result<Json<Vec<Template>>, ApiError> {
    let templates = omnireach_store::templates::list_all(&state.db).await?;
    Ok(Json(templates))
}

/// GET /api/templates/:id
#[rorpc::get("/api/templates/{id}")]
pub async fn get_by_id(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<Template>, ApiError> {
    let template = omnireach_store::templates::get_by_id(&state.db, id).await?;
    Ok(Json(template))
}

/// POST /api/templates
#[rorpc::post("/api/templates")]
pub async fn create(
    State(state): State<AppState>,
    Json(input): Json<CreateTemplateInput>,
) -> Result<Json<Template>, ApiError> {
    let template = omnireach_store::templates::insert(&state.db, input).await?;
    // TODO: emit SSE event for new template
    // state.sse.send(SseEvent::TemplateCreated { ... })?;
    Ok(Json(template))
}

/// PATCH /api/templates/:id
#[rorpc::patch("/api/templates/{id}")]
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
#[rorpc::delete("/api/templates/{id}")]
pub async fn destroy(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<()>, ApiError> {
    omnireach_store::templates::delete(&state.db, id).await?;
    // TODO: emit SSE event
    // state.sse.send(SseEvent::TemplateDeleted { id })?;
    Ok(Json(()))
}
