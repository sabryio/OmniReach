//! Shared domain types.
//!
//! These structs are the canonical in-memory representation used by all
//! crates. They derive `Serialize`/`Deserialize` so `store` can persist
//! them and `server` can serialise them to JSON responses.

pub mod campaign;
pub mod contact;
pub mod log_entry;
pub mod queue_item;
pub mod session;
pub mod settings;

// Re-export everything at the types:: level for ergonomic imports.
pub use campaign::{Campaign, CampaignStatus, CreateCampaignInput};
pub use contact::{Contact, ContactVerificationStatus, CreateContactInput};
pub use log_entry::{LogCategory, LogEntry, LogLevel};
pub use queue_item::{QueueItem, QueueItemStatus};
pub use session::{CreateSessionInput, Session, SessionStatus};
pub use settings::AppSettings;
