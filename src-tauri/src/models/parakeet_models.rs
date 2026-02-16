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
                format!("{}/encoder-epoch-86-avg-1.int8.onnx", HF_TDT_V2),
                format!("{}/decoder-epoch-86-avg-1.int8.onnx", HF_TDT_V2),
                format!("{}/joiner-epoch-86-avg-1.int8.onnx", HF_TDT_V2),
                format!("{}/tokens.txt", HF_TDT_V2),
            ],
            files: vec![
                "encoder-epoch-86-avg-1.int8.onnx".into(),
                "decoder-epoch-86-avg-1.int8.onnx".into(),
                "joiner-epoch-86-avg-1.int8.onnx".into(),
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
                format!("{}/encoder-epoch-86-avg-1.int8.onnx", HF_TDT_V3),
                format!("{}/decoder-epoch-86-avg-1.int8.onnx", HF_TDT_V3),
                format!("{}/joiner-epoch-86-avg-1.int8.onnx", HF_TDT_V3),
                format!("{}/tokens.txt", HF_TDT_V3),
            ],
            files: vec![
                "encoder-epoch-86-avg-1.int8.onnx".into(),
                "decoder-epoch-86-avg-1.int8.onnx".into(),
                "joiner-epoch-86-avg-1.int8.onnx".into(),
                "tokens.txt".into(),
            ],
            languages: LanguageSupport::Multilingual(25),
            description:
                "NVIDIA Parakeet TDT v3 (INT8) - 25 European languages, auto-detection."
                    .into(),
        },
    ]
}
