use crate::audio::capture::AudioBuffer;
use crate::audio::processing;
use std::collections::HashMap;
use std::sync::Mutex;
use tauri::{AppHandle, Manager, State, WebviewUrl, WebviewWindowBuilder};
use uuid::Uuid;

/// Active recording session data (Send+Sync safe).
pub struct RecordingState {
    /// The shared audio buffer being written to by the capture thread.
    buffer: Mutex<Option<AudioBuffer>>,
    /// Completed audio sessions keyed by session ID.
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

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StopResult {
    pub session_id: String,
    pub duration_ms: u64,
}

#[tauri::command]
pub fn start_recording(state: State<'_, RecordingState>) -> Result<(), String> {
    // Create the buffer first
    let buffer = AudioBuffer::new(0, 0); // Will be set by the capture thread
    let buf_clone = buffer.clone();

    let (tx, rx) = std::sync::mpsc::channel::<()>();
    *state.stop_signal.lock().unwrap() = Some(tx);

    // Spawn a thread that creates and owns the cpal Stream
    // (Stream is !Send so it must be created on the thread that owns it)
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
                let _ = init_tx.send(Err(e.to_string()));
                return;
            }
        };

        let sample_format = supported_config.sample_format();
        let config: cpal::StreamConfig = supported_config.into();
        let sample_rate = config.sample_rate.0;
        let channels = config.channels;

        let samples = buf_clone.samples.clone();

        let err_fn = |err: cpal::StreamError| {
            log::error!("Audio capture error: {}", err);
        };

        let stream = match sample_format {
            cpal::SampleFormat::F32 => {
                device.build_input_stream(
                    &config,
                    move |data: &[f32], _: &cpal::InputCallbackInfo| {
                        samples.lock().unwrap().extend_from_slice(data);
                    },
                    err_fn,
                    None,
                )
            }
            cpal::SampleFormat::I16 => {
                device.build_input_stream(
                    &config,
                    move |data: &[i16], _: &cpal::InputCallbackInfo| {
                        let mut b = samples.lock().unwrap();
                        b.extend(data.iter().map(|&s| s as f32 / i16::MAX as f32));
                    },
                    err_fn,
                    None,
                )
            }
            _ => {
                let _ = init_tx.send(Err(format!("Unsupported sample format: {:?}", sample_format)));
                return;
            }
        };

        let stream = match stream {
            Ok(s) => s,
            Err(e) => {
                let _ = init_tx.send(Err(e.to_string()));
                return;
            }
        };

        if let Err(e) = stream.play() {
            let _ = init_tx.send(Err(e.to_string()));
            return;
        }

        // Signal success with sample rate and channels
        let _ = init_tx.send(Ok((sample_rate, channels)));

        // Block until stop signal - stream stays alive
        let _ = rx.recv();
        // Stream drops here, stopping capture
    });

    // Wait for the capture thread to initialize
    let (sample_rate, channels) = init_rx
        .recv()
        .map_err(|_| "Capture thread failed to start".to_string())?
        .map_err(|e| e)?;

    // Update buffer with correct sample rate and channels
    *state.buffer.lock().unwrap() = Some(AudioBuffer::new(sample_rate, channels));
    // Replace the buffer's samples Arc with the one the thread is writing to
    if let Some(ref buf) = *state.buffer.lock().unwrap() {
        // Both `buffer` and `buf` share the same Arc from `buf_clone`
        // Actually we need to share the same Arc. Let's restructure.
    }

    // The thread writes to `buf_clone.samples`, so we store `buffer` which shares the same Arc
    {
        let mut buf_lock = state.buffer.lock().unwrap();
        let mut new_buf = buffer.clone();
        new_buf.sample_rate = sample_rate;
        new_buf.channels = channels;
        *buf_lock = Some(new_buf);
    }

    Ok(())
}

#[tauri::command]
pub fn stop_recording(state: State<'_, RecordingState>) -> Result<StopResult, String> {
    // Signal the capture thread to stop
    if let Some(tx) = state.stop_signal.lock().unwrap().take() {
        let _ = tx.send(());
    }

    // Small delay for the stream to fully stop
    std::thread::sleep(std::time::Duration::from_millis(50));

    let buffer = state
        .buffer
        .lock()
        .unwrap()
        .take()
        .ok_or("No active recording")?;

    let raw_samples = buffer.take();
    let sample_rate = buffer.sample_rate;
    let channels = buffer.channels;

    // Preprocess: mono + 16kHz
    let processed = processing::preprocess(&raw_samples, channels, sample_rate);
    let duration_ms = (processed.len() as f64 / 16000.0 * 1000.0) as u64;

    let session_id = Uuid::new_v4().to_string();
    state
        .sessions
        .lock()
        .unwrap()
        .insert(session_id.clone(), processed);

    Ok(StopResult {
        session_id,
        duration_ms,
    })
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
