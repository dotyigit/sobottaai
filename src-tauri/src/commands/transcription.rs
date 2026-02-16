use crate::commands::recording::{self, RecordingState};
use crate::stt::TranscriptionResult;
use tauri::State;

#[tauri::command]
pub async fn transcribe(
    state: State<'_, RecordingState>,
    session_id: String,
    model_id: String,
    language: Option<String>,
) -> Result<TranscriptionResult, String> {
    let audio = recording::get_session_audio(&state, &session_id)
        .ok_or("Session not found")?;

    // TODO: Phase 3 - dispatch to whisper/parakeet based on model_id
    let _ = model_id;
    let _ = language;

    Ok(TranscriptionResult {
        text: format!("[Transcription placeholder - {} samples]", audio.len()),
        language: None,
        segments: vec![],
        duration_ms: (audio.len() as f64 / 16.0) as u64,
    })
}

#[tauri::command]
pub async fn transcribe_file(
    state: State<'_, RecordingState>,
    session_id: String,
    model_id: String,
    language: Option<String>,
) -> Result<TranscriptionResult, String> {
    transcribe(state, session_id, model_id, language).await
}
