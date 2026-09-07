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
use rorpc::OrpcError;
use serde_json::json;
use thiserror::Error;

#[derive(Debug, Error, OrpcError)]
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
        let (status, code, message) = match &self {
            ApiError::NotFound(msg) => (
                StatusCode::NOT_FOUND,
                "NOT_FOUND",
                msg.clone(),
            ),
            ApiError::BadRequest(msg) => (
                StatusCode::BAD_REQUEST,
                "BAD_REQUEST",
                msg.clone(),
            ),
            ApiError::Conflict(msg) => (
                StatusCode::CONFLICT,
                "CONFLICT",
                msg.clone(),
            ),
            ApiError::Unauthorized => (
                StatusCode::UNAUTHORIZED,
                "UNAUTHORIZED",
                "Unauthorized".to_string(),
            ),
            ApiError::Store(e) => match e {
                StoreError::NotFound(msg) => (
                    StatusCode::NOT_FOUND,
                    "NOT_FOUND",
                    msg.clone(),
                ),
                _ => (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "INTERNAL_ERROR",
                    e.to_string(),
                ),
            },
            ApiError::Glue(e) => match e {
                GlueError::Unregistered(msg) => (
                    StatusCode::UNPROCESSABLE_ENTITY,
                    "UNREGISTERED",
                    msg.clone(),
                ),
                GlueError::Unauthorized(msg) => (
                    StatusCode::BAD_GATEWAY,
                    "WABRIDGE_UNAUTHORIZED",
                    msg.clone(),
                ),
                GlueError::RateLimit(msg) => (
                    StatusCode::TOO_MANY_REQUESTS,
                    "RATE_LIMIT",
                    msg.clone(),
                ),
                GlueError::Timeout(msg) => (
                    StatusCode::GATEWAY_TIMEOUT,
                    "TIMEOUT",
                    msg.clone(),
                ),
                _ => (
                    StatusCode::BAD_GATEWAY,
                    "WABRIDGE_ERROR",
                    e.to_string(),
                ),
            },
            ApiError::Internal(msg) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                "INTERNAL_ERROR",
                msg.clone(),
            ),
        };

        (status, Json(json!({ "code": code, "message": message }))).into_response()
    }
}
