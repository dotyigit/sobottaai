use crate::commands::recording::{self, RecordingState};
use crate::models;
use crate::stt::parakeet::ParakeetEngine;
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

    /// Get or load a local STT engine for the given model.
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
                let parakeet = ParakeetEngine::new(&model_dir)
                    .map_err(|e| format!("Failed to load Parakeet model: {}", e))?;
                Arc::new(parakeet)
            }
            models::Engine::CloudOpenAI | models::Engine::CloudGroq => {
                return Err("Cloud models should not be loaded as local engines".into());
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

/// Determine the engine type for a model ID.
fn engine_for_model(model_id: &str) -> Option<models::Engine> {
    models::full_catalog()
        .into_iter()
        .find(|m| m.id == model_id)
        .map(|m| m.engine)
}

#[tauri::command]
pub async fn transcribe(
    app: AppHandle,
    recording_state: State<'_, RecordingState>,
    stt_manager: State<'_, SttManager>,
    session_id: String,
    model_id: String,
    language: Option<String>,
    // Cloud STT needs API key from frontend
    api_key: Option<String>,
    cloud_model: Option<String>,
) -> Result<TranscriptionResult, String> {
    let audio = recording::get_session_audio(&recording_state, &session_id)
        .ok_or("Session not found")?;

    if audio.is_empty() {
        return Err("No audio data in session".into());
    }

    // Skip transcription if the audio is essentially silence / background noise.
    // This prevents Whisper from hallucinating phrases like "Thank you" on quiet input.
    let rms = crate::audio::processing::rms_energy(&audio);
    log::info!("Audio RMS energy: {:.6} ({} samples)", rms, audio.len());
    if rms < 0.01 {
        log::info!("Audio is silence (RMS {:.6} < 0.01), skipping transcription", rms);
        return Ok(TranscriptionResult {
            text: String::new(),
            language: None,
            segments: vec![],
            duration_ms: 0,
        });
    }

    // Load vocabulary terms from database to improve transcription accuracy
    let vocabulary = crate::db::vocabulary::get_terms().unwrap_or_default();

    let options = TranscriptionOptions {
        language,
        vocabulary,
    };

    log::info!(
        "Starting transcription: {} samples, model={}",
        audio.len(),
        model_id
    );

    let engine_type = engine_for_model(&model_id)
        .ok_or_else(|| format!("Unknown model: {}", model_id))?;

    match engine_type {
        models::Engine::CloudOpenAI => {
            let key = api_key.ok_or("API key required for cloud OpenAI transcription")?;
            crate::stt::cloud_openai::transcribe(&audio, &options, &key)
                .await
                .map_err(|e| format!("Cloud OpenAI transcription failed: {}", e))
        }
        models::Engine::CloudGroq => {
            let key = api_key.ok_or("API key required for cloud Groq transcription")?;
            let model = cloud_model.as_deref().unwrap_or("whisper-large-v3-turbo");
            crate::stt::cloud_groq::transcribe(&audio, &options, &key, model)
                .await
                .map_err(|e| format!("Cloud Groq transcription failed: {}", e))
        }
        _ => {
            // Local model (Whisper or Parakeet)
            let app_data_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
            let engine = stt_manager.get_or_load(&model_id, &app_data_dir)?;
            let transcription_lock = stt_manager.transcription_lock.clone();

            tokio::task::spawn_blocking(move || {
                let _guard = transcription_lock.lock().unwrap();
                engine.transcribe(&audio, &options)
            })
            .await
            .map_err(|e| format!("Transcription task failed: {}", e))?
            .map_err(|e| format!("Transcription failed: {}", e))
        }
    }
}

#[tauri::command]
pub async fn transcribe_file(
    app: AppHandle,
    recording_state: State<'_, RecordingState>,
    stt_manager: State<'_, SttManager>,
    session_id: String,
    model_id: String,
    language: Option<String>,
    api_key: Option<String>,
    cloud_model: Option<String>,
) -> Result<TranscriptionResult, String> {
    transcribe(
        app,
        recording_state,
        stt_manager,
        session_id,
        model_id,
        language,
        api_key,
        cloud_model,
    )
    .await
}
