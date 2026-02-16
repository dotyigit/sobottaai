use crate::system::paste;
use tauri::AppHandle;
use tauri_plugin_clipboard_manager::ClipboardExt;

#[tauri::command]
pub async fn paste_text(app: AppHandle, text: String) -> Result<(), String> {
    app.clipboard()
        .write_text(&text)
        .map_err(|e| e.to_string())?;

    paste::simulate_paste().map_err(|e| e.to_string())?;

    Ok(())
}
