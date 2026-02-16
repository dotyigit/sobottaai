use super::{Engine, LanguageSupport, ModelInfo};

const HF_BASE: &str = "https://huggingface.co/ggerganov/whisper.cpp/resolve/main";

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
