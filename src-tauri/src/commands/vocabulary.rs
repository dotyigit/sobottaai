use crate::db::vocabulary::{self, VocabularyTerm};

#[tauri::command]
pub async fn get_vocabulary() -> Result<Vec<VocabularyTerm>, String> {
    tokio::task::spawn_blocking(vocabulary::list)
        .await
        .map_err(|e| e.to_string())?
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn add_term(term: String, replacement: Option<String>) -> Result<(), String> {
    let id = uuid::Uuid::new_v4().to_string();
    tokio::task::spawn_blocking(move || {
        vocabulary::add(&id, &term, replacement.as_deref())
    })
    .await
    .map_err(|e| e.to_string())?
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_term(id: String) -> Result<(), String> {
    tokio::task::spawn_blocking(move || vocabulary::delete(&id))
        .await
        .map_err(|e| e.to_string())?
        .map_err(|e| e.to_string())
}
