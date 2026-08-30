//! omnireach-glue
//!
//! Adapter layer that wraps the WABridge daemon HTTP API.
//! This is the only crate allowed to call `http://localhost:7171`.
//!
//! Layer contract:
//!   - Depends on: omnireach-core, reqwest, tokio
//!   - MUST NOT depend on: axum, sqlx (no HTTP server, no DB)
//!   - All WABridge response shapes are in `models`; they are translated
//!     into core types before being returned to callers
//!
//! Architecture note:
//!   crates/server calls crates/glue; crates/glue calls WABridge.
//!   The frontend never calls WABridge directly.

pub mod client;
pub mod error;
pub mod models;

pub use client::WaBridgeClient;
pub use error::GlueError;
