use crate::db;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VocabularyTerm {
    pub id: String,
    pub term: String,
    pub replacement: Option<String>,
    pub created_at: String,
}

pub fn list() -> anyhow::Result<Vec<VocabularyTerm>> {
    let conn = db::get_conn().lock().unwrap();
    let mut stmt = conn.prepare(
        "SELECT id, term, replacement, created_at FROM vocabulary ORDER BY term ASC",
    )?;

    let items = stmt
        .query_map([], |row| {
            Ok(VocabularyTerm {
                id: row.get(0)?,
                term: row.get(1)?,
                replacement: row.get(2)?,
                created_at: row.get(3)?,
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;

    Ok(items)
}

pub fn add(id: &str, term: &str, replacement: Option<&str>) -> anyhow::Result<()> {
    let conn = db::get_conn().lock().unwrap();
    conn.execute(
        "INSERT OR REPLACE INTO vocabulary (id, term, replacement) VALUES (?1, ?2, ?3)",
        rusqlite::params![id, term, replacement],
    )?;
    Ok(())
}

pub fn delete(id: &str) -> anyhow::Result<()> {
    let conn = db::get_conn().lock().unwrap();
    conn.execute(
        "DELETE FROM vocabulary WHERE id = ?1",
        rusqlite::params![id],
    )?;
    Ok(())
}

pub fn get_terms() -> anyhow::Result<Vec<String>> {
    let conn = db::get_conn().lock().unwrap();
    let mut stmt = conn.prepare("SELECT term FROM vocabulary ORDER BY term ASC")?;
    let terms = stmt
        .query_map([], |row| row.get::<_, String>(0))?
        .collect::<Result<Vec<_>, _>>()?;
    Ok(terms)
}
