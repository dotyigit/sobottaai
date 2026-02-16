use super::{LlmConfig, LlmProvider};
use reqwest::Client;
use serde_json::json;

pub struct OllamaProvider {
    client: Client,
    base_url: String,
    model: String,
}

impl OllamaProvider {
    pub fn new(config: &LlmConfig) -> Self {
        Self {
            client: Client::new(),
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

        let body: serde_json::Value = response.json().await?;
        let text = body["message"]["content"]
            .as_str()
            .unwrap_or("")
            .to_string();

        Ok(text)
    }
}
