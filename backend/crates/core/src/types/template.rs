//! Message template domain type.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// A reusable WhatsApp message template with variable substitution support.
///
/// Templates support merge tags like `{{name}}` and `{{prescription}}` that are
/// replaced at send time with contact-specific values.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Template {
    pub id: Uuid,
    pub title: String,
    pub title_ar: Option<String>,
    pub category: String,
    pub category_ar: Option<String>,
    pub text: String,
    pub text_ar: Option<String>,
    pub image_url: Option<String>,
    pub image_file_name: Option<String>,
    /// Suggested variable names extracted from template text (e.g., ["name", "prescription"])
    pub suggested_variables: Vec<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Input shape for `POST /api/templates`.
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateTemplateInput {
    pub title: String,
    pub title_ar: Option<String>,
    pub category: String,
    pub category_ar: Option<String>,
    pub text: String,
    pub text_ar: Option<String>,
    pub image_url: Option<String>,
    pub image_file_name: Option<String>,
    #[serde(default)]
    pub suggested_variables: Vec<String>,
}

/// Input shape for `PATCH /api/templates/:id`.
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateTemplateInput {
    pub title: Option<String>,
    pub title_ar: Option<String>,
    pub category: Option<String>,
    pub category_ar: Option<String>,
    pub text: Option<String>,
    pub text_ar: Option<String>,
    pub image_url: Option<String>,
    pub image_file_name: Option<String>,
    pub suggested_variables: Option<Vec<String>>,
}
