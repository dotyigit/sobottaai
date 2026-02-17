use super::{Segment, TranscriptionOptions, TranscriptionResult};
use crate::audio::wav;
use serde::Deserialize;

#[derive(Debug, Deserialize)]
struct OpenAiTranscription {
    text: String,
    language: Option<String>,
    segments: Option<Vec<OpenAiSegment>>,
}

#[derive(Debug, Deserialize)]
struct OpenAiSegment {
    start: f64,
    end: f64,
    text: String,
}

/// Transcribe audio using the OpenAI Whisper API.
pub async fn transcribe(
    audio: &[f32],
    options: &TranscriptionOptions,
    api_key: &str,
) -> anyhow::Result<TranscriptionResult> {
    let start = std::time::Instant::now();

    // Encode audio as WAV bytes (16kHz mono)
    let wav_bytes = wav::encode_wav_to_bytes(audio, 16000)?;

    // Build multipart form
    let file_part = reqwest::multipart::Part::bytes(wav_bytes)
        .file_name("audio.wav")
        .mime_str("audio/wav")?;

    let mut form = reqwest::multipart::Form::new()
        .part("file", file_part)
        .text("model", "whisper-1")
        .text("response_format", "verbose_json");

    if let Some(ref lang) = options.language {
        if lang != "auto" {
            form = form.text("language", lang.clone());
        }
    }

    if !options.vocabulary.is_empty() {
        form = form.text("prompt", options.vocabulary.join(", "));
    }

    let client = reqwest::Client::new();
    let resp = client
        .post("https://api.openai.com/v1/audio/transcriptions")
        .header("Authorization", format!("Bearer {}", api_key))
        .multipart(form)
        .send()
        .await?;

    if !resp.status().is_success() {
        let status = resp.status();
        let body = resp.text().await.unwrap_or_default();
        anyhow::bail!("OpenAI API error {}: {}", status, body);
    }

    let result: OpenAiTranscription = resp.json().await?;
    let inference_ms = start.elapsed().as_millis() as u64;

    let segments = result
        .segments
        .unwrap_or_default()
        .into_iter()
        .map(|s| Segment {
            start_ms: (s.start * 1000.0) as u64,
            end_ms: (s.end * 1000.0) as u64,
            text: s.text,
        })
        .collect();

    Ok(TranscriptionResult {
        text: result.text,
        language: result.language,
        segments,
        duration_ms: inference_ms,
    })
}
