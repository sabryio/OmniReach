//! Shared application state injected into every handler via Axum's `State`.
//!
//! `AppState` is cloned per request (all fields are Arc-backed or Copy).
//! Adding a new service dependency means adding it here and updating
//! `router::build`.

use omnireach_glue::WaBridgeClient;
use omnireach_store::Db;
use std::sync::Arc;
use std::time::Instant;

use crate::sse::SseBroadcaster;

/// Application-wide state shared across all Axum handlers.
#[derive(Clone)]
pub struct AppState {
    /// SQLite connection pool — all reads and writes go through here.
    pub db: Db,

    /// WABridge HTTP client — proxies calls to the daemon.
    pub wa: Arc<WaBridgeClient>,

    /// SSE broadcaster — handlers push events here; the SSE handler streams them.
    pub sse: Arc<SseBroadcaster>,

    /// Static bearer token for MVP auth (from `OMNIREACH_TOKEN` env var).
    pub auth_token: Arc<String>,

    /// Server start time — used for uptime calculation in health check.
    start_time: Instant,
}

impl AppState {
    pub fn new(db: Db, wa: WaBridgeClient, sse: SseBroadcaster, auth_token: String) -> Self {
        Self {
            db,
            wa: Arc::new(wa),
            sse: Arc::new(sse),
            auth_token: Arc::new(auth_token),
            start_time: Instant::now(),
        }
    }

    /// Returns the server start time for uptime calculation.
    pub fn start_time(&self) -> Instant {
        self.start_time
    }
}
