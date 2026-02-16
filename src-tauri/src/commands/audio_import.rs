use crate::audio::{processing, wav};
use crate::commands::recording::{self, RecordingState};
use std::path::PathBuf;
use tauri::State;
use uuid::Uuid;

#[tauri::command]
pub async fn import_audio_file(
    state: State<'_, RecordingState>,
    path: String,
) -> Result<String, String> {
    let path = PathBuf::from(path);

    let (samples, sample_rate, channels) =
        wav::read_wav_file(&path).map_err(|e| e.to_string())?;

    let processed = processing::preprocess(&samples, channels, sample_rate);

    let session_id = Uuid::new_v4().to_string();
    recording::insert_session_audio(&state, &session_id, processed);

    Ok(session_id)
}
