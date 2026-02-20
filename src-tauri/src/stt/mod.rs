pub mod cloud_groq;
pub mod cloud_openai;
pub mod parakeet;
pub mod whisper;

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TranscriptionResult {
    pub text: String,
    pub language: Option<String>,
    pub segments: Vec<Segment>,
    pub duration_ms: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Segment {
    pub start_ms: u64,
    pub end_ms: u64,
    pub text: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TranscriptionOptions {
    pub language: Option<String>,
    pub vocabulary: Vec<String>,
}

pub trait SttEngine: Send + Sync {
    fn transcribe(
        &self,
        audio: &[f32],
        options: &TranscriptionOptions,
    ) -> anyhow::Result<TranscriptionResult>;

    fn engine_name(&self) -> &str;
}
