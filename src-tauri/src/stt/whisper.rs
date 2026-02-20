use super::{Segment, SttEngine, TranscriptionOptions, TranscriptionResult};
use std::path::Path;
use std::sync::Arc;
use whisper_rs::{FullParams, SamplingStrategy, WhisperContext, WhisperContextParameters};

pub struct WhisperEngine {
    ctx: Arc<WhisperContext>,
}

impl WhisperEngine {
    pub fn new(model_path: &Path) -> anyhow::Result<Self> {
        let path_str = model_path
            .to_str()
            .ok_or_else(|| anyhow::anyhow!("Invalid model path"))?;

        let params = WhisperContextParameters::default();

        let ctx = WhisperContext::new_with_params(path_str, params)
            .map_err(|e| anyhow::anyhow!("Failed to load Whisper model: {:?}", e))?;

        log::info!("Whisper model loaded: {:?}", model_path);

        Ok(Self { ctx: Arc::new(ctx) })
    }
}

impl SttEngine for WhisperEngine {
    fn transcribe(
        &self,
        audio: &[f32],
        options: &TranscriptionOptions,
    ) -> anyhow::Result<TranscriptionResult> {
        let mut state = self
            .ctx
            .create_state()
            .map_err(|e| anyhow::anyhow!("Failed to create Whisper state: {:?}", e))?;

        let mut params = FullParams::new(SamplingStrategy::BeamSearch {
            beam_size: 5,
            patience: -1.0,
        });

        // Language setting
        // NOTE: set_detect_language(true) causes 0 segments with whisper-rs 0.15 + Metal.
        // Instead, we always set an explicit language. "auto" defaults to "en".
        match options.language.as_deref() {
            Some(lang) if lang != "auto" => params.set_language(Some(lang)),
            _ => params.set_language(Some("en")),
        }

        // Set initial prompt with vocabulary terms if provided
        let prompt = if !options.vocabulary.is_empty() {
            options.vocabulary.join(", ")
        } else {
            String::new()
        };
        if !prompt.is_empty() {
            params.set_initial_prompt(&prompt);
        }

        params.set_print_special(false);
        params.set_print_progress(false);
        params.set_print_realtime(false);
        params.set_print_timestamps(false);
        params.set_translate(false);

        // Anti-hallucination: suppress blank outputs and apply stricter
        // no-speech / entropy thresholds to filter phantom segments.
        params.set_suppress_blank(true);
        params.set_suppress_nst(true);
        params.set_no_speech_thold(0.6);
        params.set_entropy_thold(2.4);

        // Use available CPU threads (cap at 8)
        let n_threads = std::thread::available_parallelism()
            .map(|n| n.get().clamp(1, 8) as i32)
            .unwrap_or(4);
        params.set_n_threads(n_threads);

        log::info!(
            "Whisper inference starting: {} samples ({:.1}s audio)",
            audio.len(),
            audio.len() as f64 / 16000.0,
        );

        // Run inference
        let start = std::time::Instant::now();
        state
            .full(params, audio)
            .map_err(|e| anyhow::anyhow!("Whisper inference failed: {:?}", e))?;
        let inference_ms = start.elapsed().as_millis() as u64;

        // Extract segments using the iterator API (as per official examples)
        let mut segments = Vec::new();
        let mut full_text = String::new();

        let num_segments = state.full_n_segments();
        log::info!("Whisper full_n_segments returned: {}", num_segments);

        for segment in state.as_iter() {
            let text = segment.to_string();
            let t0 = segment.start_timestamp();
            let t1 = segment.end_timestamp();

            full_text.push_str(&text);

            segments.push(Segment {
                start_ms: (t0 * 10) as u64,
                end_ms: (t1 * 10) as u64,
                text,
            });
        }

        // Detect language from state
        let lang_id = state.full_lang_id_from_state();
        let detected_language = whisper_rs::get_lang_str(lang_id).map(|s| s.to_string());

        let language = options
            .language
            .clone()
            .filter(|l| l != "auto")
            .or(detected_language);

        log::info!(
            "Whisper transcription: {} segments, {}ms inference, lang={:?}, text={:?}",
            segments.len(),
            inference_ms,
            language,
            full_text.trim(),
        );

        Ok(TranscriptionResult {
            text: full_text.trim().to_string(),
            language,
            segments,
            duration_ms: inference_ms,
        })
    }

    fn engine_name(&self) -> &str {
        "whisper"
    }
}
