//! Server-Sent Events broadcaster.
//!
//! `SseBroadcaster` wraps a `tokio::sync::broadcast` channel.
//! Any handler can call `.send(event)` to fan-out to all connected
//! frontend clients listening on `GET /api/events`.
//!
//! Each SSE frame is:
//!   event: <event_type>
//!   data: <json_payload>\n\n

use rorpc::ZodTs;
use tokio::sync::broadcast::{self, Receiver, Sender};

/// Capacity of the broadcast channel (number of buffered events).
/// Slow consumers drop messages beyond this; the frontend reconnects via SSE.
const CHANNEL_CAPACITY: usize = 256;

/// The named event types emitted over the SSE stream.
/// Must stay in sync with the TypeScript `openEventStream()` handler in the frontend.
#[derive(Debug, Clone, ZodTs, serde::Serialize, serde::Deserialize)]
#[serde(tag = "type", content = "data", rename_all = "snake_case")]
pub enum SseEvent {
    /// A new campaign was created and queued.
    CampaignCreated { campaign_id: String, title: String },
    /// A campaign changed status (paused, completed, etc.).
    CampaignStatus { campaign_id: String, status: String },
    /// A single queue item changed status.
    QueueItemUpdated {
        item_id: String,
        new_status: String,
        campaign_id: String,
    },
    /// A new queue item was added.
    QueueItemAdded {
        item_id: String,
        campaign_id: String,
        phone: String,
    },
    /// Aggregate queue counts after a scheduler tick.
    QueueStats {
        pending: i64,
        sending: i64,
        sent: i64,
        failed: i64,
        held: i64,
    },
    /// A WABridge session changed status or has a new QR code.
    SessionStatus {
        session_id: String,
        status: String,
        qr_code_data: Option<String>,
    },
    /// A new log entry was inserted.
    LogEntry(serde_json::Value),
    /// Progress update for a background batch contact verification job.
    ContactVerifyProgress {
        job_id: String,
        checked: u32,
        total: u32,
        registered: u32,
        unregistered: u32,
    },
    /// Final results for a completed batch contact verification job.
    ContactVerifyComplete {
        job_id: String,
        results: serde_json::Value,
    },
}

/// Cheaply-cloneable broadcaster handle.
/// Clone this into each handler that needs to emit events.
#[derive(Clone, Debug)]
pub struct SseBroadcaster {
    tx: Sender<SseEvent>,
}

impl SseBroadcaster {
    pub fn new() -> Self {
        let (tx, _) = broadcast::channel(CHANNEL_CAPACITY);
        Self { tx }
    }

    /// Emit an event to all connected SSE clients.
    /// Silently drops the event if there are no subscribers.
    pub fn send(&self, event: SseEvent) {
        // `send` only errors when there are zero receivers — safe to ignore.
        let _ = self.tx.send(event);
    }

    /// Subscribe to the event stream. Returns a `Receiver` that the SSE
    /// handler converts into an async `Stream`.
    pub fn subscribe(&self) -> Receiver<SseEvent> {
        self.tx.subscribe()
    }
}

impl Default for SseBroadcaster {
    fn default() -> Self {
        Self::new()
    }
}
