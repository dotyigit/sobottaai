use super::{Segment, SttEngine, TranscriptionOptions, TranscriptionResult};
use sherpa_rs::transducer::{TransducerConfig, TransducerRecognizer};
use std::path::Path;
use std::sync::Mutex;

pub struct ParakeetEngine {
    recognizer: Mutex<TransducerRecognizer>,
}

impl ParakeetEngine {
    pub fn new(model_dir: &Path) -> anyhow::Result<Self> {
        let encoder = model_dir
            .join("encoder.int8.onnx")
            .to_str()
            .ok_or_else(|| anyhow::anyhow!("Invalid encoder path"))?
            .to_string();
        let decoder = model_dir
            .join("decoder.int8.onnx")
            .to_str()
            .ok_or_else(|| anyhow::anyhow!("Invalid decoder path"))?
            .to_string();
        let joiner = model_dir
            .join("joiner.int8.onnx")
            .to_str()
            .ok_or_else(|| anyhow::anyhow!("Invalid joiner path"))?
            .to_string();
        let tokens = model_dir
            .join("tokens.txt")
            .to_str()
            .ok_or_else(|| anyhow::anyhow!("Invalid tokens path"))?
            .to_string();

        let n_threads = std::thread::available_parallelism()
            .map(|n| n.get().clamp(1, 8) as i32)
            .unwrap_or(4);

        // Use CoreML on macOS for GPU acceleration, CPU elsewhere
        #[cfg(target_os = "macos")]
        let provider = Some("coreml".to_string());
        #[cfg(not(target_os = "macos"))]
        let provider = None;

        let config = TransducerConfig {
            encoder,
            decoder,
            joiner,
            tokens,
            num_threads: n_threads,
            sample_rate: 16_000,
            feature_dim: 80,
            model_type: "nemo_transducer".to_string(),
            provider,
            debug: false,
            ..Default::default()
        };

        log::info!(
            "Parakeet engine loading: {:?} (threads={}, provider={:?})",
            model_dir,
            n_threads,
            config.provider
        );

        let start = std::time::Instant::now();
        let recognizer = TransducerRecognizer::new(config)
            .map_err(|e| anyhow::anyhow!("Failed to create Parakeet recognizer: {}", e))?;
        log::info!(
            "Parakeet engine loaded in {}ms",
            start.elapsed().as_millis()
        );

        Ok(Self {
            recognizer: Mutex::new(recognizer),
        })
    }
}

impl SttEngine for ParakeetEngine {
    fn transcribe(
        &self,
        audio: &[f32],
        _options: &TranscriptionOptions,
    ) -> anyhow::Result<TranscriptionResult> {
        log::info!(
            "Parakeet inference starting: {} samples ({:.1}s audio)",
            audio.len(),
            audio.len() as f64 / 16000.0,
        );

        let start = std::time::Instant::now();

        let mut recognizer = self.recognizer.lock().unwrap();
        let result = recognizer.transcribe(16_000, audio);
        let inference_ms = start.elapsed().as_millis() as u64;

        let text = result.trim().to_string();

        log::info!(
            "Parakeet transcription: {}ms inference, text={:?}",
            inference_ms,
            text,
        );

        let duration_audio_ms = (audio.len() as u64 * 1000) / 16000;
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
            language: None,
            segments,
            duration_ms: inference_ms,
        })
    }

    fn engine_name(&self) -> &str {
        "parakeet"
    }
}
