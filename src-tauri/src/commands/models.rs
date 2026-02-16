use crate::models;
use crate::models::ModelInfo;
use serde::Serialize;
use tauri::{AppHandle, Manager};

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ModelStatus {
    #[serde(flatten)]
    pub info: ModelInfo,
    pub downloaded: bool,
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
        .ok_or("Model not found")?;

    let model_dir = models::model_path(&app_data_dir, &model_id);
    std::fs::create_dir_all(&model_dir).map_err(|e| e.to_string())?;

    let client = reqwest::Client::new();

    for (i, url) in model.download_urls.iter().enumerate() {
        let filename = &model.files[i];
        let file_path = model_dir.join(filename);

        log::info!("Downloading {} -> {:?}", url, file_path);

        let response = client
            .get(url)
            .send()
            .await
            .map_err(|e| e.to_string())?;

        let bytes = response.bytes().await.map_err(|e| e.to_string())?;
        std::fs::write(&file_path, &bytes).map_err(|e| e.to_string())?;
    }

    log::info!("Model {} downloaded successfully", model_id);
    Ok(())
}

#[tauri::command]
pub async fn delete_model(app: AppHandle, model_id: String) -> Result<(), String> {
    let app_data_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let model_dir = models::model_path(&app_data_dir, &model_id);
    if model_dir.exists() {
        std::fs::remove_dir_all(&model_dir).map_err(|e| e.to_string())?;
    }
    Ok(())
}
