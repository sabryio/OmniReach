//! WABridge adapter error type.
//!
//! Each variant maps to a specific failure mode the caller (server layer)
//! can handle differently — e.g. `Unregistered` skips the queue item,
//! `RateLimit` holds it, `Timeout` fails it with a retry flag.

use thiserror::Error;

#[derive(Debug, Error)]
pub enum GlueError {
    /// The phone number is not registered on WhatsApp.
    #[error("unregistered: {0}")]
    Unregistered(String),

    /// The session API key was rejected by WABridge.
    #[error("unauthorized: {0}")]
    Unauthorized(String),

    /// WABridge returned HTTP 429 or a rate-limit error body.
    #[error("rate limited: {0}")]
    RateLimit(String),

    /// The HTTP call timed out before WABridge responded.
    #[error("timeout calling WABridge: {0}")]
    Timeout(String),

    /// WABridge returned a 5xx or unexpected error.
    #[error("WABridge server error {status}: {body}")]
    ServerError { status: u16, body: String },

    /// The media reference has expired (>2 h since upload).
    #[error("media reference expired")]
    MediaExpired,

    /// Network or TLS error before reaching WABridge.
    #[error("network error: {0}")]
    Network(#[from] reqwest::Error),

    /// Unexpected response shape from WABridge.
    #[error("unexpected response: {0}")]
    Parse(String),
}
