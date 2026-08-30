//! Handler modules — one file per API resource group.
//! Each module contains thin Axum handler functions that extract inputs,
//! call store/glue, emit SSE events, and return JSON responses.
//! No business logic lives here.

pub mod campaigns;
pub mod contacts;
pub mod logs;
pub mod media;
pub mod queue;
pub mod scheduler;
pub mod sessions;
pub mod settings;
