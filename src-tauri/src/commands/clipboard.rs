use crate::system::paste;
use tauri::AppHandle;
use tauri_plugin_clipboard_manager::ClipboardExt;

#[tauri::command]
pub async fn paste_text(app: AppHandle, text: String) -> Result<(), String> {
    log::info!("paste_text: writing to clipboard ({} chars)", text.len());

    app.clipboard()
        .write_text(&text)
        .map_err(|e| e.to_string())?;

    log::info!("paste_text: clipboard written, simulating paste keystroke");

    tokio::task::spawn_blocking(move || {
        paste::simulate_paste()
    })
    .await
    .map_err(|e| format!("Paste task panicked: {}", e))?
    .map_err(|e| format!("Paste failed: {}", e))?;

    log::info!("paste_text: done");
    Ok(())
}
