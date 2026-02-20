use crate::commands::recording::RecordingState;
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

/// Shared state for the recording mode so the hotkey handler can read it.
pub struct HotkeyModeState {
    /// "push-to-talk" or "toggle"
    pub mode: Mutex<String>,
}

impl HotkeyModeState {
    pub fn new() -> Self {
        Self {
            mode: Mutex::new("push-to-talk".to_string()),
        }
    }
}

/// Register the global hotkey with the initial default (Alt+Space).
pub fn register_hotkey(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let shortcut = Shortcut::new(Some(Modifiers::ALT), Code::Space);
    register_shortcut(app, shortcut)?;
    log::info!("Global hotkey registered: Option+Space");
    Ok(())
}

/// Core registration logic — used by both initial setup and update_hotkey.
pub fn register_shortcut(
    app: &AppHandle,
    shortcut: Shortcut,
) -> Result<(), Box<dyn std::error::Error>> {
    app.global_shortcut()
        .on_shortcut(shortcut, move |app, _shortcut, event| {
            let mode = app.state::<HotkeyModeState>().mode.lock().unwrap().clone();

            let rec_state = app.state::<RecordingState>();
            let is_recording = rec_state.is_recording();

            match mode.as_str() {
                "toggle" => {
                    // Toggle mode: only react to Press, ignore Release
                    if event.state() == ShortcutState::Pressed {
                        if is_recording {
                            log::info!("Hotkey pressed (toggle) — stopping recording");
                            let _ = app.emit("hotkey-released", ());
                            match crate::commands::recording::stop_recording(app.clone(), rec_state)
                            {
                                Ok(result) => {
                                    // Don't hide bar — RecordingPipeline handles it after processing
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
                        } else {
                            log::info!("Hotkey pressed (toggle) — starting recording");
                            let _ = app.emit("hotkey-pressed", ());
                            // Emit BEFORE the blocking start_recording() call so the
                            // frontend can reset state while audio init runs (~50-200ms).
                            let _ = app.emit("recording-will-start", ());
                            match crate::commands::recording::start_recording(
                                app.clone(),
                                rec_state,
                            ) {
                                Ok(()) => {
                                    let _ =
                                        crate::commands::recording::show_recording_bar(app.clone());
                                }
                                Err(e) => {
                                    log::warn!("Failed to start recording from hotkey: {}", e);
                                    let _ = app.emit("recording-error", e.clone());
                                    // Emit dummy recording-stopped so frontend can reset state
                                    let _ = app.emit(
                                        "recording-stopped",
                                        crate::commands::recording::StopResult {
                                            session_id: String::new(),
                                            duration_ms: 0,
                                            sample_count: 0,
                                        },
                                    );
                                }
                            }
                        }
                    }
                    // Release does nothing in toggle mode
                }
                _ => {
                    // Push-to-talk: Press → start, Release → stop
                    match event.state() {
                        ShortcutState::Pressed => {
                            log::info!("Hotkey pressed — starting recording");
                            let _ = app.emit("hotkey-pressed", ());
                            // Emit BEFORE the blocking start_recording() call so the
                            // frontend can reset state while audio init runs (~50-200ms).
                            let _ = app.emit("recording-will-start", ());
                            match crate::commands::recording::start_recording(
                                app.clone(),
                                rec_state,
                            ) {
                                Ok(()) => {
                                    let _ =
                                        crate::commands::recording::show_recording_bar(app.clone());
                                }
                                Err(e) => {
                                    log::warn!("Failed to start recording from hotkey: {}", e);
                                    let _ = app.emit("recording-error", e.clone());
                                }
                            }
                        }
                        ShortcutState::Released => {
                            log::info!("Hotkey released — stopping recording");
                            let _ = app.emit("hotkey-released", ());
                            match crate::commands::recording::stop_recording(app.clone(), rec_state)
                            {
                                Ok(result) => {
                                    // Don't hide bar — RecordingPipeline handles it after processing
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
                                    let _ = app.emit(
                                        "recording-stopped",
                                        crate::commands::recording::StopResult {
                                            session_id: String::new(),
                                            duration_ms: 0,
                                            sample_count: 0,
                                        },
                                    );
                                }
                            }
                        }
                    }
                }
            }
        })?;

    Ok(())
}
