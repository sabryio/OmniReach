//! Queue item repository — all SQL for the `queue_items` table.

use crate::{Db, StoreError};
use chrono::Utc;
use omnireach_core::types::{QueueItem, QueueItemStatus};
use uuid::Uuid;

/// GET /api/queue — return all queue items
///
/// TODO: Phase 2 — implement real SQL query
pub async fn list_all(_db: &Db, _campaign_id: Option<Uuid>) -> Result<Vec<QueueItem>, StoreError> {
    let now = Utc::now();

    let mock = vec![
        QueueItem {
            id: Uuid::parse_str("11111111-0000-0000-0000-000000000001").unwrap(),
            campaign_id: Uuid::parse_str("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa").unwrap(),
            campaign_title: "Monthly Prescription Refill Reminder".to_string(),
            contact_id: Uuid::new_v4(),
            phone: "+201012345678".to_string(),
            recipient_name: Some("أحمد محمد".to_string()),
            rendered_text: "السلام عليكم، نذكرك بأن وصفتك الطبية جاهزة".to_string(),
            image_url: None,
            status: QueueItemStatus::Pending,
            assigned_session_id: None,
            attempts: 0,
            last_error: None,
            sent_at: None,
            scheduled_for: None,
            rate_limit_hold_until: None,
            time_window_hold_until: None,
            response_payload: None,
        },
        QueueItem {
            id: Uuid::parse_str("11111111-0000-0000-0000-000000000002").unwrap(),
            campaign_id: Uuid::parse_str("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb").unwrap(),
            campaign_title: "COVID-19 Booster Dose Available".to_string(),
            contact_id: Uuid::new_v4(),
            phone: "+201087654321".to_string(),
            recipient_name: Some("Mohamed Hassan".to_string()),
            rendered_text: "Your COVID-19 booster dose is now available".to_string(),
            image_url: None,
            status: QueueItemStatus::HeldRateLimit,
            assigned_session_id: None,
            attempts: 1,
            last_error: None,
            sent_at: None,
            scheduled_for: None,
            rate_limit_hold_until: Some(now + chrono::Duration::minutes(5)),
            time_window_hold_until: None,
            response_payload: None,
        },
        QueueItem {
            id: Uuid::parse_str("11111111-0000-0000-0000-000000000003").unwrap(),
            campaign_id: Uuid::parse_str("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee").unwrap(),
            campaign_title: "Diabetes Care Program Enrollment".to_string(),
            contact_id: Uuid::new_v4(),
            phone: "+201134567890".to_string(),
            recipient_name: Some("حسن محمود".to_string()),
            rendered_text: "ندعوك للانضمام إلى برنامج رعاية مرضى السكري".to_string(),
            image_url: None,
            status: QueueItemStatus::Pending,
            assigned_session_id: None,
            attempts: 0,
            last_error: None,
            sent_at: None,
            scheduled_for: None,
            rate_limit_hold_until: None,
            time_window_hold_until: None,
            response_payload: None,
        },
        QueueItem {
            id: Uuid::parse_str("11111111-0000-0000-0000-000000000004").unwrap(),
            campaign_id: Uuid::parse_str("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa").unwrap(),
            campaign_title: "Monthly Prescription Refill Reminder".to_string(),
            contact_id: Uuid::new_v4(),
            phone: "+201098765432".to_string(),
            recipient_name: Some("فاطمة علي".to_string()),
            rendered_text: "نذكرك بأن وصفتك الطبية جاهزة لإعادة التعبئة".to_string(),
            image_url: None,
            status: QueueItemStatus::Sent,
            assigned_session_id: None,
            attempts: 1,
            last_error: None,
            sent_at: Some(now - chrono::Duration::minutes(1)),
            scheduled_for: None,
            rate_limit_hold_until: None,
            time_window_hold_until: None,
            response_payload: None,
        },
    ];

    Ok(mock)
}

/// GET /api/queue/:id
///
/// TODO: Phase 2 — implement real SQL query
pub async fn get_by_id(_db: &Db, id: Uuid) -> Result<QueueItem, StoreError> {
    let all = list_all(_db, None).await?;
    all.into_iter()
        .find(|q| q.id == id)
        .ok_or_else(|| StoreError::NotFound(format!("Queue item {} not found", id)))
}

/// Batch-load items by ID list — used by the scheduler tick handler.
///
/// TODO: Phase 2 — SELECT * FROM queue_items WHERE id IN (?)
pub async fn list_by_ids(_db: &Db, ids: &[Uuid]) -> Result<Vec<QueueItem>, StoreError> {
    let all = list_all(_db, None).await?;
    Ok(all.into_iter().filter(|q| ids.contains(&q.id)).collect())
}

/// Return pending items for a given campaign.
///
/// TODO: Phase 2 — implement real SQL query
pub async fn list_pending_for_campaign(
    _db: &Db,
    campaign_id: Uuid,
) -> Result<Vec<QueueItem>, StoreError> {
    let all = list_all(_db, None).await?;
    Ok(all
        .into_iter()
        .filter(|q| q.campaign_id == campaign_id && q.status == QueueItemStatus::Pending)
        .collect())
}

/// Update item status.
///
/// TODO: Phase 2 — implement real SQL UPDATE
pub async fn update_status(
    _db: &Db,
    id: Uuid,
    status: QueueItemStatus,
    assigned_session_id: Option<Uuid>,
    last_error: Option<String>,
    response_payload: Option<String>,
) -> Result<QueueItem, StoreError> {
    let mut item = get_by_id(_db, id).await?;
    item.status = status;
    item.assigned_session_id = assigned_session_id;
    item.last_error = last_error;
    item.response_payload = response_payload;
    Ok(item)
}

/// GET /api/queue/stats
///
/// TODO: Phase 2 — SELECT status, COUNT(*) FROM queue_items GROUP BY status
pub async fn stats(_db: &Db) -> Result<QueueStats, StoreError> {
    let all = list_all(_db, None).await?;
    let mut s = QueueStats::default();
    for item in &all {
        match item.status {
            QueueItemStatus::Pending => s.pending += 1,
            QueueItemStatus::Sending => s.sending += 1,
            QueueItemStatus::Sent => s.sent += 1,
            QueueItemStatus::Failed => s.failed += 1,
            QueueItemStatus::HeldRateLimit | QueueItemStatus::HeldTimeWindow => s.held += 1,
            _ => {}
        }
    }
    Ok(s)
}

/// POST /api/queue/:id/cancel
///
/// TODO: Phase 2 — implement real SQL UPDATE
pub async fn cancel(_db: &Db, id: Uuid) -> Result<QueueItem, StoreError> {
    let mut item = get_by_id(_db, id).await?;
    item.status = QueueItemStatus::Cancelled;
    Ok(item)
}

/// Reset all failed items for a campaign back to pending.
///
/// TODO: Phase 2 — implement real SQL UPDATE
pub async fn requeue_failed(_db: &Db, campaign_id: Uuid) -> Result<i64, StoreError> {
    let all = list_all(_db, None).await?;
    let count = all
        .iter()
        .filter(|q| q.campaign_id == campaign_id && q.status == QueueItemStatus::Failed)
        .count() as i64;
    Ok(count)
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
