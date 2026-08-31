//! Contact repository — all SQL for the `contacts` table.

use crate::{Db, StoreError};
use omnireach_core::types::{Contact, ContactVerificationStatus};
use std::collections::HashMap;
use uuid::Uuid;

/// Get all contacts for a specific campaign
pub async fn list_by_campaign(db: &Db, campaign_id: Uuid) -> Result<Vec<Contact>, StoreError> {
    let rows = sqlx::query!(
        r#"
        SELECT id, campaign_id, name, raw_phone, formatted_phone, normalized_phone,
               custom_fields, verification_status, verification_error, verified_at, wa_id
        FROM contacts
        WHERE campaign_id = ?
        ORDER BY name ASC
        "#,
        campaign_id.to_string()
    )
    .fetch_all(db.pool())
    .await?;

    rows.into_iter()
        .map(|row| {
            let id_str = row.id.as_deref().unwrap_or("");
            let id = Uuid::parse_str(id_str)
                .map_err(|_| StoreError::InvalidData(format!("Invalid contact ID: {}", id_str)))?;

            let campaign_id_str = row.campaign_id.as_str();
            let campaign_id = Uuid::parse_str(campaign_id_str).map_err(|_| {
                StoreError::InvalidData(format!("Invalid campaign_id: {}", campaign_id_str))
            })?;

            let verification_status_str = row.verification_status.as_str();
            let verification_status = ContactVerificationStatus::from_str(verification_status_str)
                .map_err(StoreError::InvalidData)?;

            let custom_fields: HashMap<String, String> = serde_json::from_str(&row.custom_fields)
                .map_err(|e| {
                StoreError::InvalidData(format!("Invalid custom_fields JSON: {}", e))
            })?;

            Ok(Contact {
                id,
                campaign_id,
                name: row.name,
                raw_phone: row.raw_phone,
                formatted_phone: row.formatted_phone,
                normalized_phone: row.normalized_phone,
                custom_fields,
                verification_status,
                verification_error: row.verification_error,
                verified_at: row
                    .verified_at
                    .and_then(chrono::DateTime::from_timestamp_millis),
                wa_id: row.wa_id,
            })
        })
        .collect()
}

/// Get a single contact by ID
pub async fn get_by_id(db: &Db, id: Uuid) -> Result<Contact, StoreError> {
    let row = sqlx::query!(
        r#"
        SELECT id, campaign_id, name, raw_phone, formatted_phone, normalized_phone,
               custom_fields, verification_status, verification_error, verified_at, wa_id
        FROM contacts
        WHERE id = ?
        "#,
        id.to_string()
    )
    .fetch_optional(db.pool())
    .await?
    .ok_or_else(|| StoreError::NotFound(format!("Contact {} not found", id)))?;

    let id_str = row.id.as_deref().unwrap_or("");
    let id = Uuid::parse_str(id_str)
        .map_err(|_| StoreError::InvalidData(format!("Invalid contact ID: {}", id_str)))?;

    let campaign_id_str = row.campaign_id.as_str();
    let campaign_id = Uuid::parse_str(campaign_id_str).map_err(|_| {
        StoreError::InvalidData(format!("Invalid campaign_id: {}", campaign_id_str))
    })?;

    let verification_status_str = row.verification_status.as_str();
    let verification_status = ContactVerificationStatus::from_str(verification_status_str)
        .map_err(StoreError::InvalidData)?;

    let custom_fields: HashMap<String, String> = serde_json::from_str(&row.custom_fields)
        .map_err(|e| StoreError::InvalidData(format!("Invalid custom_fields JSON: {}", e)))?;

    Ok(Contact {
        id,
        campaign_id,
        name: row.name,
        raw_phone: row.raw_phone,
        formatted_phone: row.formatted_phone,
        normalized_phone: row.normalized_phone,
        custom_fields,
        verification_status,
        verification_error: row.verification_error,
        verified_at: row
            .verified_at
            .and_then(chrono::DateTime::from_timestamp_millis),
        wa_id: row.wa_id,
    })
}

/// Updates verification status, wa_id, and error after a WABridge check.
pub async fn update_verification(
    db: &Db,
    id: Uuid,
    status: ContactVerificationStatus,
    wa_id: Option<String>,
    error: Option<String>,
) -> Result<Contact, StoreError> {
    let now_ms = chrono::Utc::now().timestamp_millis();
    let status_str = status.as_str();

    let result = sqlx::query!(
        r#"
        UPDATE contacts
        SET verification_status = ?, wa_id = ?, verification_error = ?, verified_at = ?
        WHERE id = ?
        "#,
        status_str,
        wa_id,
        error,
        now_ms,
        id.to_string()
    )
    .execute(db.pool())
    .await?;

    if result.rows_affected() == 0 {
        return Err(StoreError::NotFound(format!("Contact {} not found", id)));
    }

    get_by_id(db, id).await
}
