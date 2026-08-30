//! Campaign repository — all SQL for the `campaigns` table.
//!
//! Every function takes a `&Db` and returns `Result<_, StoreError>`.
//! No business logic here — validation and state-machine rules live in
//! `omnireach-core`.

use crate::{Db, StoreError};
use omnireach_core::types::{Campaign, CampaignStatus, CreateCampaignInput};
use uuid::Uuid;

// TODO: implement list_all
pub async fn list_all(_db: &Db) -> Result<Vec<Campaign>, StoreError> {
    todo!("SELECT all campaigns with embedded contacts")
}

// TODO: implement get_by_id
pub async fn get_by_id(_db: &Db, _id: Uuid) -> Result<Campaign, StoreError> {
    todo!("SELECT one campaign by id, embed contacts")
}

// TODO: implement insert
/// Creates a campaign row, inserts contacts and pending queue items.
/// Renders merge tags into `rendered_text` for each contact.
/// Returns the full campaign with embedded contacts.
pub async fn insert(_db: &Db, _input: CreateCampaignInput) -> Result<Campaign, StoreError> {
    todo!("BEGIN; INSERT campaign; INSERT contacts; INSERT queue_items; COMMIT")
}

// TODO: implement update_status
pub async fn update_status(
    _db: &Db,
    _id: Uuid,
    _status: CampaignStatus,
) -> Result<Campaign, StoreError> {
    todo!("UPDATE campaigns SET status = ? WHERE id = ?")
}

// TODO: implement increment_counter
/// Atomically increments one of: sent_count, failed_count, unregistered_count, skipped_count.
pub async fn increment_counter(
    _db: &Db,
    _campaign_id: Uuid,
    _field: CounterField,
) -> Result<(), StoreError> {
    todo!("UPDATE campaigns SET <field> = <field> + 1 WHERE id = ?")
}

// TODO: implement delete
pub async fn delete(_db: &Db, _id: Uuid) -> Result<(), StoreError> {
    todo!("DELETE FROM campaigns WHERE id = ? (cascades to contacts + queue_items)")
}

// TODO: implement set_archived
pub async fn set_archived(_db: &Db, _id: Uuid, _archived: bool) -> Result<Campaign, StoreError> {
    todo!("UPDATE campaigns SET is_archived = ?, archived_at = ? WHERE id = ?")
}

/// Which counter column to increment.
pub enum CounterField {
    Sent,
    Failed,
    Unregistered,
    Skipped,
}
