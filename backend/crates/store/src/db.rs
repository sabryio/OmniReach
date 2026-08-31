//! Database connection pool initialisation.
//!
//! `Db` is a thin newtype around `sqlx::SqlitePool`.
//! It is the only type passed through `AppState` to handlers.
//! All SQL lives in the repository modules, never in handlers.

use sqlx::{SqlitePool, sqlite::SqlitePoolOptions};

/// Shared database handle — cheaply cloneable (Arc inside).
#[derive(Clone, Debug)]
pub struct Db(SqlitePool);

impl Db {
    /// Open (or create) the SQLite database at `url` and run migrations.
    ///
    /// `url` example: `"sqlite://omnireach.db"` or `"sqlite://:memory:"`
    pub async fn connect(url: &str) -> Result<Self, sqlx::Error> {
        let pool = SqlitePoolOptions::new()
            .max_connections(5)
            .connect(url)
            .await?;

        // Run embedded migrations on every startup.
        sqlx::migrate!("./src/migrations").run(&pool).await?;

        Ok(Self(pool))
    }

    /// Borrow the inner pool for use in repository functions.
    pub fn pool(&self) -> &SqlitePool {
        &self.0
    }
}

impl From<SqlitePool> for Db {
    fn from(pool: SqlitePool) -> Self {
        Self(pool)
    }
}
