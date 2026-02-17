use super::{Segment, TranscriptionOptions, TranscriptionResult};
use crate::audio::wav;
use serde::Deserialize;

#[derive(Debug, Deserialize)]
struct GroqTranscription {
    text: String,
    x_groq: Option<GroqMeta>,
    segments: Option<Vec<GroqSegment>>,
}

#[derive(Debug, Deserialize)]
struct GroqMeta {
    id: Option<String>,
}

#[derive(Debug, Deserialize)]
struct GroqSegment {
    start: f64,
    end: f64,
    text: String,
}

/// Transcribe audio using the Groq Whisper API.
pub async fn transcribe(
    audio: &[f32],
    options: &TranscriptionOptions,
    api_key: &str,
    model: &str,
) -> anyhow::Result<TranscriptionResult> {
    let start = std::time::Instant::now();

    let wav_bytes = wav::encode_wav_to_bytes(audio, 16000)?;

    let file_part = reqwest::multipart::Part::bytes(wav_bytes)
        .file_name("audio.wav")
        .mime_str("audio/wav")?;

    let groq_model = if model.is_empty() {
        "whisper-large-v3-turbo"
    } else {
        model
    };

    let mut form = reqwest::multipart::Form::new()
        .part("file", file_part)
        .text("model", groq_model.to_string())
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
        .post("https://api.groq.com/openai/v1/audio/transcriptions")
        .header("Authorization", format!("Bearer {}", api_key))
        .multipart(form)
        .send()
        .await?;

    if !resp.status().is_success() {
        let status = resp.status();
        let body = resp.text().await.unwrap_or_default();
        anyhow::bail!("Groq API error {}: {}", status, body);
    }

    let result: GroqTranscription = resp.json().await?;
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
        language: None, // Groq doesn't return detected language in the same way
        segments,
        duration_ms: inference_ms,
    })
}
