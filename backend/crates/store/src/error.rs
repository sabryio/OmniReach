//! Store-layer error type.

use thiserror::Error;

#[derive(Debug, Error)]
pub enum StoreError {
    #[error("database error: {0}")]
    Database(#[from] sqlx::Error),

    #[error("record not found: {0}")]
    NotFound(String),

    #[error("serialization error: {0}")]
    Serialization(#[from] serde_json::Error),
}
