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
        .plugin(
            tauri_plugin_log::Builder::default()
                .level(log::LevelFilter::Info)
                .build(),
        )
        .manage(commands::recording::RecordingState::new())
        .manage(commands::transcription::SttManager::new())
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

            // Register global hotkey for push-to-talk
            if let Err(e) = system::hotkey::register_hotkey(&app_handle) {
                log::error!("Failed to register global hotkey: {:?}", e);
            }

            log::info!("SobottaAI started successfully");
            Ok(())
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
            // Vocabulary
            commands::vocabulary::get_vocabulary,
            commands::vocabulary::add_term,
            commands::vocabulary::delete_term,
            // Clipboard
            commands::clipboard::paste_text,
            // Audio Import
            commands::audio_import::import_audio_file,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
