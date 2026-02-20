pub mod parakeet_models;
pub mod whisper_models;

use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};

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

pub fn models_dir(app_data_dir: &Path) -> PathBuf {
    app_data_dir.join("models")
}

pub fn model_path(app_data_dir: &Path, model_id: &str) -> PathBuf {
    models_dir(app_data_dir).join(model_id)
}

pub fn is_model_downloaded(app_data_dir: &Path, model: &ModelInfo) -> bool {
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

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::{Path, PathBuf};

    #[test]
    fn full_catalog_contains_all_models() {
        let catalog = full_catalog();
        let whisper_count = whisper_models::catalog().len();
        let parakeet_count = parakeet_models::catalog().len();
        let cloud_count = cloud_models().len();
        assert_eq!(catalog.len(), whisper_count + parakeet_count + cloud_count);
    }

    #[test]
    fn all_models_have_unique_ids() {
        let catalog = full_catalog();
        let mut ids: Vec<&str> = catalog.iter().map(|m| m.id.as_str()).collect();
        let original_len = ids.len();
        ids.sort();
        ids.dedup();
        assert_eq!(ids.len(), original_len, "Model IDs must be unique");
    }

    #[test]
    fn whisper_models_have_correct_engine() {
        for model in whisper_models::catalog() {
            assert_eq!(
                model.engine,
                Engine::Whisper,
                "Model {} should be Whisper",
                model.id
            );
        }
    }

    #[test]
    fn parakeet_models_have_correct_engine() {
        for model in parakeet_models::catalog() {
            assert_eq!(
                model.engine,
                Engine::Parakeet,
                "Model {} should be Parakeet",
                model.id
            );
        }
    }

    #[test]
    fn cloud_models_have_correct_engines() {
        let models = cloud_models();
        assert_eq!(models.len(), 2);
        assert_eq!(models[0].engine, Engine::CloudOpenAI);
        assert_eq!(models[1].engine, Engine::CloudGroq);
    }

    #[test]
    fn cloud_models_have_no_files_to_download() {
        for model in cloud_models() {
            assert!(
                model.files.is_empty(),
                "Cloud model {} should have no files",
                model.id
            );
            assert!(model.download_urls.is_empty());
            assert_eq!(model.size_bytes, 0);
        }
    }

    #[test]
    fn local_models_have_files_and_urls() {
        for model in full_catalog() {
            if matches!(model.engine, Engine::CloudOpenAI | Engine::CloudGroq) {
                continue;
            }
            assert!(
                !model.files.is_empty(),
                "Local model {} should have files",
                model.id
            );
            assert!(
                !model.download_urls.is_empty(),
                "Local model {} should have download URLs",
                model.id
            );
            assert!(
                model.size_bytes > 0,
                "Local model {} should have size > 0",
                model.id
            );
        }
    }

    #[test]
    fn models_dir_appends_models_subdir() {
        let base = PathBuf::from("/app/data");
        assert_eq!(models_dir(&base), PathBuf::from("/app/data/models"));
    }

    #[test]
    fn model_path_includes_model_id() {
        let base = PathBuf::from("/app/data");
        assert_eq!(
            model_path(&base, "whisper-base"),
            PathBuf::from("/app/data/models/whisper-base")
        );
    }

    #[test]
    fn cloud_model_always_downloaded() {
        let base = PathBuf::from("/nonexistent/path");
        for model in cloud_models() {
            assert!(
                is_model_downloaded(&base, &model),
                "Cloud model {} should always be 'downloaded'",
                model.id
            );
        }
    }

    #[test]
    fn local_model_not_downloaded_when_files_missing() {
        let base = PathBuf::from("/nonexistent/path");
        let model = &whisper_models::catalog()[0]; // whisper-tiny
        assert!(!is_model_downloaded(&base, model));
    }

    #[test]
    fn local_model_downloaded_when_all_files_exist() {
        let dir = std::env::temp_dir().join("sobotta_test_models");
        let model = &whisper_models::catalog()[0]; // whisper-tiny
        let model_dir = model_path(&dir, &model.id);
        std::fs::create_dir_all(&model_dir).unwrap();

        // Create all required files
        for file in &model.files {
            std::fs::write(model_dir.join(file), b"fake").unwrap();
        }

        assert!(is_model_downloaded(&dir, model));
        std::fs::remove_dir_all(&dir).ok();
    }

    #[test]
    fn local_model_not_downloaded_if_partial() {
        let dir = std::env::temp_dir().join("sobotta_test_models_partial");
        let model = &parakeet_models::catalog()[0]; // parakeet v2 has 4 files
        let model_dir = model_path(&dir, &model.id);
        std::fs::create_dir_all(&model_dir).unwrap();

        // Create only the first file
        std::fs::write(model_dir.join(&model.files[0]), b"fake").unwrap();

        assert!(!is_model_downloaded(&dir, model));
        std::fs::remove_dir_all(&dir).ok();
    }

    #[test]
    fn model_with_empty_files_is_not_downloaded() {
        let base = PathBuf::from("/tmp");
        let model = ModelInfo {
            id: "empty-test".into(),
            name: "Test".into(),
            engine: Engine::Whisper,
            size_bytes: 0,
            download_urls: vec![],
            files: vec![], // empty files list
            languages: LanguageSupport::English,
            description: "".into(),
        };
        assert!(!is_model_downloaded(&base, &model));
    }

    #[test]
    fn whisper_models_are_all_multilingual() {
        for model in whisper_models::catalog() {
            match &model.languages {
                LanguageSupport::Multilingual(n) => assert!(*n > 0),
                _ => panic!("Whisper model {} should be multilingual", model.id),
            }
        }
    }

    #[test]
    fn parakeet_v2_is_english_only() {
        let models = parakeet_models::catalog();
        assert!(matches!(models[0].languages, LanguageSupport::English));
    }

    #[test]
    fn parakeet_v3_is_multilingual() {
        let models = parakeet_models::catalog();
        assert!(matches!(
            models[1].languages,
            LanguageSupport::Multilingual(25)
        ));
    }
}
