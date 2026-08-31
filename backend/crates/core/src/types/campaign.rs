//! Campaign domain type.

use super::contact::{Contact, CreateContactInput};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Lifecycle status of a broadcast campaign.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, sqlx::Type)]
#[serde(rename_all = "snake_case")]
#[sqlx(type_name = "TEXT", rename_all = "snake_case")]
pub enum CampaignStatus {
    Draft,
    Scheduled,
    Running,
    Paused,
    Completed,
    Cancelled,
}

/// Full campaign domain object — returned by the API and stored in SQLite.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Campaign {
    pub id: Uuid,
    pub title: String,
    pub template_text: String,
    pub image_url: Option<String>,
    pub image_file_name: Option<String>,
    /// IDs of the WABridge sessions assigned to send this campaign.
    pub session_ids: Vec<Uuid>,
    pub status: CampaignStatus,
    pub created_at: DateTime<Utc>,
    pub started_at: Option<DateTime<Utc>>,
    pub completed_at: Option<DateTime<Utc>>,
    pub scheduled_for: Option<DateTime<Utc>>,
    pub total_contacts: i64,
    pub verified_contacts: i64,
    pub unregistered_count: i64,
    pub sent_count: i64,
    pub skipped_count: i64,
    pub failed_count: i64,
    pub is_archived: bool,
    pub archived_at: Option<DateTime<Utc>>,
    /// Embedded contacts — populated on GET /api/campaigns responses.
    #[serde(default)]
    pub contacts: Vec<Contact>,
}

/// Input shape for `POST /api/campaigns`.
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateCampaignInput {
    pub title: String,
    pub template_text: String,
    pub image_url: Option<String>,
    pub session_ids: Vec<Uuid>,
    pub contacts: Vec<CreateContactInput>,
}

impl CampaignStatus {
    /// Parse from database string representation
    pub fn from_str(s: &str) -> Result<Self, String> {
        match s {
            "draft" => Ok(Self::Draft),
            "scheduled" => Ok(Self::Scheduled),
            "running" => Ok(Self::Running),
            "paused" => Ok(Self::Paused),
            "completed" => Ok(Self::Completed),
            "cancelled" => Ok(Self::Cancelled),
            _ => Err(format!("Unknown campaign status: {}", s)),
        }
    }

    /// Convert to database string representation
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Draft => "draft",
            Self::Scheduled => "scheduled",
            Self::Running => "running",
            Self::Paused => "paused",
            Self::Completed => "completed",
            Self::Cancelled => "cancelled",
        }
    }
}
