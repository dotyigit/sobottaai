use super::{Engine, LanguageSupport, ModelInfo};

/// sherpa-onnx Whisper models using ONNX int8 quantization.
/// These are significantly faster on CPU (especially Windows/Linux) compared
/// to the GGML models used by whisper.cpp, because:
/// - int8 quantization is 20-26% faster on CPU
/// - sherpa-onnx uses ONNX Runtime which has optimized CPU kernels
///
/// Model files hosted at HuggingFace by csukuangfj (sherpa-onnx maintainer).
/// Each model needs: {prefix}-encoder.int8.onnx, {prefix}-decoder.int8.onnx, {prefix}-tokens.txt

fn hf_base(model: &str) -> String {
    format!(
        "https://huggingface.co/csukuangfj/sherpa-onnx-whisper-{}/resolve/main",
        model
    )
}

pub fn catalog() -> Vec<ModelInfo> {
    vec![
        ModelInfo {
            id: "whisper-onnx-tiny".into(),
            name: "Whisper Tiny (ONNX)".into(),
            engine: Engine::WhisperOnnx,
            size_bytes: 103_610_000,
            download_urls: vec![
                format!("{}/tiny-encoder.int8.onnx", hf_base("tiny")),
                format!("{}/tiny-decoder.int8.onnx", hf_base("tiny")),
                format!("{}/tiny-tokens.txt", hf_base("tiny")),
            ],
            files: vec![
                "tiny-encoder.int8.onnx".into(),
                "tiny-decoder.int8.onnx".into(),
                "tiny-tokens.txt".into(),
            ],
            languages: LanguageSupport::Multilingual(99),
            description: "Fastest, least accurate. Good for testing. Optimized for CPU.".into(),
        },
        ModelInfo {
            id: "whisper-onnx-small".into(),
            name: "Whisper Small (ONNX)".into(),
            engine: Engine::WhisperOnnx,
            size_bytes: 375_486_000,
            download_urls: vec![
                format!("{}/small-encoder.int8.onnx", hf_base("small")),
                format!("{}/small-decoder.int8.onnx", hf_base("small")),
                format!("{}/small-tokens.txt", hf_base("small")),
            ],
            files: vec![
                "small-encoder.int8.onnx".into(),
                "small-decoder.int8.onnx".into(),
                "small-tokens.txt".into(),
            ],
            languages: LanguageSupport::Multilingual(99),
            description: "Good balance of speed and accuracy. Recommended for most users.".into(),
        },
        ModelInfo {
            id: "whisper-onnx-turbo".into(),
            name: "Whisper Turbo (ONNX)".into(),
            engine: Engine::WhisperOnnx,
            size_bytes: 1_036_614_000,
            download_urls: vec![
                format!("{}/turbo-encoder.int8.onnx", hf_base("turbo")),
                format!("{}/turbo-decoder.int8.onnx", hf_base("turbo")),
                format!("{}/turbo-tokens.txt", hf_base("turbo")),
            ],
            files: vec![
                "turbo-encoder.int8.onnx".into(),
                "turbo-decoder.int8.onnx".into(),
                "turbo-tokens.txt".into(),
            ],
            languages: LanguageSupport::Multilingual(99),
            description:
                "Best quality (large-v3 turbo). Fewer decoder layers for faster inference.".into(),
        },
    ]
}
