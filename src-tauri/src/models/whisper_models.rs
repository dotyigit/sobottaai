use super::{Engine, LanguageSupport, ModelInfo};

/// Unified Whisper model catalog.
///
/// On **macOS** we use GGML models with whisper.cpp (Metal GPU acceleration).
/// On **Windows/Linux** we use ONNX int8 models with sherpa-onnx (optimized CPU kernels).
///
/// The same model IDs are used on all platforms so the frontend sees a single
/// set of models regardless of OS.  The backend picks the right engine and files
/// via `#[cfg(target_os)]` conditional compilation.

// ── macOS: GGML models (whisper.cpp + Metal) ────────────────────────────────

#[cfg(target_os = "macos")]
const HF_BASE: &str = "https://huggingface.co/ggerganov/whisper.cpp/resolve/main";

#[cfg(target_os = "macos")]
pub fn catalog() -> Vec<ModelInfo> {
    vec![
        ModelInfo {
            id: "whisper-tiny".into(),
            name: "Whisper Tiny".into(),
            engine: Engine::Whisper,
            size_bytes: 77_700_000,
            download_urls: vec![format!("{}/ggml-tiny.bin", HF_BASE)],
            files: vec!["ggml-tiny.bin".into()],
            languages: LanguageSupport::Multilingual(99),
            description: "Fastest, least accurate. Good for testing.".into(),
        },
        ModelInfo {
            id: "whisper-base".into(),
            name: "Whisper Base".into(),
            engine: Engine::Whisper,
            size_bytes: 148_000_000,
            download_urls: vec![format!("{}/ggml-base.bin", HF_BASE)],
            files: vec!["ggml-base.bin".into()],
            languages: LanguageSupport::Multilingual(99),
            description: "Fast with reasonable accuracy.".into(),
        },
        ModelInfo {
            id: "whisper-small".into(),
            name: "Whisper Small".into(),
            engine: Engine::Whisper,
            size_bytes: 488_000_000,
            download_urls: vec![format!("{}/ggml-small.bin", HF_BASE)],
            files: vec!["ggml-small.bin".into()],
            languages: LanguageSupport::Multilingual(99),
            description: "Good balance of speed and accuracy.".into(),
        },
        ModelInfo {
            id: "whisper-medium".into(),
            name: "Whisper Medium".into(),
            engine: Engine::Whisper,
            size_bytes: 1_530_000_000,
            download_urls: vec![format!("{}/ggml-medium.bin", HF_BASE)],
            files: vec!["ggml-medium.bin".into()],
            languages: LanguageSupport::Multilingual(99),
            description: "High accuracy, moderate speed.".into(),
        },
        ModelInfo {
            id: "whisper-large-v3-turbo".into(),
            name: "Whisper Large V3 Turbo".into(),
            engine: Engine::Whisper,
            size_bytes: 1_620_000_000,
            download_urls: vec![format!("{}/ggml-large-v3-turbo.bin", HF_BASE)],
            files: vec!["ggml-large-v3-turbo.bin".into()],
            languages: LanguageSupport::Multilingual(99),
            description: "Best quality with turbo speed improvements.".into(),
        },
    ]
}

// ── Windows & Linux: ONNX int8 models (sherpa-onnx, fast CPU) ───────────────

#[cfg(not(target_os = "macos"))]
fn hf_onnx(model: &str) -> String {
    format!(
        "https://huggingface.co/csukuangfj/sherpa-onnx-whisper-{}/resolve/main",
        model
    )
}

#[cfg(not(target_os = "macos"))]
pub fn catalog() -> Vec<ModelInfo> {
    vec![
        ModelInfo {
            id: "whisper-tiny".into(),
            name: "Whisper Tiny".into(),
            engine: Engine::WhisperOnnx,
            size_bytes: 103_610_000,
            download_urls: vec![
                format!("{}/tiny-encoder.int8.onnx", hf_onnx("tiny")),
                format!("{}/tiny-decoder.int8.onnx", hf_onnx("tiny")),
                format!("{}/tiny-tokens.txt", hf_onnx("tiny")),
            ],
            files: vec![
                "tiny-encoder.int8.onnx".into(),
                "tiny-decoder.int8.onnx".into(),
                "tiny-tokens.txt".into(),
            ],
            languages: LanguageSupport::Multilingual(99),
            description: "Fastest, least accurate. Good for testing.".into(),
        },
        ModelInfo {
            id: "whisper-base".into(),
            name: "Whisper Base".into(),
            engine: Engine::WhisperOnnx,
            size_bytes: 160_609_000,
            download_urls: vec![
                format!("{}/base-encoder.int8.onnx", hf_onnx("base")),
                format!("{}/base-decoder.int8.onnx", hf_onnx("base")),
                format!("{}/base-tokens.txt", hf_onnx("base")),
            ],
            files: vec![
                "base-encoder.int8.onnx".into(),
                "base-decoder.int8.onnx".into(),
                "base-tokens.txt".into(),
            ],
            languages: LanguageSupport::Multilingual(99),
            description: "Fast with reasonable accuracy.".into(),
        },
        ModelInfo {
            id: "whisper-small".into(),
            name: "Whisper Small".into(),
            engine: Engine::WhisperOnnx,
            size_bytes: 375_486_000,
            download_urls: vec![
                format!("{}/small-encoder.int8.onnx", hf_onnx("small")),
                format!("{}/small-decoder.int8.onnx", hf_onnx("small")),
                format!("{}/small-tokens.txt", hf_onnx("small")),
            ],
            files: vec![
                "small-encoder.int8.onnx".into(),
                "small-decoder.int8.onnx".into(),
                "small-tokens.txt".into(),
            ],
            languages: LanguageSupport::Multilingual(99),
            description: "Good balance of speed and accuracy.".into(),
        },
        ModelInfo {
            id: "whisper-medium".into(),
            name: "Whisper Medium".into(),
            engine: Engine::WhisperOnnx,
            size_bytes: 946_072_000,
            download_urls: vec![
                format!("{}/medium-encoder.int8.onnx", hf_onnx("medium")),
                format!("{}/medium-decoder.int8.onnx", hf_onnx("medium")),
                format!("{}/medium-tokens.txt", hf_onnx("medium")),
            ],
            files: vec![
                "medium-encoder.int8.onnx".into(),
                "medium-decoder.int8.onnx".into(),
                "medium-tokens.txt".into(),
            ],
            languages: LanguageSupport::Multilingual(99),
            description: "High accuracy, moderate speed.".into(),
        },
        ModelInfo {
            id: "whisper-large-v3-turbo".into(),
            name: "Whisper Large V3 Turbo".into(),
            engine: Engine::WhisperOnnx,
            size_bytes: 1_036_614_000,
            download_urls: vec![
                format!("{}/turbo-encoder.int8.onnx", hf_onnx("turbo")),
                format!("{}/turbo-decoder.int8.onnx", hf_onnx("turbo")),
                format!("{}/turbo-tokens.txt", hf_onnx("turbo")),
            ],
            files: vec![
                "turbo-encoder.int8.onnx".into(),
                "turbo-decoder.int8.onnx".into(),
                "turbo-tokens.txt".into(),
            ],
            languages: LanguageSupport::Multilingual(99),
            description: "Best quality with turbo speed improvements.".into(),
        },
    ]
}
