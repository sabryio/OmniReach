//! Server-layer error type — maps all upstream errors to HTTP responses.
//!
//! Every handler returns `Result<impl IntoResponse, ApiError>`.
//! `ApiError` implements `IntoResponse` so Axum automatically serialises
//! it as `{ "error": "..." }` JSON with the correct status code.

use axum::{
    Json,
    http::StatusCode,
    response::{IntoResponse, Response},
};
use omnireach_glue::GlueError;
use omnireach_store::StoreError;
use serde_json::json;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum ApiError {
    #[error("not found: {0}")]
    NotFound(String),

    #[error("bad request: {0}")]
    BadRequest(String),

    #[error("conflict: {0}")]
    Conflict(String),

    #[error("unauthorized")]
    Unauthorized,

    #[error("store error: {0}")]
    Store(#[from] StoreError),

    #[error("wabridge error: {0}")]
    Glue(#[from] GlueError),

    #[error("internal error: {0}")]
    Internal(String),
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let (status, message) = match &self {
            ApiError::NotFound(msg) => (StatusCode::NOT_FOUND, msg.clone()),
            ApiError::BadRequest(msg) => (StatusCode::BAD_REQUEST, msg.clone()),
            ApiError::Conflict(msg) => (StatusCode::CONFLICT, msg.clone()),
            ApiError::Unauthorized => (StatusCode::UNAUTHORIZED, "unauthorized".to_string()),
            ApiError::Store(e) => match e {
                StoreError::NotFound(msg) => (StatusCode::NOT_FOUND, msg.clone()),
                _ => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()),
            },
            ApiError::Glue(e) => match e {
                GlueError::Unregistered(msg) => (StatusCode::UNPROCESSABLE_ENTITY, msg.clone()),
                GlueError::Unauthorized(msg) => (StatusCode::BAD_GATEWAY, msg.clone()),
                GlueError::RateLimit(msg) => (StatusCode::TOO_MANY_REQUESTS, msg.clone()),
                GlueError::Timeout(msg) => (StatusCode::GATEWAY_TIMEOUT, msg.clone()),
                _ => (StatusCode::BAD_GATEWAY, e.to_string()),
            },
            ApiError::Internal(msg) => (StatusCode::INTERNAL_SERVER_ERROR, msg.clone()),
        };

        (status, Json(json!({ "error": message }))).into_response()
    }
}
