pub mod history;
pub mod settings;
pub mod vocabulary;

use once_cell::sync::OnceCell;
use rusqlite::Connection;
use std::path::Path;
use std::sync::Mutex;

static DB: OnceCell<Mutex<Connection>> = OnceCell::new();

pub fn initialize(db_path: &Path) -> anyhow::Result<()> {
    if let Some(parent) = db_path.parent() {
        std::fs::create_dir_all(parent)?;
    }

    let conn = Connection::open(db_path)?;

    conn.execute_batch(
        "
        PRAGMA journal_mode=WAL;
        PRAGMA foreign_keys=ON;

        CREATE TABLE IF NOT EXISTS recordings (
            id TEXT PRIMARY KEY,
            audio_path TEXT,
            transcript TEXT NOT NULL,
            processed_text TEXT,
            model_id TEXT NOT NULL,
            language TEXT,
            ai_function TEXT,
            duration_ms INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS vocabulary (
            id TEXT PRIMARY KEY,
            term TEXT NOT NULL UNIQUE,
            replacement TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS ai_functions (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            prompt TEXT NOT NULL,
            provider TEXT NOT NULL,
            model TEXT,
            is_builtin BOOLEAN DEFAULT FALSE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS rules (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            prompt TEXT,
            pattern TEXT,
            replacement TEXT,
            enabled BOOLEAN DEFAULT TRUE,
            sort_order INTEGER DEFAULT 0
        );

        CREATE INDEX IF NOT EXISTS idx_recordings_created ON recordings(created_at DESC);
        ",
    )?;

    DB.set(Mutex::new(conn))
        .map_err(|_| anyhow::anyhow!("Database already initialized"))?;

    Ok(())
}

pub fn get_conn() -> &'static Mutex<Connection> {
    DB.get().expect("Database not initialized")
}
