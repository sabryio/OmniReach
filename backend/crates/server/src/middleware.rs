//! Axum middleware — auth token validation.
//!
//! MVP auth: a static bearer token from the `OMNIREACH_TOKEN` env var.
//! The frontend sends `Authorization: Bearer <token>` on every request.
//!
//! Applied at the router level so every `/api` route is protected.
//! The `GET /api/events` SSE endpoint is also protected.

use crate::{error::ApiError, state::AppState};
use axum::{
    extract::{Request, State},
    middleware::Next,
    response::Response,
};

/// Axum middleware function that validates the `Authorization: Bearer` header.
///
/// Usage in router:
/// ```rust
/// Router::new()
///     .route(...)
///     .layer(axum::middleware::from_fn_with_state(state, auth_middleware))
/// ```
pub async fn auth_middleware(
    State(state): State<AppState>,
    request: Request,
    next: Next,
) -> Result<Response, ApiError> {
    let token = request
        .headers()
        .get("Authorization")
        .and_then(|v| v.to_str().ok())
        .and_then(|v| v.strip_prefix("Bearer "));

    match token {
        Some(t) if t == state.auth_token.as_str() => Ok(next.run(request).await),
        _ => Err(ApiError::Unauthorized),
    }
}
