use serde_json::Value;

#[tauri::command]
pub fn get_settings() -> Result<Value, String> {
    // Settings are primarily managed via tauri-plugin-store on the frontend.
    // This command provides a fallback for any Rust-side settings needs.
    Ok(serde_json::json!({}))
}

#[tauri::command]
pub fn save_settings(settings: Value) -> Result<(), String> {
    let _ = settings;
    Ok(())
}
