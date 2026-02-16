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

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Engine {
    Whisper,
    Parakeet,
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
    let dir = model_path(app_data_dir, &model.id);
    model.files.iter().all(|f| dir.join(f).exists())
}

pub fn full_catalog() -> Vec<ModelInfo> {
    let mut catalog = whisper_models::catalog();
    catalog.extend(parakeet_models::catalog());
    catalog
}
