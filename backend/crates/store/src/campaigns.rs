//! Campaign repository — all SQL for the `campaigns` table.

use crate::{Db, StoreError};
use chrono::Utc;
use omnireach_core::types::{
    Campaign, CampaignStatus, Contact, ContactVerificationStatus, CreateCampaignInput,
};
use std::collections::HashMap;
use uuid::Uuid;

/// GET /api/campaigns — return all campaigns with embedded contacts
///
/// TODO: Phase 2 — implement real SQL query
pub async fn list_all(_db: &Db) -> Result<Vec<Campaign>, StoreError> {
    let now = Utc::now();

    let camp1_id = Uuid::parse_str("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa").unwrap();
    let camp2_id = Uuid::parse_str("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb").unwrap();
    let camp3_id = Uuid::parse_str("cccccccc-cccc-cccc-cccc-cccccccccccc").unwrap();
    let camp4_id = Uuid::parse_str("dddddddd-dddd-dddd-dddd-dddddddddddd").unwrap();
    let camp5_id = Uuid::parse_str("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee").unwrap();
    let camp6_id = Uuid::parse_str("ffffffff-ffff-ffff-ffff-ffffffffffff").unwrap();

    let mock = vec![
        Campaign {
            id: camp1_id,
            title: "Monthly Prescription Refill Reminder".to_string(),
            template_text: "السلام عليكم،\n\nعزيزي {{name}}، نذكرك بأن وصفتك الطبية جاهزة لإعادة التعبئة.".to_string(),
            image_url: Some("https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&h=400&fit=crop".to_string()),
            image_file_name: None,
            session_ids: vec![],
            status: CampaignStatus::Running,
            created_at: now - chrono::Duration::hours(4),
            started_at: Some(now - chrono::Duration::hours(3)),
            completed_at: None,
            scheduled_for: None,
            total_contacts: 1247,
            verified_contacts: 1200,
            unregistered_count: 43,
            sent_count: 892,
            skipped_count: 0,
            failed_count: 8,
            is_archived: false,
            archived_at: None,
            contacts: vec![
                make_contact("c001", camp1_id, "أحمد محمد", "+201012345678", "registered", Some("201012345678@s.whatsapp.net")),
                make_contact("c002", camp1_id, "فاطمة علي", "+201098765432", "registered", Some("201098765432@s.whatsapp.net")),
                make_contact("c003", camp1_id, "محمود حسن", "+201123456789", "unregistered", None),
                make_contact("c004", camp1_id, "سارة إبراهيم", "+201234567890", "registered", Some("201234567890@s.whatsapp.net")),
                make_contact("c005", camp1_id, "خالد عبدالله", "+201156789012", "registered", Some("201156789012@s.whatsapp.net")),
            ],
        },
        Campaign {
            id: camp2_id,
            title: "COVID-19 Booster Dose Available".to_string(),
            template_text: "Dear {{name}},\n\nYour COVID-19 booster dose is now available. Schedule your appointment today.".to_string(),
            image_url: Some("https://images.unsplash.com/photo-1584515933487-779824d29309?w=400&h=400&fit=crop".to_string()),
            image_file_name: None,
            session_ids: vec![],
            status: CampaignStatus::Running,
            created_at: now - chrono::Duration::hours(24),
            started_at: Some(now - chrono::Duration::hours(23)),
            completed_at: None,
            scheduled_for: None,
            total_contacts: 2156,
            verified_contacts: 2100,
            unregistered_count: 54,
            sent_count: 2089,
            skipped_count: 0,
            failed_count: 13,
            is_archived: false,
            archived_at: None,
            contacts: vec![
                make_contact("c006", camp2_id, "Mohamed Hassan", "+201087654321", "registered", Some("201087654321@s.whatsapp.net")),
                make_contact("c007", camp2_id, "Layla Ahmed", "+201145678901", "registered", Some("201145678901@s.whatsapp.net")),
                make_contact("c008", camp2_id, "Omar Youssef", "+201023456789", "unregistered", None),
            ],
        },
        Campaign {
            id: camp3_id,
            title: "Lab Results Ready for Collection".to_string(),
            template_text: "مرحباً {{name}}،\n\nنتائج الفحوصات المخبرية جاهزة للاستلام.".to_string(),
            image_url: Some("https://images.unsplash.com/photo-1579154204601-01588f351e67?w=400&h=400&fit=crop".to_string()),
            image_file_name: None,
            session_ids: vec![],
            status: CampaignStatus::Completed,
            created_at: now - chrono::Duration::hours(48),
            started_at: Some(now - chrono::Duration::hours(47)),
            completed_at: Some(now - chrono::Duration::hours(46)),
            scheduled_for: None,
            total_contacts: 487,
            verified_contacts: 469,
            unregistered_count: 18,
            sent_count: 467,
            skipped_count: 0,
            failed_count: 2,
            is_archived: false,
            archived_at: None,
            contacts: vec![
                make_contact("c009", camp3_id, "نور الدين", "+201198765432", "registered", Some("201198765432@s.whatsapp.net")),
                make_contact("c010", camp3_id, "ريم سعيد", "+201076543210", "registered", Some("201076543210@s.whatsapp.net")),
            ],
        },
        Campaign {
            id: camp4_id,
            title: "Annual Health Checkup Campaign".to_string(),
            template_text: "Hello {{name}},\n\nIt's time for your annual health checkup! Book your appointment now.".to_string(),
            image_url: Some("https://images.unsplash.com/photo-1638202993928-7267aad84c31?w=400&h=400&fit=crop".to_string()),
            image_file_name: None,
            session_ids: vec![],
            status: CampaignStatus::Scheduled,
            created_at: now - chrono::Duration::hours(2),
            started_at: None,
            completed_at: None,
            scheduled_for: Some(now + chrono::Duration::hours(24)),
            total_contacts: 3542,
            verified_contacts: 0,
            unregistered_count: 0,
            sent_count: 0,
            skipped_count: 0,
            failed_count: 0,
            is_archived: false,
            archived_at: None,
            contacts: vec![],
        },
        Campaign {
            id: camp5_id,
            title: "Diabetes Care Program Enrollment".to_string(),
            template_text: "عزيزي {{name}}،\n\nندعوك للانضمام إلى برنامج رعاية مرضى السكري الشامل.".to_string(),
            image_url: Some("https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=400&h=400&fit=crop".to_string()),
            image_file_name: None,
            session_ids: vec![],
            status: CampaignStatus::Running,
            created_at: now - chrono::Duration::hours(12),
            started_at: Some(now - chrono::Duration::hours(10)),
            completed_at: None,
            scheduled_for: None,
            total_contacts: 856,
            verified_contacts: 829,
            unregistered_count: 27,
            sent_count: 342,
            skipped_count: 0,
            failed_count: 5,
            is_archived: false,
            archived_at: None,
            contacts: vec![
                make_contact("c011", camp5_id, "حسن محمود", "+201134567890", "registered", Some("201134567890@s.whatsapp.net")),
                make_contact("c012", camp5_id, "منى خالد", "+201045678901", "registered", Some("201045678901@s.whatsapp.net")),
                make_contact("c013", camp5_id, "يوسف عمر", "+201167890123", "unregistered", None),
            ],
        },
        Campaign {
            id: camp6_id,
            title: "Flu Vaccine Season Reminder".to_string(),
            template_text: "Dear {{name}},\n\nFlu season is here! Protect yourself with our flu vaccine.".to_string(),
            image_url: Some("https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&h=400&fit=crop".to_string()),
            image_file_name: None,
            session_ids: vec![],
            status: CampaignStatus::Paused,
            created_at: now - chrono::Duration::hours(72),
            started_at: Some(now - chrono::Duration::hours(70)),
            completed_at: None,
            scheduled_for: None,
            total_contacts: 1523,
            verified_contacts: 1491,
            unregistered_count: 32,
            sent_count: 678,
            skipped_count: 0,
            failed_count: 4,
            is_archived: false,
            archived_at: None,
            contacts: vec![
                make_contact("c014", camp6_id, "Aisha Mohamed", "+201189012345", "registered", Some("201189012345@s.whatsapp.net")),
            ],
        },
    ];

    Ok(mock)
}

/// GET /api/campaigns/:id
///
/// TODO: Phase 2 — implement real SQL query
pub async fn get_by_id(_db: &Db, id: Uuid) -> Result<Campaign, StoreError> {
    let all = list_all(_db).await?;
    all.into_iter()
        .find(|c| c.id == id)
        .ok_or_else(|| StoreError::NotFound(format!("Campaign {} not found", id)))
}

/// POST /api/campaigns
///
/// TODO: Phase 2 — BEGIN; INSERT campaign; INSERT contacts; INSERT queue_items; COMMIT
pub async fn insert(_db: &Db, input: CreateCampaignInput) -> Result<Campaign, StoreError> {
    let now = Utc::now();
    let id = Uuid::new_v4();
    let contacts = input
        .contacts
        .into_iter()
        .map(|c| Contact {
            id: Uuid::new_v4(),
            campaign_id: id,
            name: c.name,
            raw_phone: c.raw_phone,
            formatted_phone: c.formatted_phone,
            normalized_phone: c.normalized_phone,
            custom_fields: c.custom_fields,
            verification_status: ContactVerificationStatus::Unverified,
            verification_error: None,
            verified_at: None,
            wa_id: None,
        })
        .collect::<Vec<_>>();
    let total = contacts.len() as i64;
    Ok(Campaign {
        id,
        title: input.title,
        template_text: input.template_text,
        image_url: input.image_url,
        image_file_name: None,
        session_ids: input.session_ids,
        status: CampaignStatus::Draft,
        created_at: now,
        started_at: None,
        completed_at: None,
        scheduled_for: None,
        total_contacts: total,
        verified_contacts: 0,
        unregistered_count: 0,
        sent_count: 0,
        skipped_count: 0,
        failed_count: 0,
        is_archived: false,
        archived_at: None,
        contacts,
    })
}

/// PATCH /api/campaigns/:id status
///
/// TODO: Phase 2 — implement real SQL UPDATE
pub async fn update_status(
    _db: &Db,
    id: Uuid,
    status: CampaignStatus,
) -> Result<Campaign, StoreError> {
    let mut campaign = get_by_id(_db, id).await?;
    campaign.status = status;
    Ok(campaign)
}

/// Atomically increment one counter column.
///
/// TODO: Phase 2 — implement real SQL UPDATE
pub async fn increment_counter(
    _db: &Db,
    _campaign_id: Uuid,
    _field: CounterField,
) -> Result<(), StoreError> {
    Ok(())
}

/// DELETE /api/campaigns/:id
///
/// TODO: Phase 2 — implement real SQL DELETE (cascades to contacts + queue_items)
pub async fn delete(_db: &Db, id: Uuid) -> Result<(), StoreError> {
    let _ = get_by_id(_db, id).await?;
    Ok(())
}

/// PATCH archive flag
///
/// TODO: Phase 2 — implement real SQL UPDATE
pub async fn set_archived(_db: &Db, id: Uuid, archived: bool) -> Result<Campaign, StoreError> {
    let mut campaign = get_by_id(_db, id).await?;
    campaign.is_archived = archived;
    campaign.archived_at = if archived { Some(Utc::now()) } else { None };
    Ok(campaign)
}

/// Which counter column to increment.
pub enum CounterField {
    Sent,
    Failed,
    Unregistered,
    Skipped,
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

fn make_contact(
    id: &str,
    campaign_id: Uuid,
    name: &str,
    phone: &str,
    status: &str,
    wa_id: Option<&str>,
) -> Contact {
    let verification_status = match status {
        "registered" => ContactVerificationStatus::Registered,
        "unregistered" => ContactVerificationStatus::Unregistered,
        _ => ContactVerificationStatus::Unverified,
    };
    Contact {
        id: Uuid::parse_str(&format!("{:0<32}", id.replace("c", "0c")))
            .unwrap_or_else(|_| Uuid::new_v4()),
        campaign_id,
        name: name.to_string(),
        raw_phone: phone.to_string(),
        formatted_phone: phone.to_string(),
        normalized_phone: phone.to_string(),
        custom_fields: HashMap::new(),
        verification_status,
        verification_error: None,
        verified_at: None,
        wa_id: wa_id.map(|s| s.to_string()),
    }
}
