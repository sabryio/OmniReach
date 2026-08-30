//! omnireach-core
//!
//! Pure domain layer — zero I/O, zero async.
//! Contains all shared types, business rules, and pure-logic modules.
//!
//! Layer contract:
//!   - MUST NOT depend on tokio, sqlx, axum, or reqwest
//!   - MUST NOT perform any I/O (file, network, database)
//!   - MAY depend on serde, uuid, chrono, thiserror

pub mod error;
pub mod quota;
pub mod renderer;
pub mod types;
