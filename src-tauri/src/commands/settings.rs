use crate::system::hotkey::HotkeyModeState;
use crate::system::tray;
use serde_json::Value;
use tauri::{AppHandle, Manager};
use tauri_plugin_global_shortcut::GlobalShortcutExt;

#[tauri::command]
pub fn get_settings() -> Result<Value, String> {
    // Settings are primarily managed via tauri-plugin-store on the frontend.
    Ok(serde_json::json!({}))
}

#[tauri::command]
pub fn save_settings(settings: Value) -> Result<(), String> {
    let _ = settings;
    Ok(())
}

/// Sync tray menu check marks with current frontend settings.
#[tauri::command]
pub fn sync_tray(
    app: AppHandle,
    model: String,
    language: String,
    ai_function: Option<String>,
) -> Result<(), String> {
    tray::update_tray_selection(&app, &model, &language, ai_function.as_deref());
    Ok(())
}

#[tauri::command]
pub fn update_hotkey(app: AppHandle, hotkey: String) -> Result<(), String> {
    // Parse FIRST — validate before unregistering anything
    let shortcut: tauri_plugin_global_shortcut::Shortcut = hotkey
        .parse()
        .map_err(|e| format!("Invalid hotkey '{}': {:?}", hotkey, e))?;

    let manager = app.global_shortcut();

    // Only unregister after we know the new shortcut is valid
    manager.unregister_all().map_err(|e| e.to_string())?;

    // Register via the shared handler that reads HotkeyModeState
    crate::system::hotkey::register_shortcut(&app, shortcut).map_err(|e| e.to_string())?;

    log::info!("Global hotkey updated to: {}", hotkey);
    Ok(())
}

/// Update the recording mode (push-to-talk or toggle).
#[tauri::command]
pub fn update_recording_mode(app: AppHandle, mode: String) -> Result<(), String> {
    let state = app.state::<HotkeyModeState>();
    *state.mode.lock().unwrap() = mode.clone();
    log::info!("Recording mode updated to: {}", mode);
    Ok(())
}

#[tauri::command]
pub fn restart_app(app: AppHandle) -> Result<(), String> {
    app.restart();
}
