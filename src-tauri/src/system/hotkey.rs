use crate::commands::recording::RecordingState;
use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

/// Register the global push-to-talk hotkey (Cmd+Shift+Space / Ctrl+Shift+Space).
pub fn register_hotkey(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let shortcut = Shortcut::new(
        Some(Modifiers::SUPER | Modifiers::SHIFT),
        Code::Space,
    );

    // Register the shortcut
    app.global_shortcut().on_shortcut(shortcut, move |app, _shortcut, event| {
        match event.state() {
            ShortcutState::Pressed => {
                log::info!("Hotkey pressed — starting recording");
                let _ = app.emit("hotkey-pressed", ());

                // Start recording directly
                let state = app.state::<RecordingState>();
                match crate::commands::recording::start_recording(app.clone(), state) {
                    Ok(()) => {
                        // Show recording bar
                        let _ = crate::commands::recording::show_recording_bar(app.clone());
                    }
                    Err(e) => {
                        log::warn!("Failed to start recording from hotkey: {}", e);
                    }
                }
            }
            ShortcutState::Released => {
                log::info!("Hotkey released — stopping recording");
                let _ = app.emit("hotkey-released", ());

                // Stop recording directly
                let state = app.state::<RecordingState>();
                match crate::commands::recording::stop_recording(app.clone(), state) {
                    Ok(result) => {
                        // Hide recording bar
                        let _ = crate::commands::recording::hide_recording_bar(app.clone());
                        log::info!(
                            "Recording stopped via hotkey: session={}, duration={}ms",
                            result.session_id,
                            result.duration_ms
                        );
                    }
                    Err(e) => {
                        log::warn!("Failed to stop recording from hotkey: {}", e);
                        let _ = crate::commands::recording::hide_recording_bar(app.clone());
                    }
                }
            }
        }
    })?;

    log::info!("Global hotkey registered: Cmd+Shift+Space");
    Ok(())
}
