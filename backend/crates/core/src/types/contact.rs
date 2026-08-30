//! Contact domain type.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use uuid::Uuid;

/// WhatsApp registration status of a contact.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, sqlx::Type)]
#[serde(rename_all = "snake_case")]
#[sqlx(type_name = "TEXT", rename_all = "snake_case")]
pub enum ContactVerificationStatus {
    Unverified,
    Checking,
    Registered,
    Unregistered,
    Error,
}

/// Contact domain object.
/// `custom_fields` holds arbitrary key-value pairs from CSV columns
/// (e.g. prescription, doctor, date) used for merge-tag substitution.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Contact {
    pub id: Uuid,
    pub campaign_id: Uuid,
    pub name: String,
    pub raw_phone: String,
    pub formatted_phone: String,
    pub normalized_phone: String,
    pub custom_fields: HashMap<String, String>,
    pub verification_status: ContactVerificationStatus,
    pub verification_error: Option<String>,
    pub verified_at: Option<DateTime<Utc>>,
    /// WhatsApp JID, e.g. `201012345678@s.whatsapp.net`
    pub wa_id: Option<String>,
}

/// Input shape for a single contact within `CreateCampaignInput`.
#[derive(Debug, Clone, Deserialize)]
pub struct CreateContactInput {
    pub name: String,
    pub raw_phone: String,
    pub formatted_phone: String,
    pub normalized_phone: String,
    #[serde(default)]
    pub custom_fields: HashMap<String, String>,
}
