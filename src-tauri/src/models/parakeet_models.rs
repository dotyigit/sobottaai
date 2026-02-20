use super::{Engine, LanguageSupport, ModelInfo};

const HF_TDT_V2: &str =
    "https://huggingface.co/csukuangfj/sherpa-onnx-nemo-parakeet-tdt-0.6b-v2-int8/resolve/main";
const HF_TDT_V3: &str =
    "https://huggingface.co/csukuangfj/sherpa-onnx-nemo-parakeet-tdt-0.6b-v3-int8/resolve/main";

pub fn catalog() -> Vec<ModelInfo> {
    vec![
        ModelInfo {
            id: "parakeet-tdt-0.6b-v2".into(),
            name: "Parakeet TDT 0.6B v2".into(),
            engine: Engine::Parakeet,
            size_bytes: 680_000_000,
            download_urls: vec![
                format!("{}/encoder.int8.onnx", HF_TDT_V2),
                format!("{}/decoder.int8.onnx", HF_TDT_V2),
                format!("{}/joiner.int8.onnx", HF_TDT_V2),
                format!("{}/tokens.txt", HF_TDT_V2),
            ],
            files: vec![
                "encoder.int8.onnx".into(),
                "decoder.int8.onnx".into(),
                "joiner.int8.onnx".into(),
                "tokens.txt".into(),
            ],
            languages: LanguageSupport::English,
            description: "NVIDIA Parakeet TDT v2 (INT8) - English only, very fast and accurate."
                .into(),
        },
        ModelInfo {
            id: "parakeet-tdt-0.6b-v3".into(),
            name: "Parakeet TDT 0.6B v3".into(),
            engine: Engine::Parakeet,
            size_bytes: 680_000_000,
            download_urls: vec![
                format!("{}/encoder.int8.onnx", HF_TDT_V3),
                format!("{}/decoder.int8.onnx", HF_TDT_V3),
                format!("{}/joiner.int8.onnx", HF_TDT_V3),
                format!("{}/tokens.txt", HF_TDT_V3),
            ],
            files: vec![
                "encoder.int8.onnx".into(),
                "decoder.int8.onnx".into(),
                "joiner.int8.onnx".into(),
                "tokens.txt".into(),
            ],
            languages: LanguageSupport::Multilingual(25),
            description:
                "NVIDIA Parakeet TDT v3 (INT8) - 25 European languages, auto-detection."
                    .into(),
        },
    ]
}
