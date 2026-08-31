//! Queue item domain type.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Lifecycle status of a single message dispatch unit.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, sqlx::Type)]
#[serde(rename_all = "snake_case")]
#[sqlx(type_name = "TEXT", rename_all = "snake_case")]
pub enum QueueItemStatus {
    Pending,
    Verifying,
    Sending,
    Sent,
    SkippedUnregistered,
    Failed,
    HeldRateLimit,
    HeldTimeWindow,
    Cancelled,
}

/// A single message dispatch unit — one per contact per campaign.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct QueueItem {
    pub id: Uuid,
    pub campaign_id: Uuid,
    /// Denormalised title so the queue view doesn't need a join.
    pub campaign_title: String,
    pub contact_id: Uuid,
    pub phone: String,
    pub recipient_name: Option<String>,
    /// Message with merge tags already substituted at campaign creation time.
    pub rendered_text: String,
    pub image_url: Option<String>,
    pub status: QueueItemStatus,
    pub assigned_session_id: Option<Uuid>,
    pub attempts: i64,
    pub last_error: Option<String>,
    pub sent_at: Option<DateTime<Utc>>,
    pub scheduled_for: Option<DateTime<Utc>>,
    /// Epoch ms — scheduler holds item until this time on rate-limit.
    pub rate_limit_hold_until: Option<DateTime<Utc>>,
    /// Epoch ms — scheduler holds item until the time window opens.
    pub time_window_hold_until: Option<DateTime<Utc>>,
    /// Raw JSON response body from WABridge on successful send.
    pub response_payload: Option<String>,
}
