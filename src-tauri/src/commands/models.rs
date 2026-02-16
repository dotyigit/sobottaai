use crate::commands::transcription::SttManager;
use crate::models;
use crate::models::ModelInfo;
use futures_util::StreamExt;
use serde::Serialize;
use tauri::{AppHandle, Emitter, Manager, State};

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ModelStatus {
    #[serde(flatten)]
    pub info: ModelInfo,
    pub downloaded: bool,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct DownloadProgressEvent {
    model_id: String,
    file_index: usize,
    file_count: usize,
    file_name: String,
    bytes_downloaded: u64,
    total_bytes: u64,
    percentage: f64,
}

#[tauri::command]
pub async fn list_models(app: AppHandle) -> Result<Vec<ModelStatus>, String> {
    let app_data_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let catalog = models::full_catalog();

    let statuses: Vec<ModelStatus> = catalog
        .into_iter()
        .map(|info| {
            let downloaded = models::is_model_downloaded(&app_data_dir, &info);
            ModelStatus { info, downloaded }
        })
        .collect();

    Ok(statuses)
}

#[tauri::command]
pub async fn download_model(app: AppHandle, model_id: String) -> Result<(), String> {
    let app_data_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let catalog = models::full_catalog();
    let model = catalog
        .iter()
        .find(|m| m.id == model_id)
        .ok_or("Model not found")?
        .clone();

    let model_dir = models::model_path(&app_data_dir, &model_id);
    std::fs::create_dir_all(&model_dir).map_err(|e| e.to_string())?;

    let client = reqwest::Client::new();
    let file_count = model.download_urls.len();

    for (i, url) in model.download_urls.iter().enumerate() {
        let filename = &model.files[i];
        let file_path = model_dir.join(filename);

        // Skip if file already exists
        if file_path.exists() {
            log::info!("File already exists, skipping: {:?}", file_path);
            continue;
        }

        log::info!("Downloading {} -> {:?}", url, file_path);

        let response = client
            .get(url)
            .send()
            .await
            .map_err(|e| format!("Download request failed: {}", e))?;

        if !response.status().is_success() {
            return Err(format!(
                "Download failed with status: {}",
                response.status()
            ));
        }

        let total_bytes = response.content_length().unwrap_or(0);
        let mut bytes_downloaded: u64 = 0;

        let mut file = std::fs::File::create(&file_path)
            .map_err(|e| format!("Failed to create file: {}", e))?;

        let mut stream = response.bytes_stream();

        while let Some(chunk) = stream.next().await {
            let chunk = chunk.map_err(|e| format!("Download stream error: {}", e))?;
            std::io::Write::write_all(&mut file, &chunk)
                .map_err(|e| format!("Failed to write file: {}", e))?;

            bytes_downloaded += chunk.len() as u64;

            let percentage = if total_bytes > 0 {
                (bytes_downloaded as f64 / total_bytes as f64) * 100.0
            } else {
                0.0
            };

            let _ = app.emit(
                "model-download-progress",
                DownloadProgressEvent {
                    model_id: model_id.clone(),
                    file_index: i,
                    file_count,
                    file_name: filename.clone(),
                    bytes_downloaded,
                    total_bytes,
                    percentage,
                },
            );
        }
    }

    log::info!("Model {} downloaded successfully", model_id);
    Ok(())
}

#[tauri::command]
pub async fn delete_model(
    app: AppHandle,
    stt_manager: State<'_, SttManager>,
    model_id: String,
) -> Result<(), String> {
    let app_data_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let model_dir = models::model_path(&app_data_dir, &model_id);

    // Evict cached engine before deleting files
    stt_manager.evict(&model_id);

    if model_dir.exists() {
        std::fs::remove_dir_all(&model_dir).map_err(|e| e.to_string())?;
    }

    log::info!("Model {} deleted", model_id);
    Ok(())
}
