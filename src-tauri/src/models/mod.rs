pub mod parakeet_models;
pub mod whisper_models;

use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ModelInfo {
    pub id: String,
    pub name: String,
    pub engine: Engine,
    pub size_bytes: u64,
    pub download_urls: Vec<String>,
    pub files: Vec<String>,
    pub languages: LanguageSupport,
    pub description: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum Engine {
    Whisper,
    Parakeet,
    CloudOpenAI,
    CloudGroq,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum LanguageSupport {
    English,
    Multilingual(usize),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DownloadProgress {
    pub model_id: String,
    pub bytes_downloaded: u64,
    pub total_bytes: u64,
    pub percentage: f64,
    pub status: DownloadStatus,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum DownloadStatus {
    Downloading,
    Completed,
    Failed(String),
}

pub fn models_dir(app_data_dir: &PathBuf) -> PathBuf {
    app_data_dir.join("models")
}

pub fn model_path(app_data_dir: &PathBuf, model_id: &str) -> PathBuf {
    models_dir(app_data_dir).join(model_id)
}

pub fn is_model_downloaded(app_data_dir: &PathBuf, model: &ModelInfo) -> bool {
    // Cloud models don't need downloads
    if matches!(model.engine, Engine::CloudOpenAI | Engine::CloudGroq) {
        return true;
    }
    // Local models must have all files present
    if model.files.is_empty() {
        return false;
    }
    let dir = model_path(app_data_dir, &model.id);
    model.files.iter().all(|f| dir.join(f).exists())
}

pub fn cloud_models() -> Vec<ModelInfo> {
    vec![
        ModelInfo {
            id: "cloud-openai-whisper".into(),
            name: "OpenAI Whisper (Cloud)".into(),
            engine: Engine::CloudOpenAI,
            size_bytes: 0,
            download_urls: vec![],
            files: vec![],
            languages: LanguageSupport::Multilingual(99),
            description: "OpenAI's cloud Whisper API. Requires API key.".into(),
        },
        ModelInfo {
            id: "cloud-groq-whisper".into(),
            name: "Groq Whisper (Cloud)".into(),
            engine: Engine::CloudGroq,
            size_bytes: 0,
            download_urls: vec![],
            files: vec![],
            languages: LanguageSupport::Multilingual(99),
            description: "Groq's fast cloud Whisper API. Requires API key.".into(),
        },
    ]
}

pub fn full_catalog() -> Vec<ModelInfo> {
    let mut catalog = whisper_models::catalog();
    catalog.extend(parakeet_models::catalog());
    catalog.extend(cloud_models());
    catalog
}
