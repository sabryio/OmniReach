//! Contact handlers.
//!
//! Route → Handler mapping:
//!   POST /api/contacts/verify → verify

use crate::{error::ApiError, state::AppState};
use axum::{Json, extract::State};
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
pub struct VerifyRequest {
    pub phone: String,
    pub session_id: String,
}

#[derive(Debug, Serialize)]
pub struct VerifyResponse {
    pub registered: bool,
    pub wa_id: Option<String>,
    pub error: Option<String>,
}

/// POST /api/contacts/verify
pub async fn verify(
    State(_state): State<AppState>,
    Json(_body): Json<VerifyRequest>,
) -> Result<Json<VerifyResponse>, ApiError> {
    // TODO:
    // 1. Parse session_id → Uuid, load session from DB to get api_key
    // 2. Build JID: format!("{}@s.whatsapp.net", normalized_phone)
    // 3. state.wa.check_contact(&jid, &session.api_key).await
    // 4. update contact verification_status in DB
    // 5. return VerifyResponse { registered, wa_id }
    todo!("verify contact via WABridge, return registered/wa_id")
}
