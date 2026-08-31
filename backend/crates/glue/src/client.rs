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
        session_id: &str,
        api_key: &str,
    ) -> Result<WaBridgeSession, GlueError> {
        let url = self._url(&format!("/v1/sessions/{}", session_id));

        let response = self
            .http
            .get(&url)
            .header("Authorization", format!("Bearer {}", api_key))
            .send()
            .await
            .map_err(|e| {
                if e.is_timeout() {
                    GlueError::Timeout(e.to_string())
                } else {
                    GlueError::Network(e)
                }
            })?;

        let status = response.status();

        if status == StatusCode::UNAUTHORIZED {
            let body = response.text().await.unwrap_or_default();
            return Err(GlueError::Unauthorized(body));
        }

        if status.is_server_error() {
            let body = response.text().await.unwrap_or_default();
            return Err(GlueError::ServerError {
                status: status.as_u16(),
                body,
            });
        }

        if !status.is_success() {
            let body = response.text().await.unwrap_or_default();
            return Err(Self::_map_error(status, body).await);
        }

        let session: WaBridgeSession = response
            .json()
            .await
            .map_err(|e| GlueError::Parse(e.to_string()))?;

        Ok(session)
    }

    /// Fetch the current QR code for a session in `qr_required` state.
    pub async fn get_qr(&self, session_id: &str, api_key: &str) -> Result<WaBridgeQr, GlueError> {
        let url = self._url(&format!("/v1/sessions/{}/qr", session_id));

        let response = self
            .http
            .get(&url)
            .header("Authorization", format!("Bearer {}", api_key))
            .send()
            .await
            .map_err(|e| {
                if e.is_timeout() {
                    GlueError::Timeout(e.to_string())
                } else {
                    GlueError::Network(e)
                }
            })?;

        let status = response.status();

        if status == StatusCode::UNAUTHORIZED {
            let body = response.text().await.unwrap_or_default();
            return Err(GlueError::Unauthorized(body));
        }

        if status.is_server_error() {
            let body = response.text().await.unwrap_or_default();
            return Err(GlueError::ServerError {
                status: status.as_u16(),
                body,
            });
        }

        if !status.is_success() {
            let body = response.text().await.unwrap_or_default();
            return Err(Self::_map_error(status, body).await);
        }

        let qr: WaBridgeQr = response
            .json()
            .await
            .map_err(|e| GlueError::Parse(e.to_string()))?;

        Ok(qr)
    }

    // ── Contact verification ──────────────────────────────────────────────────

    /// Check whether a phone number (as JID) is registered on WhatsApp.
    ///
    /// `jid` format: `"15551234567@s.whatsapp.net"`
    pub async fn check_contact(
        &self,
        jid: &str,
        api_key: &str,
    ) -> Result<CheckContactResponse, GlueError> {
        let url = self._url("/v1/contacts/check");
        let request_body = crate::models::CheckContactRequest {
            jid: jid.to_string(),
        };

        let response = self
            .http
            .post(&url)
            .header("Authorization", format!("Bearer {}", api_key))
            .json(&request_body)
            .send()
            .await?;

        let status = response.status();

        if status == StatusCode::UNAUTHORIZED {
            let body = response.text().await.unwrap_or_default();
            return Err(GlueError::Unauthorized(body));
        }

        if !status.is_success() {
            let body = response.text().await.unwrap_or_default();
            return Err(Self::_map_error(status, body).await);
        }

        let contact_response: CheckContactResponse = response
            .json()
            .await
            .map_err(|e| GlueError::Parse(e.to_string()))?;

        // If the contact is not registered, return the response
        // (caller can check contact_response.registered)
        Ok(contact_response)
    }

    // ── Message sending ───────────────────────────────────────────────────────

    /// Send a plain-text message to a JID.
    pub async fn send_text(
        &self,
        to_jid: &str,
        body: &str,
        api_key: &str,
    ) -> Result<MessageReceipt, GlueError> {
        let url = self._url("/v1/messages");
        let request_body = crate::models::SendTextRequest {
            kind: "text".to_string(),
            to_jid: to_jid.to_string(),
            body: body.to_string(),
        };

        let response = self
            .http
            .post(&url)
            .header("Authorization", format!("Bearer {}", api_key))
            .json(&request_body)
            .send()
            .await
            .map_err(|e| {
                if e.is_timeout() {
                    GlueError::Timeout(e.to_string())
                } else {
                    GlueError::Network(e)
                }
            })?;

        let status = response.status();

        if status == StatusCode::UNAUTHORIZED {
            let body = response.text().await.unwrap_or_default();
            return Err(GlueError::Unauthorized(body));
        }

        if status == StatusCode::TOO_MANY_REQUESTS {
            let body = response.text().await.unwrap_or_default();
            return Err(GlueError::RateLimit(body));
        }

        if status.is_server_error() {
            let body = response.text().await.unwrap_or_default();
            return Err(GlueError::ServerError {
                status: status.as_u16(),
                body,
            });
        }

        if !status.is_success() {
            let body = response.text().await.unwrap_or_default();
            return Err(Self::_map_error(status, body).await);
        }

        let receipt: MessageReceipt = response
            .json()
            .await
            .map_err(|e| GlueError::Parse(e.to_string()))?;

        Ok(receipt)
    }

    /// Send an image message using a previously uploaded `media_ref`.
    pub async fn send_image(
        &self,
        to_jid: &str,
        media_ref: &str,
        caption: Option<&str>,
        api_key: &str,
    ) -> Result<MessageReceipt, GlueError> {
        let url = self._url("/v1/messages");
        let request_body = crate::models::SendImageRequest {
            kind: "image".to_string(),
            to_jid: to_jid.to_string(),
            media_ref: media_ref.to_string(),
            caption: caption.map(|s| s.to_string()),
        };

        let response = self
            .http
            .post(&url)
            .header("Authorization", format!("Bearer {}", api_key))
            .json(&request_body)
            .send()
            .await
            .map_err(|e| {
                if e.is_timeout() {
                    GlueError::Timeout(e.to_string())
                } else {
                    GlueError::Network(e)
                }
            })?;

        let status = response.status();

        if status == StatusCode::UNAUTHORIZED {
            let body = response.text().await.unwrap_or_default();
            return Err(GlueError::Unauthorized(body));
        }

        if status == StatusCode::TOO_MANY_REQUESTS {
            let body = response.text().await.unwrap_or_default();
            return Err(GlueError::RateLimit(body));
        }

        if status.is_server_error() {
            let body = response.text().await.unwrap_or_default();
            return Err(GlueError::ServerError {
                status: status.as_u16(),
                body,
            });
        }

        if !status.is_success() {
            let body = response.text().await.unwrap_or_default();
            return Err(Self::_map_error(status, body).await);
        }

        let receipt: MessageReceipt = response
            .json()
            .await
            .map_err(|e| GlueError::Parse(e.to_string()))?;

        Ok(receipt)
    }

    // ── Media upload ──────────────────────────────────────────────────────────

    /// Upload a media file to WABridge and receive a `media_ref`.
    /// `media_type` ∈ { "image", "video", "document" }.
    /// The returned `media_ref` is valid for ~2 hours.
    pub async fn upload_media(
        &self,
        file_bytes: Vec<u8>,
        file_name: &str,
        media_type: &str,
        api_key: &str,
    ) -> Result<MediaUploadResponse, GlueError> {
        let url = self._url("/v1/media/upload");

        let part = reqwest::multipart::Part::bytes(file_bytes)
            .file_name(file_name.to_string())
            .mime_str(media_type)
            .map_err(|e| GlueError::Parse(format!("Invalid MIME type: {}", e)))?;

        let form = reqwest::multipart::Form::new().part("file", part);

        let response = self
            .http
            .post(&url)
            .header("Authorization", format!("Bearer {}", api_key))
            .multipart(form)
            .send()
            .await
            .map_err(|e| {
                if e.is_timeout() {
                    GlueError::Timeout(e.to_string())
                } else {
                    GlueError::Network(e)
                }
            })?;

        let status = response.status();

        if status == StatusCode::UNAUTHORIZED {
            let body = response.text().await.unwrap_or_default();
            return Err(GlueError::Unauthorized(body));
        }

        if status.is_server_error() {
            let body = response.text().await.unwrap_or_default();
            return Err(GlueError::ServerError {
                status: status.as_u16(),
                body,
            });
        }

        if !status.is_success() {
            let body = response.text().await.unwrap_or_default();
            return Err(Self::_map_error(status, body).await);
        }

        let upload_response: MediaUploadResponse = response
            .json()
            .await
            .map_err(|e| GlueError::Parse(e.to_string()))?;

        Ok(upload_response)
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
