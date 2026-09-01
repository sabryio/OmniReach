//! Contact handlers.
//!
//! Route → Handler mapping:
//!   POST /api/contacts/verify-batch → verify_batch

use crate::{error::ApiError, sse::SseEvent, state::AppState};
use axum::{Json, extract::State, http::StatusCode};
use serde::{Deserialize, Serialize};
use serde_json::json;
use uuid::Uuid;

#[derive(Debug, Deserialize)]
pub struct VerifyBatchRequest {
    pub session_id: String,
    pub phones: Vec<String>,
}

#[derive(Debug, Serialize)]
pub struct VerifyBatchResponse {
    pub job_id: String,
}

/// POST /api/contacts/verify-batch
///
/// Accepts a session ID and list of phone numbers.
/// Returns 202 Accepted immediately with a job_id.
/// Progress and results are streamed via SSE:
///   event: contact.verify_progress  — after each batch of 100
///   event: contact.verify_complete  — when all phones checked
pub async fn verify_batch(
    State(state): State<AppState>,
    Json(body): Json<VerifyBatchRequest>,
) -> Result<(StatusCode, Json<VerifyBatchResponse>), ApiError> {
    if body.phones.is_empty() {
        return Err(ApiError::BadRequest("phones list is empty".to_string()));
    }

    // Parse session UUID and load api_key
    let session_id = body
        .session_id
        .parse::<Uuid>()
        .map_err(|_| ApiError::BadRequest(format!("invalid session_id: {}", body.session_id)))?;

    let session = omnireach_store::sessions::get_by_id(&state.db, session_id).await?;

    // Generate job ID returned to caller for correlating SSE events
    let job_id = Uuid::new_v4().to_string();

    // Clone handles to move into background task
    let db = state.db.clone();
    let wa = state.wa.clone();
    let sse = state.sse.clone();
    let phones = body.phones;
    let api_key = session.api_key.clone();
    let job_id_task = job_id.clone();

    tokio::spawn(async move {
        let total = phones.len() as u32;
        let mut checked: u32 = 0;
        let mut registered: u32 = 0;
        let mut unregistered: u32 = 0;
        let mut all_results: Vec<serde_json::Value> = Vec::with_capacity(phones.len());

        // Normalize phones → JIDs, keeping original phone for result mapping
        let phone_jid_pairs: Vec<(String, String)> = phones
            .iter()
            .map(|p| {
                let digits = p.trim().trim_start_matches('+');
                let jid = format!("{}@s.whatsapp.net", digits);
                (p.clone(), jid)
            })
            .collect();

        // Process in chunks of 100
        let chunks: Vec<_> = phone_jid_pairs.chunks(100).collect();
        let chunk_count = chunks.len();
        for (chunk_idx, chunk) in chunks.into_iter().enumerate() {
            let jids: Vec<String> = chunk.iter().map(|(_, jid)| jid.clone()).collect();

            // Call WABridge — retry once on rate limit
            let batch_result = {
                let result = wa.check_contacts_batch(jids.clone(), &api_key).await;
                match result {
                    Err(omnireach_glue::GlueError::RateLimit(_)) => {
                        // Back off 2s and retry once
                        tokio::time::sleep(tokio::time::Duration::from_secs(2)).await;
                        wa.check_contacts_batch(jids.clone(), &api_key).await
                    }
                    other => other,
                }
            };

            match batch_result {
                Ok(resp) => {
                    // Build a jid → is_registered lookup
                    let lookup: std::collections::HashMap<String, bool> = resp
                        .results
                        .iter()
                        .map(|r| (r.jid.clone(), r.is_registered))
                        .collect();

                    for (phone, jid) in chunk {
                        let is_reg = lookup.get(jid).copied().unwrap_or(false);
                        let wa_id = if is_reg { Some(jid.clone()) } else { None };

                        if is_reg {
                            registered += 1;
                        } else {
                            unregistered += 1;
                        }
                        checked += 1;

                        all_results.push(json!({
                            "phone": phone,
                            "is_registered": is_reg,
                            "wa_id": wa_id,
                        }));
                    }
                }
                Err(e) => {
                    // Mark entire chunk as error
                    for (phone, _jid) in chunk {
                        checked += 1;
                        all_results.push(json!({
                            "phone": phone,
                            "is_registered": false,
                            "wa_id": null,
                            "error": e.to_string(),
                        }));
                    }
                }
            }

            // Emit progress after each chunk
            sse.send(SseEvent::ContactVerifyProgress {
                job_id: job_id_task.clone(),
                checked,
                total,
                registered,
                unregistered,
            });

            // Sleep between batches to avoid WABridge rate limiting
            // Skip sleep after the last chunk
            if chunk_idx + 1 < chunk_count {
                tokio::time::sleep(tokio::time::Duration::from_secs(5)).await;
            }
        }

        // Emit completion
        sse.send(SseEvent::ContactVerifyComplete {
            job_id: job_id_task.clone(),
            results: json!(all_results),
        });

        // Log verification summary
        let log_entry = omnireach_core::types::LogEntry {
            id: Uuid::new_v4(),
            timestamp: chrono::Utc::now(),
            level: omnireach_core::types::LogLevel::Info,
            category: omnireach_core::types::LogCategory::Verification,
            message: format!(
                "Batch verification complete: {}/{} registered ({} unregistered)",
                registered, total, unregistered,
            ),
            details: Some(json!({ "job_id": job_id_task, "total": total })),
        };
        let _ = omnireach_store::logs::insert(&db, log_entry).await;
    });

    Ok((StatusCode::ACCEPTED, Json(VerifyBatchResponse { job_id })))
}
