//! Core domain error type.
//!
//! All other crates map their errors into `CoreError` before crossing
//! layer boundaries, keeping the domain error vocabulary stable.

use thiserror::Error;

#[derive(Debug, Error)]
pub enum CoreError {
    /// A required field was absent or invalid.
    #[error("validation error: {0}")]
    Validation(String),

    /// A requested resource does not exist.
    #[error("not found: {0}")]
    NotFound(String),

    /// The operation conflicts with current state.
    #[error("conflict: {0}")]
    Conflict(String),

    /// Merge-tag rendering failed.
    #[error("render error: {0}")]
    Render(String),

    /// Quota calculation encountered invalid data.
    #[error("quota error: {0}")]
    Quota(String),
}
