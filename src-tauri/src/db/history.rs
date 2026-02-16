use crate::db;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HistoryItem {
    pub id: String,
    pub audio_path: Option<String>,
    pub transcript: String,
    pub processed_text: Option<String>,
    pub model_id: String,
    pub language: Option<String>,
    pub ai_function: Option<String>,
    pub duration_ms: Option<i64>,
    pub created_at: String,
}

pub fn insert(item: &HistoryItem) -> anyhow::Result<()> {
    let conn = db::get_conn().lock().unwrap();
    conn.execute(
        "INSERT INTO recordings (id, audio_path, transcript, processed_text, model_id, language, ai_function, duration_ms)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        rusqlite::params![
            item.id,
            item.audio_path,
            item.transcript,
            item.processed_text,
            item.model_id,
            item.language,
            item.ai_function,
            item.duration_ms,
        ],
    )?;
    Ok(())
}

pub fn list(limit: usize, offset: usize) -> anyhow::Result<Vec<HistoryItem>> {
    let conn = db::get_conn().lock().unwrap();
    let mut stmt = conn.prepare(
        "SELECT id, audio_path, transcript, processed_text, model_id, language, ai_function, duration_ms, created_at
         FROM recordings ORDER BY created_at DESC LIMIT ?1 OFFSET ?2",
    )?;

    let items = stmt
        .query_map(rusqlite::params![limit, offset], |row| {
            Ok(HistoryItem {
                id: row.get(0)?,
                audio_path: row.get(1)?,
                transcript: row.get(2)?,
                processed_text: row.get(3)?,
                model_id: row.get(4)?,
                language: row.get(5)?,
                ai_function: row.get(6)?,
                duration_ms: row.get(7)?,
                created_at: row.get(8)?,
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;

    Ok(items)
}

pub fn search(query: &str) -> anyhow::Result<Vec<HistoryItem>> {
    let conn = db::get_conn().lock().unwrap();
    let pattern = format!("%{}%", query);
    let mut stmt = conn.prepare(
        "SELECT id, audio_path, transcript, processed_text, model_id, language, ai_function, duration_ms, created_at
         FROM recordings WHERE transcript LIKE ?1 OR processed_text LIKE ?1
         ORDER BY created_at DESC LIMIT 100",
    )?;

    let items = stmt
        .query_map(rusqlite::params![pattern], |row| {
            Ok(HistoryItem {
                id: row.get(0)?,
                audio_path: row.get(1)?,
                transcript: row.get(2)?,
                processed_text: row.get(3)?,
                model_id: row.get(4)?,
                language: row.get(5)?,
                ai_function: row.get(6)?,
                duration_ms: row.get(7)?,
                created_at: row.get(8)?,
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;

    Ok(items)
}

pub fn delete(id: &str) -> anyhow::Result<()> {
    let conn = db::get_conn().lock().unwrap();
    conn.execute("DELETE FROM recordings WHERE id = ?1", rusqlite::params![id])?;
    Ok(())
}

pub fn get(id: &str) -> anyhow::Result<Option<HistoryItem>> {
    let conn = db::get_conn().lock().unwrap();
    let mut stmt = conn.prepare(
        "SELECT id, audio_path, transcript, processed_text, model_id, language, ai_function, duration_ms, created_at
         FROM recordings WHERE id = ?1",
    )?;

    let mut items = stmt
        .query_map(rusqlite::params![id], |row| {
            Ok(HistoryItem {
                id: row.get(0)?,
                audio_path: row.get(1)?,
                transcript: row.get(2)?,
                processed_text: row.get(3)?,
                model_id: row.get(4)?,
                language: row.get(5)?,
                ai_function: row.get(6)?,
                duration_ms: row.get(7)?,
                created_at: row.get(8)?,
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;

    Ok(items.pop())
}
