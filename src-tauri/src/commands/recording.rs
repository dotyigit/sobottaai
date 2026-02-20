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
    /// Signal to stop the audio level meter thread.
    level_stop: Mutex<Option<std::sync::mpsc::Sender<()>>>,
}

impl RecordingState {
    pub fn new() -> Self {
        Self {
            buffer: Mutex::new(None),
            sessions: Mutex::new(HashMap::new()),
            stop_signal: Mutex::new(None),
            level_stop: Mutex::new(None),
        }
    }

    /// Check if a recording is currently active.
    pub fn is_recording(&self) -> bool {
        self.stop_signal.lock().unwrap().is_some()
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
pub fn start_recording(app: AppHandle, state: State<'_, RecordingState>) -> Result<(), String> {
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
    let init_result = init_rx
        .recv()
        .map_err(|_| "Capture thread died before initialization".to_string())
        .and_then(|r| r.map_err(|e| format!("Audio init failed: {}", e)));

    let (sample_rate, channels) = match init_result {
        Ok(v) => v,
        Err(e) => {
            // Clean up stop_signal so is_recording() returns false
            // and the app doesn't get stuck in a bad state
            *state.stop_signal.lock().unwrap() = None;
            *state.level_stop.lock().unwrap() = None;
            return Err(e);
        }
    };

    // Clone the samples Arc for the level meter before moving into state
    let level_samples = shared_buffer.samples.clone();

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

    // Spawn audio level meter thread — emits RMS level ~16 times per second
    {
        let (level_tx, level_rx) = std::sync::mpsc::channel::<()>();
        *state.level_stop.lock().unwrap() = Some(level_tx);

        let level_app = app.clone();
        std::thread::spawn(move || {
            loop {
                if level_rx.try_recv().is_ok() {
                    break;
                }

                let level = {
                    let buf = level_samples.lock().unwrap();
                    let len = buf.len();
                    if len == 0 {
                        0.0f32
                    } else {
                        // RMS of the most recent ~4096 samples (~85ms at 48kHz)
                        let window = 4096.min(len);
                        let start = len - window;
                        let chunk = &buf[start..len];
                        (chunk.iter().map(|s| s * s).sum::<f32>() / chunk.len() as f32).sqrt()
                    }
                };

                let _ = level_app.emit("audio-level", level);
                std::thread::sleep(std::time::Duration::from_millis(60));
            }
        });
    }

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
    // Stop the audio level meter thread
    if let Some(tx) = state.level_stop.lock().unwrap().take() {
        let _ = tx.send(());
    }

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

    // Log audio stats for debugging
    let max_amplitude = processed.iter().map(|s| s.abs()).fold(0.0f32, f32::max);
    let rms = (processed.iter().map(|s| s * s).sum::<f32>() / processed.len() as f32).sqrt();
    log::info!(
        "Recording stopped: {} samples, {}ms, session={}, max_amp={:.4}, rms={:.4}",
        sample_count,
        duration_ms,
        session_id,
        max_amplitude,
        rms,
    );

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

    Ok(result)
}

/// Create the recording bar window (hidden) at startup so showing it later
/// doesn't activate the app or steal focus.
pub fn create_recording_bar(app: &AppHandle) -> Result<(), String> {
    if app.get_webview_window("recording-bar").is_some() {
        return Ok(());
    }

    let bar_width = 250.0_f64;
    let bar_height = 44.0_f64;
    let margin_bottom = 32.0_f64;

    let mut builder = WebviewWindowBuilder::new(
        app,
        "recording-bar",
        WebviewUrl::App("/recording-bar".into()),
    )
    .title("Recording")
    .inner_size(bar_width, bar_height)
    .always_on_top(true)
    .decorations(false)
    .transparent(true)
    .shadow(false)
    .resizable(false)
    .skip_taskbar(true)
    .focused(false)
    .visible(false);

    // Position at bottom-center of primary monitor
    if let Some(monitor) = app.primary_monitor().ok().flatten() {
        let screen_size = monitor.size();
        let scale = monitor.scale_factor();
        let logical_w = screen_size.width as f64 / scale;
        let logical_h = screen_size.height as f64 / scale;
        let x = (logical_w - bar_width) / 2.0;
        let y = logical_h - bar_height - margin_bottom;
        builder = builder.position(x, y);
    } else {
        builder = builder.center();
    }

    let window = builder.build().map_err(|e| e.to_string())?;

    // Start hidden
    let _ = window.hide();
    log::info!("Recording bar window pre-created (hidden)");
    Ok(())
}

#[tauri::command]
pub fn show_recording_bar(app: AppHandle) -> Result<(), String> {
    log::info!("show_recording_bar: called");
    if let Some(window) = app.get_webview_window("recording-bar") {
        let _ = window.show();
    }
    Ok(())
}

#[tauri::command]
pub fn hide_recording_bar(app: AppHandle) -> Result<(), String> {
    log::info!("hide_recording_bar: called");
    if let Some(window) = app.get_webview_window("recording-bar") {
        let _ = window.hide();
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
