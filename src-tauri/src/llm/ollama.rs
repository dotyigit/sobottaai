use super::{LlmConfig, LlmProvider};
use reqwest::Client;
use serde_json::json;
use std::time::Duration;

pub struct OllamaProvider {
    client: Client,
    base_url: String,
    model: String,
}

impl OllamaProvider {
    pub fn new(config: &LlmConfig) -> Self {
        Self {
            client: Client::builder()
                .timeout(Duration::from_secs(60))
                .build()
                .unwrap_or_else(|_| Client::new()),
            base_url: config
                .base_url
                .clone()
                .unwrap_or_else(|| "http://localhost:11434".to_string()),
            model: config.model.clone(),
        }
    }
}

#[async_trait::async_trait]
impl LlmProvider for OllamaProvider {
    async fn complete(
        &self,
        system_prompt: &str,
        user_message: &str,
    ) -> anyhow::Result<String> {
        log::info!("Ollama: calling model={} at {}", self.model, self.base_url);

        let response = self
            .client
            .post(format!("{}/api/chat", self.base_url))
            .json(&json!({
                "model": self.model,
                "stream": false,
                "messages": [
                    { "role": "system", "content": system_prompt },
                    { "role": "user", "content": user_message }
                ]
            }))
            .send()
            .await?;

        let status = response.status();
        let body: serde_json::Value = response.json().await?;

        if !status.is_success() {
            let err_msg = body["error"]
                .as_str()
                .unwrap_or("Unknown error");
            anyhow::bail!("Ollama API error ({}): {}", status, err_msg);
        }

        let text = body["message"]["content"]
            .as_str()
            .ok_or_else(|| anyhow::anyhow!("Ollama returned no content in response"))?
            .to_string();

        log::info!("Ollama: response received ({} chars)", text.len());
        Ok(text)
    }
}
