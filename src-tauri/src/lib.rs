mod audio;
mod commands;
mod db;
mod llm;
mod models;
mod rules;
mod stt;
mod system;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(
            tauri_plugin_log::Builder::default()
                .level(log::LevelFilter::Info)
                .build(),
        )
        .manage(commands::recording::RecordingState::new())
        .manage(commands::transcription::SttManager::new())
        .manage(system::tray::TrayMenuState::new())
        .manage(system::hotkey::HotkeyModeState::new())
        .setup(|app| {
            let app_handle = app.handle().clone();

            // Initialize database
            let db_path = app
                .path()
                .app_data_dir()
                .expect("failed to resolve app data dir")
                .join("sobottaai.db");
            db::initialize(&db_path).expect("failed to initialize database");

            // Setup system tray
            system::tray::setup_tray(&app_handle)?;

            // Pre-create the recording bar window (hidden) so showing it later
            // doesn't activate the app or steal focus from the user's current app.
            if let Err(e) = commands::recording::create_recording_bar(&app_handle) {
                log::error!("Failed to pre-create recording bar: {}", e);
            }

            // Register global hotkey for push-to-talk
            if let Err(e) = system::hotkey::register_hotkey(&app_handle) {
                log::error!("Failed to register global hotkey: {:?}", e);
            }

            log::info!("SobottaAI started successfully");
            Ok(())
        })
        // Intercept window close: hide instead of destroying the window.
        // This lets the app keep running in the system tray.
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                if window.label() == "main" {
                    api.prevent_close();
                    let _ = window.hide();

                    // macOS: hide dock icon when the main window is hidden
                    #[cfg(target_os = "macos")]
                    {
                        let app = window.app_handle();
                        let _ = app.set_activation_policy(tauri::ActivationPolicy::Accessory);
                    }

                    log::info!("Main window hidden to tray");
                }
            }
        })
        .invoke_handler(tauri::generate_handler![
            // Recording
            commands::recording::start_recording,
            commands::recording::stop_recording,
            commands::recording::show_recording_bar,
            commands::recording::hide_recording_bar,
            // Transcription
            commands::transcription::transcribe,
            commands::transcription::transcribe_file,
            // Models
            commands::models::list_models,
            commands::models::download_model,
            commands::models::delete_model,
            // AI Functions & Rules
            commands::ai_functions::list_ai_functions,
            commands::ai_functions::execute_ai_function,
            commands::ai_functions::save_ai_function,
            commands::ai_functions::delete_ai_function,
            commands::ai_functions::apply_rules,
            // History
            commands::history::get_history,
            commands::history::search_history,
            commands::history::get_history_item,
            commands::history::delete_history_item,
            commands::history::save_history_item,
            // Settings
            commands::settings::get_settings,
            commands::settings::save_settings,
            commands::settings::update_hotkey,
            commands::settings::update_recording_mode,
            commands::settings::sync_tray,
            // Vocabulary
            commands::vocabulary::get_vocabulary,
            commands::vocabulary::add_term,
            commands::vocabulary::delete_term,
            // Clipboard
            commands::clipboard::paste_text,
            // Audio Import
            commands::audio_import::import_audio_file,
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|_app_handle, event| {
            // Prevent the app from exiting when all windows are hidden.
            // The app lives in the system tray — only "Quit" should kill it.
            if let tauri::RunEvent::ExitRequested { api, .. } = event {
                api.prevent_exit();
            }
        });
}
