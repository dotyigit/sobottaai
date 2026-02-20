use crate::db::history::{self, HistoryItem};
use tauri::{AppHandle, Manager};

#[tauri::command]
pub async fn get_history(limit: usize, offset: usize) -> Result<Vec<HistoryItem>, String> {
    tokio::task::spawn_blocking(move || history::list(limit, offset))
        .await
        .map_err(|e| e.to_string())?
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn search_history(query: String) -> Result<Vec<HistoryItem>, String> {
    tokio::task::spawn_blocking(move || history::search(&query))
        .await
        .map_err(|e| e.to_string())?
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_history_item(id: String) -> Result<Option<HistoryItem>, String> {
    tokio::task::spawn_blocking(move || history::get(&id))
        .await
        .map_err(|e| e.to_string())?
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_history_item(id: String) -> Result<(), String> {
    tokio::task::spawn_blocking(move || history::delete(&id))
        .await
        .map_err(|e| e.to_string())?
        .map_err(|e| e.to_string())
}

#[tauri::command]
#[allow(clippy::too_many_arguments)]
pub async fn save_history_item(
    app: AppHandle,
    session_id: String,
    transcript: String,
    processed_text: Option<String>,
    model_id: String,
    language: Option<String>,
    ai_function: Option<String>,
    duration_ms: Option<i64>,
) -> Result<(), String> {
    // Check if WAV file exists for this session
    let audio_path = app
        .path()
        .app_data_dir()
        .ok()
        .map(|dir| dir.join("audio").join(format!("{}.wav", session_id)))
        .filter(|p| p.exists())
        .map(|p| p.to_string_lossy().to_string());

    let item = HistoryItem {
        id: session_id,
        audio_path,
        transcript,
        processed_text,
        model_id,
        language,
        ai_function,
        duration_ms,
        created_at: chrono::Utc::now().to_rfc3339(),
    };

    tokio::task::spawn_blocking(move || history::insert(&item))
        .await
        .map_err(|e| e.to_string())?
        .map_err(|e| e.to_string())
}
