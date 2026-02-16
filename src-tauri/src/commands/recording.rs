use crate::audio::capture::AudioBuffer;
use crate::audio::{processing, wav};
use std::collections::HashMap;
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, Manager, State, WebviewUrl, WebviewWindowBuilder};
use uuid::Uuid;

/// Active recording session data (Send+Sync safe).
pub struct RecordingState {
    /// The shared audio buffer being written to by the capture thread.
    buffer: Mutex<Option<AudioBuffer>>,
    /// Completed audio sessions keyed by session ID (16kHz mono f32).
    sessions: Mutex<HashMap<String, Vec<f32>>>,
    /// Signal to stop the capture thread.
    stop_signal: Mutex<Option<std::sync::mpsc::Sender<()>>>,
}

impl RecordingState {
    pub fn new() -> Self {
        Self {
            buffer: Mutex::new(None),
            sessions: Mutex::new(HashMap::new()),
            stop_signal: Mutex::new(None),
        }
    }
}

#[derive(Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StopResult {
    pub session_id: String,
    pub duration_ms: u64,
    pub sample_count: usize,
}

#[tauri::command]
pub fn start_recording(
    app: AppHandle,
    state: State<'_, RecordingState>,
) -> Result<(), String> {
    // Prevent double-start
    if state.stop_signal.lock().unwrap().is_some() {
        return Err("Recording already in progress".into());
    }

    // Create shared buffer — the capture thread will write samples to this Arc
    let shared_buffer = AudioBuffer::new(0, 0);
    let thread_buffer = shared_buffer.clone();

    let (stop_tx, stop_rx) = std::sync::mpsc::channel::<()>();
    *state.stop_signal.lock().unwrap() = Some(stop_tx);

    // Channel for the capture thread to report init success/failure
    let (init_tx, init_rx) = std::sync::mpsc::channel::<Result<(u32, u16), String>>();

    std::thread::spawn(move || {
        use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};

        let host = cpal::default_host();
        let device = match host.default_input_device() {
            Some(d) => d,
            None => {
                let _ = init_tx.send(Err("No input device available".into()));
                return;
            }
        };

        let supported_config = match device.default_input_config() {
            Ok(c) => c,
            Err(e) => {
                let _ = init_tx.send(Err(format!("Failed to get input config: {}", e)));
                return;
            }
        };

        let sample_format = supported_config.sample_format();
        let config: cpal::StreamConfig = supported_config.into();
        let sample_rate = config.sample_rate.0;
        let channels = config.channels;

        let samples_arc = thread_buffer.samples.clone();

        let err_fn = |err: cpal::StreamError| {
            log::error!("Audio capture error: {}", err);
        };

        let stream = match sample_format {
            cpal::SampleFormat::F32 => device.build_input_stream(
                &config,
                move |data: &[f32], _: &cpal::InputCallbackInfo| {
                    if let Ok(mut buf) = samples_arc.lock() {
                        buf.extend_from_slice(data);
                    }
                },
                err_fn,
                None,
            ),
            cpal::SampleFormat::I16 => {
                let samples_arc = thread_buffer.samples.clone();
                device.build_input_stream(
                    &config,
                    move |data: &[i16], _: &cpal::InputCallbackInfo| {
                        if let Ok(mut buf) = samples_arc.lock() {
                            buf.extend(data.iter().map(|&s| s as f32 / i16::MAX as f32));
                        }
                    },
                    err_fn,
                    None,
                )
            }
            _ => {
                let _ = init_tx.send(Err(format!(
                    "Unsupported sample format: {:?}",
                    sample_format
                )));
                return;
            }
        };

        let stream = match stream {
            Ok(s) => s,
            Err(e) => {
                let _ = init_tx.send(Err(format!("Failed to build stream: {}", e)));
                return;
            }
        };

        if let Err(e) = stream.play() {
            let _ = init_tx.send(Err(format!("Failed to start stream: {}", e)));
            return;
        }

        // Signal success
        let _ = init_tx.send(Ok((sample_rate, channels)));

        // Block until stop signal — stream stays alive on this thread
        let _ = stop_rx.recv();
        // Stream drops here, stopping capture
    });

    // Wait for capture thread initialization
    let (sample_rate, channels) = init_rx
        .recv()
        .map_err(|_| "Capture thread died before initialization")?
        .map_err(|e| format!("Audio init failed: {}", e))?;

    // Store the buffer (with correct metadata) in state.
    // shared_buffer.samples is the same Arc the capture thread writes to.
    {
        let mut buf_lock = state.buffer.lock().unwrap();
        *buf_lock = Some(AudioBuffer {
            samples: shared_buffer.samples,
            sample_rate,
            channels,
        });
    }

    // Emit event so frontend knows recording started
    let _ = app.emit("recording-started", ());

    log::info!(
        "Recording started: {}Hz, {} channels",
        sample_rate,
        channels
    );
    Ok(())
}

#[tauri::command]
pub fn stop_recording(
    app: AppHandle,
    state: State<'_, RecordingState>,
) -> Result<StopResult, String> {
    // Signal the capture thread to stop
    let had_signal = state.stop_signal.lock().unwrap().take().map(|tx| {
        let _ = tx.send(());
    });

    if had_signal.is_none() {
        return Err("No active recording".into());
    }

    // Small delay for the stream callback to flush
    std::thread::sleep(std::time::Duration::from_millis(50));

    let buffer = state
        .buffer
        .lock()
        .unwrap()
        .take()
        .ok_or("No audio buffer available")?;

    let raw_samples = buffer.take();
    let sample_rate = buffer.sample_rate;
    let channels = buffer.channels;

    if raw_samples.is_empty() {
        return Err("No audio data captured".into());
    }

    // Preprocess: multi-channel → mono → 16kHz
    let processed = processing::preprocess(&raw_samples, channels, sample_rate);
    let sample_count = processed.len();
    let duration_ms = (sample_count as f64 / 16000.0 * 1000.0) as u64;

    let session_id = Uuid::new_v4().to_string();

    // Save WAV file for history playback
    if let Ok(app_data_dir) = app.path().app_data_dir() {
        let audio_dir = app_data_dir.join("audio");
        if std::fs::create_dir_all(&audio_dir).is_ok() {
            let wav_path = audio_dir.join(format!("{}.wav", session_id));
            if let Err(e) = wav::save_wav(&processed, 16000, &wav_path) {
                log::warn!("Failed to save WAV: {}", e);
            }
        }
    }

    // Store processed audio in session map for transcription
    state
        .sessions
        .lock()
        .unwrap()
        .insert(session_id.clone(), processed);

    let result = StopResult {
        session_id: session_id.clone(),
        duration_ms,
        sample_count,
    };

    // Emit event so frontend knows recording stopped
    let _ = app.emit("recording-stopped", result.clone());

    log::info!(
        "Recording stopped: {} samples, {}ms, session={}",
        sample_count,
        duration_ms,
        session_id
    );
    Ok(result)
}

#[tauri::command]
pub fn show_recording_bar(app: AppHandle) -> Result<(), String> {
    if app.get_webview_window("recording-bar").is_some() {
        return Ok(());
    }

    WebviewWindowBuilder::new(
        &app,
        "recording-bar",
        WebviewUrl::App("/recording-bar".into()),
    )
    .title("Recording")
    .inner_size(360.0, 64.0)
    .always_on_top(true)
    .decorations(false)
    .transparent(true)
    .resizable(false)
    .skip_taskbar(true)
    .center()
    .build()
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn hide_recording_bar(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("recording-bar") {
        let _ = window.close();
    }
    Ok(())
}

/// Get audio samples for a session (used by transcription commands).
pub fn get_session_audio(state: &RecordingState, session_id: &str) -> Option<Vec<f32>> {
    state.sessions.lock().unwrap().get(session_id).cloned()
}

/// Insert audio samples for a session (used by audio import).
pub fn insert_session_audio(state: &RecordingState, session_id: &str, samples: Vec<f32>) {
    state
        .sessions
        .lock()
        .unwrap()
        .insert(session_id.to_string(), samples);
}

/// Remove and return audio samples for a session (frees memory after transcription).
pub fn take_session_audio(state: &RecordingState, session_id: &str) -> Option<Vec<f32>> {
    state.sessions.lock().unwrap().remove(session_id)
}
