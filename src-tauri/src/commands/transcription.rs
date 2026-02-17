use crate::commands::recording::{self, RecordingState};
use crate::models;
use crate::stt::whisper::WhisperEngine;
use crate::stt::{SttEngine, TranscriptionOptions, TranscriptionResult};
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Manager, State};

/// Manages loaded STT engine instances (cached to avoid re-loading models).
/// Also serializes transcription calls to prevent concurrent Whisper inference.
pub struct SttManager {
    engines: Mutex<HashMap<String, Arc<dyn SttEngine>>>,
    /// Serializes transcription to prevent multiple concurrent Whisper calls
    transcription_lock: Arc<Mutex<()>>,
}

impl SttManager {
    pub fn new() -> Self {
        Self {
            engines: Mutex::new(HashMap::new()),
            transcription_lock: Arc::new(Mutex::new(())),
        }
    }

    /// Get or load a Whisper engine for the given model.
    fn get_or_load(
        &self,
        model_id: &str,
        app_data_dir: &PathBuf,
    ) -> Result<Arc<dyn SttEngine>, String> {
        let mut engines = self.engines.lock().unwrap();

        if let Some(engine) = engines.get(model_id) {
            return Ok(engine.clone());
        }

        let catalog = models::full_catalog();
        let model_info = catalog
            .iter()
            .find(|m| m.id == model_id)
            .ok_or_else(|| format!("Unknown model: {}", model_id))?;

        if !models::is_model_downloaded(app_data_dir, model_info) {
            return Err(format!("Model '{}' is not downloaded", model_id));
        }

        let model_dir = models::model_path(app_data_dir, model_id);

        let engine: Arc<dyn SttEngine> = match model_info.engine {
            models::Engine::Whisper => {
                let model_file = &model_info.files[0];
                let model_path = model_dir.join(model_file);
                let whisper = WhisperEngine::new(&model_path)
                    .map_err(|e| format!("Failed to load Whisper model: {}", e))?;
                Arc::new(whisper)
            }
            models::Engine::Parakeet => {
                return Err(
                    "Parakeet engine not yet implemented. Please use a Whisper model.".into(),
                );
            }
        };

        engines.insert(model_id.to_string(), engine.clone());
        log::info!("STT engine cached for model: {}", model_id);
        Ok(engine)
    }

    /// Clear cached engine for a specific model (e.g., after model deletion).
    pub fn evict(&self, model_id: &str) {
        self.engines.lock().unwrap().remove(model_id);
    }
}

#[tauri::command]
pub async fn transcribe(
    app: AppHandle,
    recording_state: State<'_, RecordingState>,
    stt_manager: State<'_, SttManager>,
    session_id: String,
    model_id: String,
    language: Option<String>,
) -> Result<TranscriptionResult, String> {
    let audio = recording::get_session_audio(&recording_state, &session_id)
        .ok_or("Session not found")?;

    if audio.is_empty() {
        return Err("No audio data in session".into());
    }

    let app_data_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;

    let engine = stt_manager.get_or_load(&model_id, &app_data_dir)?;

    let options = TranscriptionOptions {
        language,
        vocabulary: vec![],
    };

    log::info!("Starting transcription: {} samples, model={}", audio.len(), model_id);

    // Clone the lock Arc to send into blocking thread
    let transcription_lock = stt_manager.transcription_lock.clone();

    // Run transcription on a blocking thread (whisper inference is CPU-intensive)
    // The lock serializes access so only one Whisper call runs at a time
    let result = tokio::task::spawn_blocking(move || {
        let _guard = transcription_lock.lock().unwrap();
        engine.transcribe(&audio, &options)
    })
    .await
    .map_err(|e| format!("Transcription task failed: {}", e))?
    .map_err(|e| format!("Transcription failed: {}", e))?;

    Ok(result)
}

#[tauri::command]
pub async fn transcribe_file(
    app: AppHandle,
    recording_state: State<'_, RecordingState>,
    stt_manager: State<'_, SttManager>,
    session_id: String,
    model_id: String,
    language: Option<String>,
) -> Result<TranscriptionResult, String> {
    transcribe(
        app,
        recording_state,
        stt_manager,
        session_id,
        model_id,
        language,
    )
    .await
}
