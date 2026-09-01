//! Scheduler tick handler — the backend's core execution workhorse.
//!
//! Route → Handler mapping:
//!   POST /api/scheduler/tick → tick
//!
//! The frontend scheduler loop calls this every 5 s with the IDs it has
//! selected to send. The backend executes the full verify → send pipeline
//! for each item, updates the DB, emits SSE events, and returns results.

use crate::{error::ApiError, state::AppState};
use axum::{Json, extract::State};
use omnireach_core::types::LogEntry;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Deserialize)]
pub struct TickRequest {
    pub item_ids: Vec<Uuid>,
}

#[derive(Debug, Serialize)]
pub struct ProcessedItem {
    pub item_id: Uuid,
    pub new_status: String,
    pub sent_at: Option<i64>,
    pub error: Option<String>,
    pub response_payload: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct TickResponse {
    pub processed: Vec<ProcessedItem>,
    pub new_logs: Vec<LogEntry>,
}

/// POST /api/scheduler/tick
///
/// For each item_id:
///   1. Load item + campaign + contact from DB
///   2. If contact unverified → call wa.check_contact()
///      → unregistered: mark skipped_unregistered, continue
///   3. If campaign has image_url and no cached media_ref → call wa.upload_media()
///   4. Call wa.send_text() or wa.send_image()
///   5. On success: mark sent, append timestamp to session, increment campaign counter
///   6. On GlueError: mark failed / held_rate_limit, record error
///   7. Insert LogEntry per outcome
///   8. Emit SSE: QueueItemUpdated per item, QueueStats once at end
///   9. Return TickResponse { processed, new_logs }
pub async fn tick(
    State(state): State<AppState>,
    Json(body): Json<TickRequest>,
) -> Result<Json<TickResponse>, ApiError> {
    use chrono::Utc;
    use omnireach_core::{renderer, types::*};
    use omnireach_glue::GlueError;
    use omnireach_store::{campaigns, contacts, logs, queue, sessions};

    let mut processed_items = Vec::new();
    let mut new_logs = Vec::new();

    for item_id in body.item_ids {
        // 1. Load queue item
        let item = match queue::get_by_id(&state.db, item_id).await {
            Ok(item) => item,
            Err(e) => {
                tracing::error!("Failed to load queue item {}: {}", item_id, e);
                continue;
            }
        };

        // Load campaign
        let campaign = match campaigns::get_by_id(&state.db, item.campaign_id).await {
            Ok(c) => c,
            Err(e) => {
                tracing::error!("Failed to load campaign {}: {}", item.campaign_id, e);
                continue;
            }
        };

        // Load contact
        let contact = match contacts::get_by_id(&state.db, item.contact_id).await {
            Ok(c) => c,
            Err(e) => {
                tracing::error!("Failed to load contact {}: {}", item.contact_id, e);
                continue;
            }
        };

        // Get session (use first one from campaign for MVP)
        let session = if let Some(session_id) = campaign.session_ids.first() {
            match sessions::get_by_id(&state.db, *session_id).await {
                Ok(s) => s,
                Err(e) => {
                    tracing::error!("Failed to load session {}: {}", session_id, e);
                    let _ = queue::update_status(
                        &state.db,
                        item_id,
                        QueueItemStatus::Failed,
                        None,
                        Some("Session not found".to_string()),
                        None,
                    )
                    .await;

                    let log = LogEntry {
                        id: Uuid::new_v4(),
                        timestamp: Utc::now(),
                        level: LogLevel::Error,
                        category: LogCategory::Scheduler,
                        message: format!("Session not found for queue item {}", item_id),
                        details: None,
                    };
                    let _ = logs::insert(&state.db, log.clone()).await;
                    new_logs.push(log);

                    processed_items.push(ProcessedItem {
                        item_id,
                        new_status: "failed".to_string(),
                        sent_at: None,
                        error: Some("Session not found".to_string()),
                        response_payload: None,
                    });
                    continue;
                }
            }
        } else {
            // No sessions in campaign
            let _ = queue::update_status(
                &state.db,
                item_id,
                QueueItemStatus::Failed,
                None,
                Some("No sessions configured".to_string()),
                None,
            )
            .await;

            let log = LogEntry {
                id: Uuid::new_v4(),
                timestamp: Utc::now(),
                level: LogLevel::Error,
                category: LogCategory::Scheduler,
                message: format!("No sessions configured for campaign {}", campaign.title),
                details: None,
            };
            let _ = logs::insert(&state.db, log.clone()).await;
            new_logs.push(log);

            processed_items.push(ProcessedItem {
                item_id,
                new_status: "failed".to_string(),
                sent_at: None,
                error: Some("No sessions configured".to_string()),
                response_payload: None,
            });
            continue;
        };

        // 2. Verify contact if unverified
        if contact.verification_status == ContactVerificationStatus::Unverified {
            // Build JID from phone: +966501234567 -> 966501234567@s.whatsapp.net
            let jid = format!("{}@s.whatsapp.net", contact.formatted_phone);

            match state.wa.check_contact(&jid, &session.api_key).await {
                Ok(response) => {
                    if response.registered {
                        // Update contact as registered
                        let wa_id = response.jid.clone();
                        let _ = contacts::update_verification(
                            &state.db,
                            contact.id,
                            ContactVerificationStatus::Registered,
                            wa_id,
                            None,
                        )
                        .await;

                        // Log verification success
                        let log = LogEntry {
                            id: Uuid::new_v4(),
                            timestamp: Utc::now(),
                            level: LogLevel::Info,
                            category: LogCategory::Verification,
                            message: format!("Verified {} (registered)", contact.raw_phone),
                            details: Some(serde_json::json!({
                                "contact_id": contact.id,
                                "phone": contact.raw_phone,
                                "wa_id": response.jid,
                            })),
                        };
                        let _ = logs::insert(&state.db, log.clone()).await;
                        new_logs.push(log);
                    } else {
                        // Unregistered - skip this item
                        let _ = contacts::update_verification(
                            &state.db,
                            contact.id,
                            ContactVerificationStatus::Unregistered,
                            None,
                            None,
                        )
                        .await;

                        let _ = queue::update_status(
                            &state.db,
                            item_id,
                            QueueItemStatus::SkippedUnregistered,
                            Some(session.id),
                            None,
                            None,
                        )
                        .await;

                        // Log skip
                        let log = LogEntry {
                            id: Uuid::new_v4(),
                            timestamp: Utc::now(),
                            level: LogLevel::Warn,
                            category: LogCategory::Verification,
                            message: format!("Skipped {} (unregistered)", contact.raw_phone),
                            details: Some(serde_json::json!({
                                "contact_id": contact.id,
                                "phone": contact.raw_phone,
                            })),
                        };
                        let _ = logs::insert(&state.db, log.clone()).await;
                        new_logs.push(log);

                        processed_items.push(ProcessedItem {
                            item_id,
                            new_status: "skipped_unregistered".to_string(),
                            sent_at: None,
                            error: None,
                            response_payload: None,
                        });
                        continue;
                    }
                }
                Err(GlueError::Timeout(_)) | Err(GlueError::Network(_)) => {
                    // Network error - mark as failed
                    let error_msg = "Network timeout during verification".to_string();
                    let _ = queue::update_status(
                        &state.db,
                        item_id,
                        QueueItemStatus::Failed,
                        Some(session.id),
                        Some(error_msg.clone()),
                        None,
                    )
                    .await;

                    let log = LogEntry {
                        id: Uuid::new_v4(),
                        timestamp: Utc::now(),
                        level: LogLevel::Error,
                        category: LogCategory::Verification,
                        message: format!("Verification timeout for {}", contact.raw_phone),
                        details: Some(serde_json::json!({
                            "contact_id": contact.id,
                            "error": error_msg,
                        })),
                    };
                    let _ = logs::insert(&state.db, log.clone()).await;
                    new_logs.push(log);

                    processed_items.push(ProcessedItem {
                        item_id,
                        new_status: "failed".to_string(),
                        sent_at: None,
                        error: Some(error_msg),
                        response_payload: None,
                    });
                    continue;
                }
                Err(e) => {
                    // Other verification error
                    let error_msg = format!("Verification error: {}", e);
                    let _ = contacts::update_verification(
                        &state.db,
                        contact.id,
                        ContactVerificationStatus::Error,
                        None,
                        Some(error_msg.clone()),
                    )
                    .await;

                    let _ = queue::update_status(
                        &state.db,
                        item_id,
                        QueueItemStatus::Failed,
                        Some(session.id),
                        Some(error_msg.clone()),
                        None,
                    )
                    .await;

                    let log = LogEntry {
                        id: Uuid::new_v4(),
                        timestamp: Utc::now(),
                        level: LogLevel::Error,
                        category: LogCategory::Verification,
                        message: format!("Verification failed for {}", contact.raw_phone),
                        details: Some(serde_json::json!({
                            "contact_id": contact.id,
                            "error": error_msg,
                        })),
                    };
                    let _ = logs::insert(&state.db, log.clone()).await;
                    new_logs.push(log);

                    processed_items.push(ProcessedItem {
                        item_id,
                        new_status: "failed".to_string(),
                        sent_at: None,
                        error: Some(error_msg),
                        response_payload: None,
                    });
                    continue;
                }
            }
        }

        // 3. Render message text
        let rendered_text = renderer::render(&item.rendered_text, &contact);

        // 4. Send message
        let to_jid = format!("{}@s.whatsapp.net", contact.formatted_phone);

        let send_result = if let Some(media_ref) = &item.media_ref {
            // Campaign has an uploaded image - send with media_ref
            state
                .wa
                .send_image(&to_jid, media_ref, Some(&rendered_text), &session.api_key)
                .await
        } else if item.image_url.is_some() {
            // Legacy: image_url without media_ref (uploaded images should have media_ref in Phase 6+)
            // For MVP, send as text since we don't have the media_ref
            state
                .wa
                .send_text(&to_jid, &rendered_text, &session.api_key)
                .await
        } else {
            // No image - send text message
            state
                .wa
                .send_text(&to_jid, &rendered_text, &session.api_key)
                .await
        };

        match send_result {
            Ok(receipt) => {
                // Success! Update queue item, session timestamps, campaign counter
                let now = Utc::now();
                let now_ms = now.timestamp_millis();

                let response_json = serde_json::json!({
                    "message_id": receipt.id,
                    "timestamp": receipt.timestamp,
                });

                let _ = queue::update_status(
                    &state.db,
                    item_id,
                    QueueItemStatus::Sent,
                    Some(session.id),
                    None,
                    Some(response_json.to_string()),
                )
                .await;

                // Append timestamp to session's rate limit arrays
                let _ = sessions::try_acquire_send_slot(&state.db, session.id, now_ms).await;

                // Increment campaign sent counter
                let _ = campaigns::increment_counter(
                    &state.db,
                    campaign.id,
                    omnireach_store::campaigns::CounterField::Sent,
                )
                .await;

                // Log success
                let log = LogEntry {
                    id: Uuid::new_v4(),
                    timestamp: now,
                    level: LogLevel::Success,
                    category: LogCategory::Send,
                    message: format!("Sent to {} via {}", contact.name, session.name),
                    details: Some(response_json.clone()),
                };
                let _ = logs::insert(&state.db, log.clone()).await;
                new_logs.push(log);

                processed_items.push(ProcessedItem {
                    item_id,
                    new_status: "sent".to_string(),
                    sent_at: Some(now_ms),
                    error: None,
                    response_payload: Some(response_json.to_string()),
                });
            }
            Err(GlueError::RateLimit(msg)) => {
                // Rate limited by WABridge
                let _ = queue::update_status(
                    &state.db,
                    item_id,
                    QueueItemStatus::HeldRateLimit,
                    Some(session.id),
                    Some(msg.clone()),
                    None,
                )
                .await;

                let log = LogEntry {
                    id: Uuid::new_v4(),
                    timestamp: Utc::now(),
                    level: LogLevel::Warn,
                    category: LogCategory::RateLimit,
                    message: format!("Rate limited for {}", contact.name),
                    details: Some(serde_json::json!({
                        "contact_id": contact.id,
                        "session_id": session.id,
                        "error": msg,
                    })),
                };
                let _ = logs::insert(&state.db, log.clone()).await;
                new_logs.push(log);

                processed_items.push(ProcessedItem {
                    item_id,
                    new_status: "held_rate_limit".to_string(),
                    sent_at: None,
                    error: Some(msg),
                    response_payload: None,
                });
            }
            Err(e) => {
                // Send failed
                let error_msg = format!("Send failed: {}", e);

                let _ = queue::update_status(
                    &state.db,
                    item_id,
                    QueueItemStatus::Failed,
                    Some(session.id),
                    Some(error_msg.clone()),
                    None,
                )
                .await;

                // Increment failed counter
                let _ = campaigns::increment_counter(
                    &state.db,
                    campaign.id,
                    omnireach_store::campaigns::CounterField::Failed,
                )
                .await;

                let log = LogEntry {
                    id: Uuid::new_v4(),
                    timestamp: Utc::now(),
                    level: LogLevel::Error,
                    category: LogCategory::Send,
                    message: format!("Failed to send to {}", contact.name),
                    details: Some(serde_json::json!({
                        "contact_id": contact.id,
                        "session_id": session.id,
                        "error": error_msg,
                    })),
                };
                let _ = logs::insert(&state.db, log.clone()).await;
                new_logs.push(log);

                processed_items.push(ProcessedItem {
                    item_id,
                    new_status: "failed".to_string(),
                    sent_at: None,
                    error: Some(error_msg),
                    response_payload: None,
                });
            }
        }
    }

    // TODO: Phase 7 - Emit SSE events for UI updates
    // state.sse.emit_queue_updates(&processed_items);
    // state.sse.emit_queue_stats(...);

    Ok(Json(TickResponse {
        processed: processed_items,
        new_logs,
    }))
}
