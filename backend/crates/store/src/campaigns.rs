//! Campaign repository — all SQL for the `campaigns` table.

use crate::{Db, StoreError};
use chrono::Utc;
use omnireach_core::types::{
    Campaign, CampaignStatus, Contact, ContactVerificationStatus, CreateCampaignInput,
};
use sqlx::AssertSqlSafe;
use std::collections::HashMap;
use uuid::Uuid;

/// GET /api/campaigns — return all campaigns with embedded contacts
pub async fn list_all(db: &Db) -> Result<Vec<Campaign>, StoreError> {
    // Step 1: Fetch all campaigns
    let campaign_rows = sqlx::query!(
        r#"
        SELECT id, title, template_text, image_url, image_file_name, media_ref, session_ids,
               status, created_at, started_at, completed_at, scheduled_for,
               total_contacts, verified_contacts, unregistered_count,
               sent_count, skipped_count, failed_count, is_archived, archived_at
        FROM campaigns
        ORDER BY created_at DESC
        "#
    )
    .fetch_all(db.pool())
    .await?;

    // Step 2: Fetch all contacts for these campaigns
    let contact_rows = sqlx::query!(
        r#"
        SELECT id, campaign_id, name, raw_phone, formatted_phone, normalized_phone,
               custom_fields, verification_status, verification_error, verified_at, wa_id
        FROM contacts
        "#
    )
    .fetch_all(db.pool())
    .await?;

    // Step 3: Group contacts by campaign_id
    let mut contacts_by_campaign: HashMap<Uuid, Vec<Contact>> = HashMap::new();

    for row in contact_rows {
        let campaign_id_str = row.campaign_id.as_str();
        let campaign_id = Uuid::parse_str(campaign_id_str).map_err(|_| {
            StoreError::InvalidData(format!("Invalid campaign_id: {}", campaign_id_str))
        })?;

        let id_str = row.id.as_deref().unwrap_or("");
        let id = Uuid::parse_str(id_str)
            .map_err(|_| StoreError::InvalidData(format!("Invalid contact ID: {}", id_str)))?;

        let verification_status_str = row.verification_status.as_str();
        let verification_status = ContactVerificationStatus::from_str(verification_status_str)
            .map_err(StoreError::InvalidData)?;

        let custom_fields: HashMap<String, String> = serde_json::from_str(&row.custom_fields)
            .map_err(|e| StoreError::InvalidData(format!("Invalid custom_fields JSON: {}", e)))?;

        let contact = Contact {
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
        };

        contacts_by_campaign
            .entry(campaign_id)
            .or_default()
            .push(contact);
    }

    // Step 4: Build Campaign objects
    let mut campaigns = Vec::new();

    for row in campaign_rows {
        let id_str = row.id.as_deref().unwrap_or("");
        let id = Uuid::parse_str(id_str)
            .map_err(|_| StoreError::InvalidData(format!("Invalid campaign ID: {}", id_str)))?;

        let status_str = row.status.as_str();
        let status = CampaignStatus::from_str(status_str).map_err(StoreError::InvalidData)?;

        let session_ids: Vec<Uuid> = serde_json::from_str(&row.session_ids)?;

        let contacts = contacts_by_campaign.remove(&id).unwrap_or_default();

        campaigns.push(Campaign {
            id,
            title: row.title,
            template_text: row.template_text,
            image_url: row.image_url,
            image_file_name: row.image_file_name,
            media_ref: row.media_ref,
            session_ids,
            status,
            created_at: chrono::DateTime::from_timestamp_millis(row.created_at)
                .ok_or_else(|| StoreError::InvalidData("Invalid created_at timestamp".into()))?,
            started_at: row
                .started_at
                .and_then(chrono::DateTime::from_timestamp_millis),
            completed_at: row
                .completed_at
                .and_then(chrono::DateTime::from_timestamp_millis),
            scheduled_for: row
                .scheduled_for
                .and_then(chrono::DateTime::from_timestamp_millis),
            total_contacts: row.total_contacts,
            verified_contacts: row.verified_contacts,
            unregistered_count: row.unregistered_count,
            sent_count: row.sent_count,
            skipped_count: row.skipped_count,
            failed_count: row.failed_count,
            is_archived: row.is_archived != 0,
            archived_at: row
                .archived_at
                .and_then(chrono::DateTime::from_timestamp_millis),
            contacts,
        });
    }

    Ok(campaigns)
}

/// GET /api/campaigns/:id
pub async fn get_by_id(db: &Db, id: Uuid) -> Result<Campaign, StoreError> {
    let all = list_all(db).await?;
    all.into_iter()
        .find(|c| c.id == id)
        .ok_or_else(|| StoreError::NotFound(format!("Campaign {} not found", id)))
}

/// POST /api/campaigns — create campaign with contacts in a transaction
pub async fn insert(db: &Db, input: CreateCampaignInput) -> Result<Campaign, StoreError> {
    let now_ms = Utc::now().timestamp_millis();
    let id = Uuid::new_v4();
    let session_ids_json = serde_json::to_string(&input.session_ids)?;

    // Use provided status or default to draft
    let status = input.status.unwrap_or(CampaignStatus::Draft);

    // Calculate stats from contacts
    let total_contacts = input.contacts.len() as i64;
    let verified_contacts = input
        .contacts
        .iter()
        .filter(|c| {
            c.verification_status
                .as_ref()
                .map(|s| matches!(s, ContactVerificationStatus::Registered))
                .unwrap_or(false)
        })
        .count() as i64;
    let unregistered_count = input
        .contacts
        .iter()
        .filter(|c| {
            c.verification_status
                .as_ref()
                .map(|s| matches!(s, ContactVerificationStatus::Unregistered))
                .unwrap_or(false)
        })
        .count() as i64;

    // Begin transaction
    let mut tx = db.pool().begin().await?;

    // Insert campaign with calculated stats
    sqlx::query!(
        r#"
        INSERT INTO campaigns (id, title, template_text, image_url, media_ref, session_ids, status, created_at, 
                              total_contacts, verified_contacts, unregistered_count)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        "#,
        id.to_string(),
        input.title,
        input.template_text,
        input.image_url,
        input.media_ref,
        session_ids_json,
        status.as_str(),
        now_ms,
        total_contacts,
        verified_contacts,
        unregistered_count
    )
    .execute(&mut *tx)
    .await?;

    // Insert contacts
    for contact_input in &input.contacts {
        let contact_id = Uuid::new_v4();
        let custom_fields_json = serde_json::to_string(&contact_input.custom_fields)?;

        // Use provided verification status or default to unverified
        let verification_status = contact_input
            .verification_status
            .as_ref()
            .map(|s| s.as_str())
            .unwrap_or("unverified");

        sqlx::query!(
            r#"
            INSERT INTO contacts (id, campaign_id, name, raw_phone, formatted_phone, normalized_phone, 
                                  custom_fields, verification_status, wa_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
            contact_id.to_string(),
            id.to_string(),
            contact_input.name,
            contact_input.raw_phone,
            contact_input.formatted_phone,
            contact_input.normalized_phone,
            custom_fields_json,
            verification_status,
            contact_input.wa_id
        )
        .execute(&mut *tx)
        .await?;
    }

    // Commit transaction
    tx.commit().await?;

    // Return the created campaign
    get_by_id(db, id).await
}

/// PATCH /api/campaigns/:id status
pub async fn update_status(
    db: &Db,
    id: Uuid,
    status: CampaignStatus,
) -> Result<Campaign, StoreError> {
    let status_str = status.as_str();
    let now_ms = Utc::now().timestamp_millis();

    // Set started_at on first transition to Running
    // Set completed_at on transition to Completed/Cancelled
    let result = sqlx::query!(
        r#"
        UPDATE campaigns
        SET status = ?,
            started_at = CASE WHEN ? = 'running' AND started_at IS NULL THEN ? ELSE started_at END,
            completed_at = CASE WHEN ? IN ('completed', 'cancelled') THEN ? ELSE completed_at END
        WHERE id = ?
        "#,
        status_str,
        status_str,
        now_ms,
        status_str,
        now_ms,
        id.to_string()
    )
    .execute(db.pool())
    .await?;

    if result.rows_affected() == 0 {
        return Err(StoreError::NotFound(format!("Campaign {} not found", id)));
    }

    get_by_id(db, id).await
}

/// Atomically increment one counter column
pub async fn increment_counter(
    db: &Db,
    campaign_id: Uuid,
    field: CounterField,
) -> Result<(), StoreError> {
    let column = match field {
        CounterField::Sent => "sent_count",
        CounterField::Failed => "failed_count",
        CounterField::Unregistered => "unregistered_count",
        CounterField::Skipped => "skipped_count",
    };

    let query_str = format!(
        "UPDATE campaigns SET {} = {} + 1 WHERE id = ?",
        column, column
    );

    let result = sqlx::query(AssertSqlSafe(query_str))
        .bind(campaign_id.to_string())
        .execute(db.pool())
        .await?;

    if result.rows_affected() == 0 {
        return Err(StoreError::NotFound(format!(
            "Campaign {} not found",
            campaign_id
        )));
    }

    Ok(())
}

/// DELETE /api/campaigns/:id — cascades to contacts + queue_items
pub async fn delete(db: &Db, id: Uuid) -> Result<(), StoreError> {
    let result = sqlx::query!(
        r#"
        DELETE FROM campaigns WHERE id = ?
        "#,
        id.to_string()
    )
    .execute(db.pool())
    .await?;

    if result.rows_affected() == 0 {
        return Err(StoreError::NotFound(format!("Campaign {} not found", id)));
    }

    Ok(())
}

/// PATCH archive flag
pub async fn set_archived(db: &Db, id: Uuid, archived: bool) -> Result<Campaign, StoreError> {
    let archived_int = if archived { 1 } else { 0 };
    let now_ms = if archived {
        Some(Utc::now().timestamp_millis())
    } else {
        None
    };

    let result = sqlx::query!(
        r#"
        UPDATE campaigns
        SET is_archived = ?, archived_at = ?
        WHERE id = ?
        "#,
        archived_int,
        now_ms,
        id.to_string()
    )
    .execute(db.pool())
    .await?;

    if result.rows_affected() == 0 {
        return Err(StoreError::NotFound(format!("Campaign {} not found", id)));
    }

    get_by_id(db, id).await
}

/// Which counter column to increment.
pub enum CounterField {
    Sent,
    Failed,
    Unregistered,
    Skipped,
}
