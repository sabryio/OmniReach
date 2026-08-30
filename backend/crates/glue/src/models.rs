//! WABridge wire-format types — the exact JSON shapes the daemon sends/receives.
//!
//! These are kept separate from core domain types so that WABridge API
//! changes only require edits here, not in the domain layer.

use serde::{Deserialize, Serialize};

// ── Session ───────────────────────────────────────────────────────────────────

/// Response shape for GET /v1/sessions and POST /v1/sessions/{id}/start
#[derive(Debug, Deserialize)]
pub struct WaBridgeSession {
    pub id: String,
    pub name: String,
    pub status: String, // "connected" | "disconnected" | "qr_required" | "connecting"
    pub phone_number: Option<String>,
}

/// Response shape for GET /v1/sessions/{id}/qr
#[derive(Debug, Deserialize)]
pub struct WaBridgeQr {
    pub qr: Option<String>,
}

// ── Contacts ──────────────────────────────────────────────────────────────────

/// Request body for POST /v1/contacts/check
#[derive(Debug, Serialize)]
pub struct CheckContactRequest {
    pub jid: String,
}

/// Response shape for POST /v1/contacts/check
#[derive(Debug, Deserialize)]
pub struct CheckContactResponse {
    pub registered: bool,
    pub jid: Option<String>,
    pub error: Option<String>,
}

// ── Messages ──────────────────────────────────────────────────────────────────

/// Request body for POST /v1/messages — text variant
#[derive(Debug, Serialize)]
pub struct SendTextRequest {
    #[serde(rename = "type")]
    pub kind: String, // always "text"
    pub to_jid: String,
    pub body: String,
}

/// Request body for POST /v1/messages — image variant
#[derive(Debug, Serialize)]
pub struct SendImageRequest {
    #[serde(rename = "type")]
    pub kind: String, // always "image"
    pub to_jid: String,
    pub media_ref: String,
    pub caption: Option<String>,
}

/// Successful send receipt from WABridge
#[derive(Debug, Deserialize)]
pub struct MessageReceipt {
    pub id: String,
    pub timestamp: String,
}

// ── Media ─────────────────────────────────────────────────────────────────────

/// Response shape for POST /v1/media/upload
#[derive(Debug, Deserialize)]
pub struct MediaUploadResponse {
    pub media_ref: String,
    pub expires_at: String,
}
