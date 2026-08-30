//! OmniReach backend — binary entry point.
//!
//! Responsibility: read environment, wire dependencies, start the server.
//! No business logic here. All domain work lives in the four library crates.
//!
//! Environment variables (can be set in .env):
//!   OMNIREACH_ADDR        — bind address (default: 127.0.0.1:3000)
//!   OMNIREACH_TOKEN       — static bearer token for MVP auth (required)
//!   DATABASE_URL          — SQLite path (default: sqlite://omnireach.db)
//!   WABRIDGE_BASE_URL     — WABridge daemon URL (default: http://localhost:7171)
//!   WABRIDGE_TIMEOUT_MS   — HTTP timeout in ms (default: 5000)
//!   RUST_LOG              — tracing filter (default: info)

use omnireach_glue::WaBridgeClient;
use omnireach_server::{router, sse::SseBroadcaster, state::AppState};
use omnireach_store::Db;
use std::net::SocketAddr;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // ── Load .env (silently skip if absent) ───────────────────────────────────
    let _ = dotenvy::dotenv();

    // ── Tracing ───────────────────────────────────────────────────────────────
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "info".into()),
        )
        .init();

    // ── Config from environment ───────────────────────────────────────────────
    let addr: SocketAddr = std::env::var("OMNIREACH_ADDR")
        .unwrap_or_else(|_| "127.0.0.1:3000".to_string())
        .parse()
        .expect("OMNIREACH_ADDR must be a valid socket address");

    let auth_token = std::env::var("OMNIREACH_TOKEN")
        .expect("OMNIREACH_TOKEN must be set (e.g. OMNIREACH_TOKEN=dev-token)");

    let database_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "sqlite://omnireach.db".to_string());

    let wabridge_base_url = std::env::var("WABRIDGE_BASE_URL")
        .unwrap_or_else(|_| "http://localhost:7171".to_string());

    let wabridge_timeout_ms: u64 = std::env::var("WABRIDGE_TIMEOUT_MS")
        .unwrap_or_else(|_| "5000".to_string())
        .parse()
        .unwrap_or(5_000);

    // ── Dependencies ──────────────────────────────────────────────────────────
    tracing::info!("connecting to database: {database_url}");
    let db = Db::connect(&database_url).await?;

    let wa = WaBridgeClient::new(wabridge_base_url, wabridge_timeout_ms);
    let sse = SseBroadcaster::new();

    let state = AppState::new(db, wa, sse, auth_token);

    // ── Router ────────────────────────────────────────────────────────────────
    let app = router::build(state);

    // ── Serve ─────────────────────────────────────────────────────────────────
    tracing::info!("OmniReach listening on http://{addr}");
    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
