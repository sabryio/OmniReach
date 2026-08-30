//! WaBridgeClient — the single point of contact with the WABridge daemon.
//!
//! # Design
//! - One `WaBridgeClient` per process, shared via Arc in AppState.
//! - `base_url` and `timeout` come from `AppSettings`.
//! - Every method accepts the calling session's `api_key` explicitly so the
//!   client remains stateless with respect to auth.
//!
//! # Error mapping
//! All WABridge HTTP status codes and error bodies are mapped to `GlueError`
//! variants before returning. The server layer never sees raw reqwest errors.

use crate::{
    error::GlueError,
    models::{
        CheckContactResponse, MediaUploadResponse, MessageReceipt, WaBridgeQr, WaBridgeSession,
    },
};
use reqwest::{Client, StatusCode};
use std::time::Duration;

/// Thin async wrapper around the WABridge HTTP API.
#[derive(Clone, Debug)]
#[allow(dead_code)] // fields used once todo!() stubs are implemented
pub struct WaBridgeClient {
    http: Client,
    base_url: String,
}

impl WaBridgeClient {
    /// Create a new client pointed at `base_url` with the given timeout.
    pub fn new(base_url: impl Into<String>, timeout_ms: u64) -> Self {
        let http = Client::builder()
            .timeout(Duration::from_millis(timeout_ms))
            .build()
            .expect("failed to build reqwest client");

        Self {
            http,
            base_url: base_url.into(),
        }
    }

    // ── Session management ────────────────────────────────────────────────────

    /// Poll WABridge for the current status of a session.
    pub async fn get_session(
        &self,
        _session_id: &str,
        _api_key: &str,
    ) -> Result<WaBridgeSession, GlueError> {
        // TODO: GET {base_url}/v1/sessions/{session_id}
        // Map 401 → GlueError::Unauthorized
        todo!("GET /v1/sessions/:id")
    }

    /// Fetch the current QR code for a session in `qr_required` state.
    pub async fn get_qr(&self, _session_id: &str, _api_key: &str) -> Result<WaBridgeQr, GlueError> {
        // TODO: GET {base_url}/v1/sessions/{session_id}/qr
        todo!("GET /v1/sessions/:id/qr")
    }

    // ── Contact verification ──────────────────────────────────────────────────

    /// Check whether a phone number (as JID) is registered on WhatsApp.
    ///
    /// `jid` format: `"15551234567@s.whatsapp.net"`
    pub async fn check_contact(
        &self,
        _jid: &str,
        _api_key: &str,
    ) -> Result<CheckContactResponse, GlueError> {
        // TODO: POST {base_url}/v1/contacts/check
        // Body: { jid }
        // Map unregistered response → GlueError::Unregistered
        // Map 401 → GlueError::Unauthorized
        todo!("POST /v1/contacts/check")
    }

    // ── Message sending ───────────────────────────────────────────────────────

    /// Send a plain-text message to a JID.
    pub async fn send_text(
        &self,
        _to_jid: &str,
        _body: &str,
        _api_key: &str,
    ) -> Result<MessageReceipt, GlueError> {
        // TODO: POST {base_url}/v1/messages
        // Body: { type: "text", to_jid, body }
        // Map 429 → GlueError::RateLimit
        // Map 401 → GlueError::Unauthorized
        // Map timeout → GlueError::Timeout
        // Map 5xx → GlueError::ServerError
        todo!("POST /v1/messages (text)")
    }

    /// Send an image message using a previously uploaded `media_ref`.
    pub async fn send_image(
        &self,
        _to_jid: &str,
        _media_ref: &str,
        _caption: Option<&str>,
        _api_key: &str,
    ) -> Result<MessageReceipt, GlueError> {
        // TODO: POST {base_url}/v1/messages
        // Body: { type: "image", to_jid, media_ref, caption }
        todo!("POST /v1/messages (image)")
    }

    // ── Media upload ──────────────────────────────────────────────────────────

    /// Upload a media file to WABridge and receive a `media_ref`.
    /// `media_type` ∈ { "image", "video", "document" }.
    /// The returned `media_ref` is valid for ~2 hours.
    pub async fn upload_media(
        &self,
        _file_bytes: Vec<u8>,
        _file_name: &str,
        _media_type: &str,
        _api_key: &str,
    ) -> Result<MediaUploadResponse, GlueError> {
        // TODO: POST {base_url}/v1/media/upload (multipart)
        todo!("POST /v1/media/upload")
    }

    // ── Internal helpers ──────────────────────────────────────────────────────

    /// Build the full URL for a given WABridge path.
    fn _url(&self, path: &str) -> String {
        format!("{}{}", self.base_url, path)
    }

    /// Map a non-2xx status to the appropriate `GlueError`.
    async fn _map_error(status: StatusCode, body: String) -> GlueError {
        match status.as_u16() {
            401 => GlueError::Unauthorized(body),
            429 => GlueError::RateLimit(body),
            _ => GlueError::ServerError {
                status: status.as_u16(),
                body,
            },
        }
    }
}
