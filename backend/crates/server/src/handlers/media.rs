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
///
/// Accepts multipart/form-data with:
///   - `file`: the media file bytes
///   - `media_type`: "image", "video", or "document"
///
/// Returns `{ media_ref, expires_at, url }` where `media_ref` is valid for ~2 hours.
pub async fn upload(
    State(state): State<AppState>,
    mut multipart: Multipart,
) -> Result<Json<UploadResponse>, ApiError> {
    let mut file_bytes: Option<Vec<u8>> = None;
    let mut file_name: Option<String> = None;
    let mut media_type: Option<String> = None;

    // 1. Parse multipart fields
    while let Some(field) = multipart
        .next_field()
        .await
        .map_err(|e| ApiError::BadRequest(format!("Invalid multipart data: {}", e)))?
    {
        let name = field.name().unwrap_or("").to_string();

        match name.as_str() {
            "file" => {
                file_name = field.file_name().map(|s| s.to_string());
                let data = field
                    .bytes()
                    .await
                    .map_err(|e| ApiError::BadRequest(format!("Failed to read file: {}", e)))?;
                file_bytes = Some(data.to_vec());
            }
            "media_type" => {
                let data = field.bytes().await.map_err(|e| {
                    ApiError::BadRequest(format!("Failed to read media_type: {}", e))
                })?;
                media_type = Some(
                    String::from_utf8(data.to_vec())
                        .map_err(|_| ApiError::BadRequest("media_type must be UTF-8".into()))?,
                );
            }
            _ => {
                // Ignore unknown fields
            }
        }
    }

    // 2. Validate required fields
    let file_bytes =
        file_bytes.ok_or_else(|| ApiError::BadRequest("Missing 'file' field".into()))?;
    let file_name = file_name.unwrap_or_else(|| "file".to_string());
    let media_type =
        media_type.ok_or_else(|| ApiError::BadRequest("Missing 'media_type' field".into()))?;

    // 3. Validate media_type
    if !matches!(media_type.as_str(), "image" | "video" | "document") {
        return Err(ApiError::BadRequest(format!(
            "Invalid media_type '{}'; must be 'image', 'video', or 'document'",
            media_type
        )));
    }

    // 4. Load any connected session to get an api_key
    //    (For MVP, we pick the first connected session; Phase 7 will add session selection)
    let sessions = omnireach_store::sessions::list_all(&state.db).await?;
    let connected_session = sessions
        .into_iter()
        .find(|s| s.status == omnireach_core::types::SessionStatus::Connected)
        .ok_or_else(|| {
            ApiError::BadRequest("No connected session available for media upload".into())
        })?;

    let api_key = &connected_session.api_key;

    // 5. Upload to WABridge
    let upload_response = state
        .wa
        .upload_media(file_bytes, &file_name, &media_type, api_key)
        .await?;

    // 6. Generate a data URL for frontend preview (for images only)
    //    For MVP, we return an empty URL; Phase 7 will add proper preview support
    let url = String::new();

    Ok(Json(UploadResponse {
        media_ref: upload_response.media_ref,
        expires_at: upload_response.expires_at,
        url,
    }))
}
