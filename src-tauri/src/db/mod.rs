pub mod ai_functions;
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

#[cfg(test)]
pub mod tests {
    use super::*;
    use std::sync::Once;

    static INIT: Once = Once::new();

    /// Initialize the test database (in-memory). Safe to call from multiple tests.
    pub fn init_test_db() {
        INIT.call_once(|| {
            let conn = Connection::open_in_memory().unwrap();
            conn.execute_batch(
                "
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
            )
            .unwrap();
            DB.set(Mutex::new(conn))
                .expect("Failed to set test DB");
        });
    }

    // ── History CRUD ─────────────────────────────────────────

    #[test]
    fn history_insert_and_get() {
        init_test_db();
        let item = history::HistoryItem {
            id: "hist-1".into(),
            audio_path: Some("/tmp/test.wav".into()),
            transcript: "Hello world".into(),
            processed_text: Some("Hello, world.".into()),
            model_id: "whisper-base".into(),
            language: Some("en".into()),
            ai_function: None,
            duration_ms: Some(5000),
            created_at: String::new(), // DB fills this
        };
        history::insert(&item).unwrap();

        let retrieved = history::get("hist-1").unwrap();
        assert!(retrieved.is_some());
        let r = retrieved.unwrap();
        assert_eq!(r.id, "hist-1");
        assert_eq!(r.transcript, "Hello world");
        assert_eq!(r.processed_text, Some("Hello, world.".into()));
        assert_eq!(r.model_id, "whisper-base");
        assert_eq!(r.language, Some("en".into()));
        assert_eq!(r.duration_ms, Some(5000));
    }

    #[test]
    fn history_list_returns_items() {
        init_test_db();
        let item = history::HistoryItem {
            id: "hist-list-1".into(),
            audio_path: None,
            transcript: "Test transcript for listing".into(),
            processed_text: None,
            model_id: "whisper-tiny".into(),
            language: None,
            ai_function: None,
            duration_ms: None,
            created_at: String::new(),
        };
        history::insert(&item).unwrap();

        let items = history::list(100, 0).unwrap();
        assert!(!items.is_empty());
        assert!(items.iter().any(|i| i.id == "hist-list-1"));
    }

    #[test]
    fn history_search_finds_matching() {
        init_test_db();
        let item = history::HistoryItem {
            id: "hist-search-1".into(),
            audio_path: None,
            transcript: "unique_search_term_xyz123".into(),
            processed_text: None,
            model_id: "whisper-base".into(),
            language: None,
            ai_function: None,
            duration_ms: None,
            created_at: String::new(),
        };
        history::insert(&item).unwrap();

        let results = history::search("unique_search_term_xyz123").unwrap();
        assert!(!results.is_empty());
        assert!(results.iter().any(|i| i.id == "hist-search-1"));
    }

    #[test]
    fn history_search_no_match() {
        init_test_db();
        let results = history::search("nonexistent_query_abc_99999").unwrap();
        assert!(results.is_empty());
    }

    #[test]
    fn history_delete() {
        init_test_db();
        let item = history::HistoryItem {
            id: "hist-del-1".into(),
            audio_path: None,
            transcript: "To be deleted".into(),
            processed_text: None,
            model_id: "whisper-base".into(),
            language: None,
            ai_function: None,
            duration_ms: None,
            created_at: String::new(),
        };
        history::insert(&item).unwrap();
        assert!(history::get("hist-del-1").unwrap().is_some());

        history::delete("hist-del-1").unwrap();
        assert!(history::get("hist-del-1").unwrap().is_none());
    }

    #[test]
    fn history_get_nonexistent_returns_none() {
        init_test_db();
        let result = history::get("nonexistent-id-12345").unwrap();
        assert!(result.is_none());
    }

    #[test]
    fn history_list_pagination() {
        init_test_db();
        for i in 0..5 {
            let item = history::HistoryItem {
                id: format!("hist-page-{}", i),
                audio_path: None,
                transcript: format!("Paginated item {}", i),
                processed_text: None,
                model_id: "whisper-base".into(),
                language: None,
                ai_function: None,
                duration_ms: None,
                created_at: String::new(),
            };
            history::insert(&item).unwrap();
        }

        let page1 = history::list(2, 0).unwrap();
        let page2 = history::list(2, 2).unwrap();
        assert_eq!(page1.len(), 2);
        assert_eq!(page2.len(), 2);
        // Pages should be different items
        assert_ne!(page1[0].id, page2[0].id);
    }

    #[test]
    fn history_search_in_processed_text() {
        init_test_db();
        let item = history::HistoryItem {
            id: "hist-search-proc-1".into(),
            audio_path: None,
            transcript: "original text".into(),
            processed_text: Some("unique_processed_zyx789".into()),
            model_id: "whisper-base".into(),
            language: None,
            ai_function: None,
            duration_ms: None,
            created_at: String::new(),
        };
        history::insert(&item).unwrap();

        let results = history::search("unique_processed_zyx789").unwrap();
        assert!(!results.is_empty());
    }

    // ── Vocabulary CRUD ──────────────────────────────────────

    #[test]
    fn vocabulary_add_and_list() {
        init_test_db();
        vocabulary::add("vocab-1", "SobottaAI", None).unwrap();

        let terms = vocabulary::list().unwrap();
        assert!(terms.iter().any(|t| t.term == "SobottaAI"));
    }

    #[test]
    fn vocabulary_add_with_replacement() {
        init_test_db();
        vocabulary::add("vocab-2", "gpt4", Some("GPT-4")).unwrap();

        let terms = vocabulary::list().unwrap();
        let found = terms.iter().find(|t| t.term == "gpt4");
        assert!(found.is_some());
        assert_eq!(found.unwrap().replacement, Some("GPT-4".into()));
    }

    #[test]
    fn vocabulary_delete() {
        init_test_db();
        vocabulary::add("vocab-del-1", "DeleteMe", None).unwrap();
        vocabulary::delete("vocab-del-1").unwrap();

        let terms = vocabulary::list().unwrap();
        assert!(!terms.iter().any(|t| t.id == "vocab-del-1"));
    }

    #[test]
    fn vocabulary_get_terms_returns_strings() {
        init_test_db();
        vocabulary::add("vocab-terms-1", "MyTerm", None).unwrap();

        let terms = vocabulary::get_terms().unwrap();
        assert!(terms.contains(&"MyTerm".to_string()));
    }

    #[test]
    fn vocabulary_upsert_replaces_existing() {
        init_test_db();
        vocabulary::add("vocab-upsert", "original", None).unwrap();
        vocabulary::add("vocab-upsert", "updated", Some("Updated Term")).unwrap();

        let terms = vocabulary::list().unwrap();
        let found = terms.iter().find(|t| t.id == "vocab-upsert");
        assert!(found.is_some());
        assert_eq!(found.unwrap().term, "updated");
    }

    // ── AI Functions CRUD ────────────────────────────────────

    #[test]
    fn ai_functions_insert_and_list() {
        init_test_db();
        let item = ai_functions::AiFunctionRow {
            id: "custom-func-1".into(),
            name: "My Custom Function".into(),
            prompt: "Do custom things".into(),
            provider: "openai".into(),
            model: Some("gpt-4".into()),
            is_builtin: false,
        };
        ai_functions::insert(&item).unwrap();

        let funcs = ai_functions::list().unwrap();
        assert!(funcs.iter().any(|f| f.id == "custom-func-1"));
    }

    #[test]
    fn ai_functions_list_excludes_builtin() {
        init_test_db();
        let builtin = ai_functions::AiFunctionRow {
            id: "builtin-test-1".into(),
            name: "Builtin".into(),
            prompt: "Built-in prompt".into(),
            provider: "default".into(),
            model: None,
            is_builtin: true,
        };
        ai_functions::insert(&builtin).unwrap();

        let funcs = ai_functions::list().unwrap();
        assert!(!funcs.iter().any(|f| f.id == "builtin-test-1"));
    }

    #[test]
    fn ai_functions_delete() {
        init_test_db();
        let item = ai_functions::AiFunctionRow {
            id: "func-del-1".into(),
            name: "Delete Me".into(),
            prompt: "To be deleted".into(),
            provider: "openai".into(),
            model: None,
            is_builtin: false,
        };
        ai_functions::insert(&item).unwrap();
        ai_functions::delete("func-del-1").unwrap();

        let funcs = ai_functions::list().unwrap();
        assert!(!funcs.iter().any(|f| f.id == "func-del-1"));
    }

    #[test]
    fn ai_functions_delete_builtin_is_noop() {
        init_test_db();
        let builtin = ai_functions::AiFunctionRow {
            id: "builtin-nodelete".into(),
            name: "Cannot Delete".into(),
            prompt: "I am builtin".into(),
            provider: "default".into(),
            model: None,
            is_builtin: true,
        };
        ai_functions::insert(&builtin).unwrap();

        // Attempting to delete a builtin should not error but also not delete
        ai_functions::delete("builtin-nodelete").unwrap();
        // Verify it's still there (not in list because list filters builtins,
        // but the row should still exist)
        let conn = get_conn().lock().unwrap();
        let count: i32 = conn
            .query_row(
                "SELECT COUNT(*) FROM ai_functions WHERE id = ?1",
                rusqlite::params!["builtin-nodelete"],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(count, 1, "Builtin function should not be deleted");
    }
}
