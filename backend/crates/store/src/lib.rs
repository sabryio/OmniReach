//! omnireach-store
//!
//! SQLite persistence layer — all database access lives here.
//! No HTTP, no WABridge calls, no business logic.
//!
//! Layer contract:
//!   - Depends on: omnireach-core, sqlx, tokio
//!   - MUST NOT depend on: axum, reqwest (no HTTP)
//!   - Exposes a `Db` handle and one repository module per domain aggregate

pub mod db;
pub mod error;

pub mod campaigns;
pub mod contacts;
pub mod logs;
pub mod queue;
pub mod sessions;
pub mod settings;
pub mod templates;

pub use db::Db;
pub use error::StoreError;

#[cfg(test)]
mod sessions_rate_limit_tests;
