//! Custom Axum extractors.
//!
//! Currently provides `ValidatedJson<T>` — a drop-in replacement for
//! `axum::Json` that runs `serde` deserialization and returns a structured
//! `ApiError::BadRequest` on failure instead of Axum's plain 422.

use crate::error::ApiError;
use axum::{
    Json,
    extract::{FromRequest, Request},
    http::header,
};
use serde::de::DeserializeOwned;

/// Deserializes a JSON request body, returning `ApiError::BadRequest` on failure.
pub struct ValidatedJson<T>(pub T);

impl<T, S> FromRequest<S> for ValidatedJson<T>
where
    T: DeserializeOwned,
    S: Send + Sync,
{
    type Rejection = ApiError;

    async fn from_request(req: Request, state: &S) -> Result<Self, Self::Rejection> {
        let content_type = req
            .headers()
            .get(header::CONTENT_TYPE)
            .and_then(|v| v.to_str().ok())
            .unwrap_or("");

        if !content_type.starts_with("application/json") {
            return Err(ApiError::BadRequest(
                "Content-Type must be application/json".to_string(),
            ));
        }

        Json::<T>::from_request(req, state)
            .await
            .map(|Json(v)| ValidatedJson(v))
            .map_err(|e| ApiError::BadRequest(e.body_text()))
    }
}
