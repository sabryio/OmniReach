//! WABridge session domain type.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Connection status of a WABridge session.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, sqlx::Type)]
#[serde(rename_all = "snake_case")]
#[sqlx(type_name = "TEXT", rename_all = "snake_case")]
pub enum SessionStatus {
    Connected,
    Disconnected,
}

impl SessionStatus {
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Connected => "connected",
            Self::Disconnected => "disconnected",
        }
    }

    pub fn from_str(s: &str) -> Result<Self, String> {
        match s {
            "connected" => Ok(Self::Connected),
            "disconnected" => Ok(Self::Disconnected),
            _ => Err(format!("Invalid session status: {}", s)),
        }
    }
}

/// A linked WhatsApp device session managed by the WABridge daemon.
///
/// Each session carries its own WABridge API key and rate-limit counters.
/// `api_key` is write-only at the API layer — it is stored but never echoed
/// back in GET responses after the initial creation response.
///
/// QR code pairing is handled entirely by WABridge — OmniReach doesn't store
/// or display QR codes. Use WABridge console for pairing.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Session {
    pub id: Uuid,
    pub name: String,
    pub phone_number: String,
    pub status: SessionStatus,
    /// WABridge API key scoped to this session. Never returned after creation.
    #[serde(skip_serializing)]
    pub api_key: String,
    pub hourly_limit: u32,
    pub daily_limit: u32,
    /// Rolling window timestamps (Unix ms) of sent messages in the last hour.
    pub hourly_sent_timestamps: Vec<i64>,
    /// Rolling window timestamps (Unix ms) of sent messages in the last 24 h.
    pub daily_sent_timestamps: Vec<i64>,
    pub last_activity_at: Option<DateTime<Utc>>,
}

/// Input shape for `POST /api/sessions`.
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateSessionInput {
    pub name: String,
    pub phone_number: String,
    pub api_key: String,
    pub hourly_limit: Option<u32>,
    pub daily_limit: Option<u32>,
}
