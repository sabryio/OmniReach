//! Queue item repository — all SQL for the `queue_items` table.

use crate::{Db, StoreError};
use chrono::Utc;
use omnireach_core::types::{QueueItem, QueueItemStatus};
use sqlx::{AssertSqlSafe, Row};
use uuid::Uuid;

/// GET /api/queue — return all queue items
pub async fn list_all(db: &Db, campaign_id: Option<Uuid>) -> Result<Vec<QueueItem>, StoreError> {
    let (query_str, param) = if let Some(cid) = campaign_id {
        (
            "SELECT id, campaign_id, campaign_title, contact_id, phone, recipient_name,
                    rendered_text, image_url, media_ref, status, assigned_session_id, attempts,
                    last_error, sent_at, scheduled_for, rate_limit_hold_until,
                    time_window_hold_until, response_payload
             FROM queue_items
             WHERE campaign_id = ?
             ORDER BY scheduled_for ASC, id ASC",
            Some(cid.to_string()),
        )
    } else {
        (
            "SELECT id, campaign_id, campaign_title, contact_id, phone, recipient_name,
                    rendered_text, image_url, media_ref, status, assigned_session_id, attempts,
                    last_error, sent_at, scheduled_for, rate_limit_hold_until,
                    time_window_hold_until, response_payload
             FROM queue_items
             ORDER BY scheduled_for ASC, id ASC",
            None,
        )
    };

    let mut query = sqlx::query(query_str);
    if let Some(p) = param {
        query = query.bind(p);
    }

    let rows = query.fetch_all(db.pool()).await?;

    rows.iter()
        .map(|row| {
            let id_str: &str = row.try_get("id")?;
            let id = Uuid::parse_str(id_str).map_err(|_| {
                StoreError::InvalidData(format!("Invalid queue item ID: {}", id_str))
            })?;

            let campaign_id_str: &str = row.try_get("campaign_id")?;
            let campaign_id = Uuid::parse_str(campaign_id_str).map_err(|_| {
                StoreError::InvalidData(format!("Invalid campaign_id: {}", campaign_id_str))
            })?;

            let contact_id_str: &str = row.try_get("contact_id")?;
            let contact_id = Uuid::parse_str(contact_id_str).map_err(|_| {
                StoreError::InvalidData(format!("Invalid contact_id: {}", contact_id_str))
            })?;

            let status_str: &str = row.try_get("status")?;
            let status = match status_str {
                "pending" => QueueItemStatus::Pending,
                "verifying" => QueueItemStatus::Verifying,
                "sending" => QueueItemStatus::Sending,
                "sent" => QueueItemStatus::Sent,
                "skipped_unregistered" => QueueItemStatus::SkippedUnregistered,
                "failed" => QueueItemStatus::Failed,
                "held_rate_limit" => QueueItemStatus::HeldRateLimit,
                "held_time_window" => QueueItemStatus::HeldTimeWindow,
                "cancelled" => QueueItemStatus::Cancelled,
                _ => {
                    return Err(StoreError::InvalidData(format!(
                        "Unknown status: {}",
                        status_str
                    )));
                }
            };

            let assigned_session_id: Option<String> = row.try_get("assigned_session_id")?;
            let assigned_session_id = assigned_session_id
                .as_deref()
                .and_then(|s| Uuid::parse_str(s).ok());

            let sent_at: Option<i64> = row.try_get("sent_at")?;
            let scheduled_for: Option<i64> = row.try_get("scheduled_for")?;
            let rate_limit_hold_until: Option<i64> = row.try_get("rate_limit_hold_until")?;
            let time_window_hold_until: Option<i64> = row.try_get("time_window_hold_until")?;

            Ok(QueueItem {
                id,
                campaign_id,
                campaign_title: row.try_get("campaign_title")?,
                contact_id,
                phone: row.try_get("phone")?,
                recipient_name: row.try_get("recipient_name")?,
                rendered_text: row.try_get("rendered_text")?,
                image_url: row.try_get("image_url")?,
                media_ref: row.try_get("media_ref")?,
                status,
                assigned_session_id,
                attempts: row.try_get("attempts")?,
                last_error: row.try_get("last_error")?,
                sent_at: sent_at.and_then(chrono::DateTime::from_timestamp_millis),
                scheduled_for: scheduled_for.and_then(chrono::DateTime::from_timestamp_millis),
                rate_limit_hold_until: rate_limit_hold_until
                    .and_then(chrono::DateTime::from_timestamp_millis),
                time_window_hold_until: time_window_hold_until
                    .and_then(chrono::DateTime::from_timestamp_millis),
                response_payload: row.try_get("response_payload")?,
            })
        })
        .collect()
}

/// GET /api/queue/:id
pub async fn get_by_id(db: &Db, id: Uuid) -> Result<QueueItem, StoreError> {
    let row = sqlx::query!(
        r#"
        SELECT id, campaign_id, campaign_title, contact_id, phone, recipient_name,
               rendered_text, image_url, media_ref, status, assigned_session_id, attempts,
               last_error, sent_at, scheduled_for, rate_limit_hold_until,
               time_window_hold_until, response_payload
        FROM queue_items
        WHERE id = ?
        "#,
        id.to_string()
    )
    .fetch_optional(db.pool())
    .await?
    .ok_or_else(|| StoreError::NotFound(format!("Queue item {} not found", id)))?;

    let id_str = row.id.as_deref().unwrap_or("");
    let parsed_id = Uuid::parse_str(id_str)
        .map_err(|_| StoreError::InvalidData(format!("Invalid queue item ID: {}", id_str)))?;

    let campaign_id_str = row.campaign_id.as_str();
    let campaign_id = Uuid::parse_str(campaign_id_str).map_err(|_| {
        StoreError::InvalidData(format!("Invalid campaign_id: {}", campaign_id_str))
    })?;

    let contact_id_str = row.contact_id.as_str();
    let contact_id = Uuid::parse_str(contact_id_str)
        .map_err(|_| StoreError::InvalidData(format!("Invalid contact_id: {}", contact_id_str)))?;

    let status_str = row.status.as_str();
    let status = match status_str {
        "pending" => QueueItemStatus::Pending,
        "verifying" => QueueItemStatus::Verifying,
        "sending" => QueueItemStatus::Sending,
        "sent" => QueueItemStatus::Sent,
        "skipped_unregistered" => QueueItemStatus::SkippedUnregistered,
        "failed" => QueueItemStatus::Failed,
        "held_rate_limit" => QueueItemStatus::HeldRateLimit,
        "held_time_window" => QueueItemStatus::HeldTimeWindow,
        "cancelled" => QueueItemStatus::Cancelled,
        _ => {
            return Err(StoreError::InvalidData(format!(
                "Unknown status: {}",
                status_str
            )));
        }
    };

    let assigned_session_id = row
        .assigned_session_id
        .as_deref()
        .and_then(|s| Uuid::parse_str(s).ok());

    Ok(QueueItem {
        id: parsed_id,
        campaign_id,
        campaign_title: row.campaign_title,
        contact_id,
        phone: row.phone,
        recipient_name: row.recipient_name,
        rendered_text: row.rendered_text,
        image_url: row.image_url,
        media_ref: row.media_ref,
        status,
        assigned_session_id,
        attempts: row.attempts,
        last_error: row.last_error,
        sent_at: row
            .sent_at
            .and_then(chrono::DateTime::from_timestamp_millis),
        scheduled_for: row
            .scheduled_for
            .and_then(chrono::DateTime::from_timestamp_millis),
        rate_limit_hold_until: row
            .rate_limit_hold_until
            .and_then(chrono::DateTime::from_timestamp_millis),
        time_window_hold_until: row
            .time_window_hold_until
            .and_then(chrono::DateTime::from_timestamp_millis),
        response_payload: row.response_payload,
    })
}

/// Batch-load items by ID list — used by the scheduler tick handler.
pub async fn list_by_ids(db: &Db, ids: &[Uuid]) -> Result<Vec<QueueItem>, StoreError> {
    if ids.is_empty() {
        return Ok(vec![]);
    }

    let id_strings: Vec<String> = ids.iter().map(|id| id.to_string()).collect();
    let placeholders = id_strings
        .iter()
        .map(|_| "?")
        .collect::<Vec<_>>()
        .join(", ");
    let query_str = format!(
        "SELECT id, campaign_id, campaign_title, contact_id, phone, recipient_name,
                rendered_text, image_url, media_ref, status, assigned_session_id, attempts,
                last_error, sent_at, scheduled_for, rate_limit_hold_until,
                time_window_hold_until, response_payload
         FROM queue_items
         WHERE id IN ({})",
        placeholders
    );

    let mut query = sqlx::query(AssertSqlSafe(query_str));
    for id_str in &id_strings {
        query = query.bind(id_str);
    }

    let rows = query.fetch_all(db.pool()).await?;

    rows.iter()
        .map(|row| {
            let id_str: &str = row.try_get("id")?;
            let id = Uuid::parse_str(id_str).map_err(|_| {
                StoreError::InvalidData(format!("Invalid queue item ID: {}", id_str))
            })?;

            let campaign_id_str: &str = row.try_get("campaign_id")?;
            let campaign_id = Uuid::parse_str(campaign_id_str).map_err(|_| {
                StoreError::InvalidData(format!("Invalid campaign_id: {}", campaign_id_str))
            })?;

            let contact_id_str: &str = row.try_get("contact_id")?;
            let contact_id = Uuid::parse_str(contact_id_str).map_err(|_| {
                StoreError::InvalidData(format!("Invalid contact_id: {}", contact_id_str))
            })?;

            let status_str: &str = row.try_get("status")?;
            let status = match status_str {
                "pending" => QueueItemStatus::Pending,
                "verifying" => QueueItemStatus::Verifying,
                "sending" => QueueItemStatus::Sending,
                "sent" => QueueItemStatus::Sent,
                "skipped_unregistered" => QueueItemStatus::SkippedUnregistered,
                "failed" => QueueItemStatus::Failed,
                "held_rate_limit" => QueueItemStatus::HeldRateLimit,
                "held_time_window" => QueueItemStatus::HeldTimeWindow,
                "cancelled" => QueueItemStatus::Cancelled,
                _ => {
                    return Err(StoreError::InvalidData(format!(
                        "Unknown status: {}",
                        status_str
                    )));
                }
            };

            let assigned_session_id: Option<String> = row.try_get("assigned_session_id")?;
            let assigned_session_id = assigned_session_id
                .as_deref()
                .and_then(|s| Uuid::parse_str(s).ok());

            let sent_at: Option<i64> = row.try_get("sent_at")?;
            let scheduled_for: Option<i64> = row.try_get("scheduled_for")?;
            let rate_limit_hold_until: Option<i64> = row.try_get("rate_limit_hold_until")?;
            let time_window_hold_until: Option<i64> = row.try_get("time_window_hold_until")?;

            Ok(QueueItem {
                id,
                campaign_id,
                campaign_title: row.try_get("campaign_title")?,
                contact_id,
                phone: row.try_get("phone")?,
                recipient_name: row.try_get("recipient_name")?,
                rendered_text: row.try_get("rendered_text")?,
                image_url: row.try_get("image_url")?,
                media_ref: row.try_get("media_ref")?,
                status,
                assigned_session_id,
                attempts: row.try_get("attempts")?,
                last_error: row.try_get("last_error")?,
                sent_at: sent_at.and_then(chrono::DateTime::from_timestamp_millis),
                scheduled_for: scheduled_for.and_then(chrono::DateTime::from_timestamp_millis),
                rate_limit_hold_until: rate_limit_hold_until
                    .and_then(chrono::DateTime::from_timestamp_millis),
                time_window_hold_until: time_window_hold_until
                    .and_then(chrono::DateTime::from_timestamp_millis),
                response_payload: row.try_get("response_payload")?,
            })
        })
        .collect()
}

/// Return pending items for a given campaign.
pub async fn list_pending_for_campaign(
    db: &Db,
    campaign_id: Uuid,
) -> Result<Vec<QueueItem>, StoreError> {
    let rows = sqlx::query!(
        r#"
        SELECT id, campaign_id, campaign_title, contact_id, phone, recipient_name,
               rendered_text, image_url, media_ref, status, assigned_session_id, attempts,
               last_error, sent_at, scheduled_for, rate_limit_hold_until,
               time_window_hold_until, response_payload
        FROM queue_items
        WHERE campaign_id = ? AND status = 'pending'
        ORDER BY scheduled_for ASC, id ASC
        "#,
        campaign_id.to_string()
    )
    .fetch_all(db.pool())
    .await?;

    rows.into_iter()
        .map(|row| {
            let id_str = row.id.as_deref().unwrap_or("");
            let id = Uuid::parse_str(id_str).map_err(|_| {
                StoreError::InvalidData(format!("Invalid queue item ID: {}", id_str))
            })?;

            let campaign_id_str = row.campaign_id.as_str();
            let campaign_id = Uuid::parse_str(campaign_id_str).map_err(|_| {
                StoreError::InvalidData(format!("Invalid campaign_id: {}", campaign_id_str))
            })?;

            let contact_id_str = row.contact_id.as_str();
            let contact_id = Uuid::parse_str(contact_id_str).map_err(|_| {
                StoreError::InvalidData(format!("Invalid contact_id: {}", contact_id_str))
            })?;

            let assigned_session_id = row
                .assigned_session_id
                .as_deref()
                .and_then(|s| Uuid::parse_str(s).ok());

            Ok(QueueItem {
                id,
                campaign_id,
                campaign_title: row.campaign_title,
                contact_id,
                phone: row.phone,
                recipient_name: row.recipient_name,
                rendered_text: row.rendered_text,
                image_url: row.image_url,
                media_ref: row.media_ref,
                status: QueueItemStatus::Pending,
                assigned_session_id,
                attempts: row.attempts,
                last_error: row.last_error,
                sent_at: row
                    .sent_at
                    .and_then(chrono::DateTime::from_timestamp_millis),
                scheduled_for: row
                    .scheduled_for
                    .and_then(chrono::DateTime::from_timestamp_millis),
                rate_limit_hold_until: row
                    .rate_limit_hold_until
                    .and_then(chrono::DateTime::from_timestamp_millis),
                time_window_hold_until: row
                    .time_window_hold_until
                    .and_then(chrono::DateTime::from_timestamp_millis),
                response_payload: row.response_payload,
            })
        })
        .collect()
}
/// Update item status.
pub async fn update_status(
    db: &Db,
    id: Uuid,
    status: QueueItemStatus,
    assigned_session_id: Option<Uuid>,
    last_error: Option<String>,
    response_payload: Option<String>,
) -> Result<QueueItem, StoreError> {
    let status_str = match status {
        QueueItemStatus::Pending => "pending",
        QueueItemStatus::Verifying => "verifying",
        QueueItemStatus::Sending => "sending",
        QueueItemStatus::Sent => "sent",
        QueueItemStatus::SkippedUnregistered => "skipped_unregistered",
        QueueItemStatus::Failed => "failed",
        QueueItemStatus::HeldRateLimit => "held_rate_limit",
        QueueItemStatus::HeldTimeWindow => "held_time_window",
        QueueItemStatus::Cancelled => "cancelled",
    };

    let sent_at = if status == QueueItemStatus::Sent {
        Some(Utc::now().timestamp_millis())
    } else {
        None
    };

    let assigned_session_str = assigned_session_id.map(|id| id.to_string());

    sqlx::query!(
        r#"
        UPDATE queue_items
        SET status = ?,
            assigned_session_id = ?,
            last_error = ?,
            response_payload = ?,
            sent_at = COALESCE(?, sent_at),
            attempts = attempts + 1
        WHERE id = ?
        "#,
        status_str,
        assigned_session_str,
        last_error,
        response_payload,
        sent_at,
        id.to_string()
    )
    .execute(db.pool())
    .await?;

    get_by_id(db, id).await
}

/// GET /api/queue/stats
pub async fn stats(db: &Db) -> Result<QueueStats, StoreError> {
    let rows = sqlx::query!(
        r#"
        SELECT status, COUNT(*) as count
        FROM queue_items
        GROUP BY status
        "#
    )
    .fetch_all(db.pool())
    .await?;

    let mut s = QueueStats::default();

    for row in rows {
        let status_str = row.status.as_str();
        let count = row.count;

        match status_str {
            "pending" => s.pending = count,
            "sending" => s.sending = count,
            "sent" => s.sent = count,
            "failed" => s.failed = count,
            "held_rate_limit" | "held_time_window" => s.held += count,
            _ => {}
        }
    }

    Ok(s)
}

/// POST /api/queue/:id/cancel
pub async fn cancel(db: &Db, id: Uuid) -> Result<QueueItem, StoreError> {
    sqlx::query!(
        r#"
        UPDATE queue_items
        SET status = 'cancelled'
        WHERE id = ?
        "#,
        id.to_string()
    )
    .execute(db.pool())
    .await?;

    get_by_id(db, id).await
}

/// Reset all failed items for a campaign back to pending.
pub async fn requeue_failed(db: &Db, campaign_id: Uuid) -> Result<i64, StoreError> {
    let result = sqlx::query!(
        r#"
        UPDATE queue_items
        SET status = 'pending', attempts = 0, last_error = NULL
        WHERE campaign_id = ? AND status = 'failed'
        "#,
        campaign_id.to_string()
    )
    .execute(db.pool())
    .await?;

    Ok(result.rows_affected() as i64)
}

/// Create a new queue item for a contact in a campaign.
pub async fn create_item(
    db: &Db,
    campaign_id: Uuid,
    campaign_title: &str,
    contact_id: Uuid,
    phone: &str,
    recipient_name: &str,
    rendered_text: &str,
    image_url: Option<&str>,
) -> Result<QueueItem, StoreError> {
    let id = Uuid::new_v4();
    let now_ms = Utc::now().timestamp_millis();

    sqlx::query!(
        r#"
        INSERT INTO queue_items (
            id, campaign_id, campaign_title, contact_id, phone, recipient_name,
            rendered_text, image_url, status, attempts, scheduled_for
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', 0, ?)
        "#,
        id.to_string(),
        campaign_id.to_string(),
        campaign_title,
        contact_id.to_string(),
        phone,
        recipient_name,
        rendered_text,
        image_url,
        now_ms
    )
    .execute(db.pool())
    .await?;

    get_by_id(db, id).await
}

/// Aggregated queue status counts.
#[derive(Debug, Default, serde::Serialize)]
pub struct QueueStats {
    pub pending: i64,
    pub sending: i64,
    pub sent: i64,
    pub failed: i64,
    pub held: i64,
}
