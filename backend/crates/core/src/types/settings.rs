//! Application settings domain type.
//!
//! Persisted as key-value rows in the `settings` table.
//! Deserialized into this struct on startup and on `GET /api/settings`.

use rorpc::ZodTs;
use serde::{Deserialize, Serialize};

/// All configurable runtime settings for the OmniReach backend.
#[derive(Debug, Clone, Serialize, Deserialize, ZodTs)]
pub struct AppSettings {
    /// Hour of day (0-23) when the send window opens. Default: 9.
    #[zod(min(0), max(23))]
    pub scheduler_start_hour: u8,
    /// Hour of day (0-23) when the send window closes. Default: 21.
    #[zod(min(0), max(23))]
    pub scheduler_end_hour: u8,
    /// If true, sends outside the window are hard-blocked. Default: true.
    pub scheduler_strict_time_window: bool,
    /// Base URL of the WABridge daemon. Default: "http://localhost:7171".
    #[zod(min_length(1))]
    pub wabridge_base_url: String,
    /// HTTP timeout in milliseconds for WABridge calls. Default: 5000.
    #[zod(min(100), max(60000))]
    pub wabridge_timeout_ms: u64,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            scheduler_start_hour: 9,
            scheduler_end_hour: 21,
            scheduler_strict_time_window: true,
            wabridge_base_url: "http://localhost:7171".to_string(),
            wabridge_timeout_ms: 5_000,
        }
    }
}

/// Input shape for `PATCH /api/settings` — all fields optional.
#[derive(Debug, Clone, Deserialize, Default, ZodTs)]
pub struct UpdateSettingsInput {
    pub scheduler_start_hour: Option<u8>,
    pub scheduler_end_hour: Option<u8>,
    pub scheduler_strict_time_window: Option<bool>,
    pub wabridge_base_url: Option<String>,
    pub wabridge_timeout_ms: Option<u64>,
}
