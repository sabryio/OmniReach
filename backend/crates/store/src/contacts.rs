//! Contact repository — all SQL for the `contacts` table.

use crate::{Db, StoreError};
use omnireach_core::types::{Contact, ContactVerificationStatus};
use uuid::Uuid;

// TODO: implement list_by_campaign
pub async fn list_by_campaign(_db: &Db, _campaign_id: Uuid) -> Result<Vec<Contact>, StoreError> {
    todo!("SELECT * FROM contacts WHERE campaign_id = ?")
}

// TODO: implement get_by_id
pub async fn get_by_id(_db: &Db, _id: Uuid) -> Result<Contact, StoreError> {
    todo!("SELECT * FROM contacts WHERE id = ?")
}

// TODO: implement update_verification
/// Updates verification status, wa_id, and error after a WABridge check.
pub async fn update_verification(
    _db: &Db,
    _id: Uuid,
    _status: ContactVerificationStatus,
    _wa_id: Option<String>,
    _error: Option<String>,
) -> Result<Contact, StoreError> {
    todo!("UPDATE contacts SET verification_status = ?, wa_id = ?, verification_error = ?, verified_at = ? WHERE id = ?")
}
