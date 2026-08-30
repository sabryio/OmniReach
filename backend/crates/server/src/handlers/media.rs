//! Media handlers.
//!
//! Route → Handler mapping:
//!   POST /api/media/upload → upload
//!
//! Accepts multipart: `file` (bytes) + `media_type` (string).
//! Proxies the upload to WABridge and returns media_ref + url.

use crate::{error::ApiError, state::AppState};
use axum::{
    Json,
    extract::{Multipart, State},
};
use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct UploadResponse {
    /// WABridge media reference — opaque token valid for ~2 hours.
    pub media_ref: String,
    /// ISO-8601 expiry timestamp from WABridge.
    pub expires_at: String,
    /// Original file URL or data-URL for frontend preview.
    pub url: String,
}

/// POST /api/media/upload
pub async fn upload(
    State(_state): State<AppState>,
    _multipart: Multipart,
) -> Result<Json<UploadResponse>, ApiError> {
    // TODO:
    // 1. Parse multipart: extract `file` bytes + filename, `media_type` string
    // 2. Validate media_type ∈ { "image", "video", "document" }
    // 3. Load any connected session from DB to get an api_key
    // 4. state.wa.upload_media(file_bytes, filename, media_type, api_key).await
    // 5. Return Json(UploadResponse { media_ref, expires_at, url })
    todo!("parse multipart, proxy upload to WABridge, return media_ref + url")
}
