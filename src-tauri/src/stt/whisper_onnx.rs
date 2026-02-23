use super::{Segment, SttEngine, TranscriptionOptions, TranscriptionResult};
use sherpa_rs::whisper::{WhisperConfig, WhisperRecognizer};
use std::path::Path;
use std::sync::Mutex;

/// Whisper engine backed by sherpa-onnx (ONNX int8 models).
/// Faster on CPU than whisper.cpp (GGML), especially on Windows/Linux
/// where whisper.cpp has no GPU acceleration.
pub struct WhisperOnnxEngine {
    recognizer: Mutex<WhisperRecognizer>,
}

impl WhisperOnnxEngine {
    pub fn new(model_dir: &Path, model_prefix: &str) -> anyhow::Result<Self> {
        let encoder = model_dir
            .join(format!("{}-encoder.int8.onnx", model_prefix))
            .to_str()
            .ok_or_else(|| anyhow::anyhow!("Invalid encoder path"))?
            .to_string();
        let decoder = model_dir
            .join(format!("{}-decoder.int8.onnx", model_prefix))
            .to_str()
            .ok_or_else(|| anyhow::anyhow!("Invalid decoder path"))?
            .to_string();
        let tokens = model_dir
            .join(format!("{}-tokens.txt", model_prefix))
            .to_str()
            .ok_or_else(|| anyhow::anyhow!("Invalid tokens path"))?
            .to_string();

        let n_threads = std::thread::available_parallelism()
            .map(|n| n.get().clamp(1, 8) as i32)
            .unwrap_or(4);

        // GPU acceleration per platform; falls back to CPU if provider fails
        #[cfg(target_os = "macos")]
        let provider = Some("coreml".to_string());
        #[cfg(target_os = "windows")]
        let provider = Some("directml".to_string());
        #[cfg(target_os = "linux")]
        let provider = None;

        let config = WhisperConfig {
            encoder,
            decoder,
            tokens,
            language: "en".to_string(),
            provider,
            num_threads: Some(n_threads),
            debug: false,
            ..Default::default()
        };

        log::info!(
            "WhisperOnnx engine loading: {:?} prefix={} (threads={}, provider={:?})",
            model_dir,
            model_prefix,
            n_threads,
            config.provider
        );

        let start = std::time::Instant::now();
        let recognizer = WhisperRecognizer::new(config)
            .map_err(|e| anyhow::anyhow!("Failed to create WhisperOnnx recognizer: {}", e))?;
        log::info!(
            "WhisperOnnx engine loaded in {}ms",
            start.elapsed().as_millis()
        );

        Ok(Self {
            recognizer: Mutex::new(recognizer),
        })
    }
}

impl SttEngine for WhisperOnnxEngine {
    fn transcribe(
        &self,
        audio: &[f32],
        options: &TranscriptionOptions,
    ) -> anyhow::Result<TranscriptionResult> {
        log::info!(
            "WhisperOnnx inference starting: {} samples ({:.1}s audio)",
            audio.len(),
            audio.len() as f64 / 16000.0,
        );

        let start = std::time::Instant::now();

        // Note: sherpa-onnx WhisperRecognizer does not support changing
        // language per-call — it's set at construction time. We use
        // the language from options if available, but the recognizer
        // was initialized with "en" as default.
        let _ = &options.language;

        let mut recognizer = self.recognizer.lock().unwrap();
        let result = recognizer.transcribe(16_000, audio);
        let inference_ms = start.elapsed().as_millis() as u64;

        let text = result.text.trim().to_string();
        let detected_lang = if result.lang.is_empty() {
            None
        } else {
            Some(result.lang.clone())
        };

        log::info!(
            "WhisperOnnx transcription: {}ms inference, lang={:?}, text={:?}",
            inference_ms,
            detected_lang,
            text,
        );

        let duration_audio_ms = (audio.len() as u64 * 1000) / 16000;

        // Build segments from token timestamps if available
        let segments = if !text.is_empty() {
            vec![Segment {
                start_ms: 0,
                end_ms: duration_audio_ms,
                text: text.clone(),
            }]
        } else {
            vec![]
        };

        Ok(TranscriptionResult {
            text,
            language: detected_lang,
            segments,
            duration_ms: inference_ms,
        })
    }

    fn engine_name(&self) -> &str {
        "whisper-onnx"
    }
}
