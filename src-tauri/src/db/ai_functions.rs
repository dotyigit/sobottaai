use crate::db;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AiFunctionRow {
    pub id: String,
    pub name: String,
    pub prompt: String,
    pub provider: String,
    pub model: Option<String>,
    pub is_builtin: bool,
}

pub fn insert(item: &AiFunctionRow) -> anyhow::Result<()> {
    let conn = db::get_conn().lock().unwrap();
    conn.execute(
        "INSERT OR REPLACE INTO ai_functions (id, name, prompt, provider, model, is_builtin)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        rusqlite::params![
            item.id,
            item.name,
            item.prompt,
            item.provider,
            item.model,
            item.is_builtin,
        ],
    )?;
    Ok(())
}

pub fn list() -> anyhow::Result<Vec<AiFunctionRow>> {
    let conn = db::get_conn().lock().unwrap();
    let mut stmt = conn.prepare(
        "SELECT id, name, prompt, provider, model, is_builtin FROM ai_functions WHERE is_builtin = FALSE",
    )?;

    let items = stmt
        .query_map([], |row| {
            Ok(AiFunctionRow {
                id: row.get(0)?,
                name: row.get(1)?,
                prompt: row.get(2)?,
                provider: row.get(3)?,
                model: row.get(4)?,
                is_builtin: row.get(5)?,
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;

    Ok(items)
}

pub fn delete(id: &str) -> anyhow::Result<()> {
    let conn = db::get_conn().lock().unwrap();
    conn.execute(
        "DELETE FROM ai_functions WHERE id = ?1 AND is_builtin = FALSE",
        rusqlite::params![id],
    )?;
    Ok(())
}
