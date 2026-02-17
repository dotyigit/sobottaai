use crate::commands::recording::RecordingState;
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

#[tauri::command]
pub fn update_hotkey(app: AppHandle, hotkey: String) -> Result<(), String> {
    let manager = app.global_shortcut();

    // Unregister all existing shortcuts
    manager.unregister_all().map_err(|e| e.to_string())?;

    // Parse the hotkey string into a Shortcut
    let shortcut: tauri_plugin_global_shortcut::Shortcut = hotkey
        .parse()
        .map_err(|e| format!("Invalid hotkey '{}': {:?}", hotkey, e))?;

    // Register the new hotkey
    let app_handle = app.clone();
    manager
        .on_shortcut(shortcut, move |app, _shortcut, event| {
            use tauri::Emitter;
            use tauri_plugin_global_shortcut::ShortcutState;

            match event.state() {
                ShortcutState::Pressed => {
                    log::info!("Hotkey pressed — starting recording");
                    let _ = app.emit("hotkey-pressed", ());
                    let state = app.state::<RecordingState>();
                    match crate::commands::recording::start_recording(app.clone(), state) {
                        Ok(()) => {
                            let _ =
                                crate::commands::recording::show_recording_bar(app.clone());
                        }
                        Err(e) => {
                            log::warn!("Failed to start recording from hotkey: {}", e);
                        }
                    }
                }
                ShortcutState::Released => {
                    log::info!("Hotkey released — stopping recording");
                    let _ = app.emit("hotkey-released", ());
                    let state = app.state::<RecordingState>();
                    match crate::commands::recording::stop_recording(app.clone(), state) {
                        Ok(result) => {
                            let _ =
                                crate::commands::recording::hide_recording_bar(app.clone());
                            log::info!(
                                "Recording stopped via hotkey: session={}, duration={}ms",
                                result.session_id,
                                result.duration_ms
                            );
                        }
                        Err(e) => {
                            log::warn!("Failed to stop recording from hotkey: {}", e);
                            let _ =
                                crate::commands::recording::hide_recording_bar(app.clone());
                        }
                    }
                }
            }
        })
        .map_err(|e| e.to_string())?;

    log::info!("Global hotkey updated to: {}", hotkey);
    Ok(())
}
