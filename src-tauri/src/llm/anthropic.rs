use super::{LlmConfig, LlmProvider};
use reqwest::Client;
use serde_json::json;

pub struct AnthropicProvider {
    client: Client,
    api_key: String,
    model: String,
}

impl AnthropicProvider {
    pub fn new(config: &LlmConfig) -> Self {
        Self {
            client: Client::new(),
            api_key: config.api_key.clone().unwrap_or_default(),
            model: config.model.clone(),
        }
    }
}

#[async_trait::async_trait]
impl LlmProvider for AnthropicProvider {
    async fn complete(
        &self,
        system_prompt: &str,
        user_message: &str,
    ) -> anyhow::Result<String> {
        let response = self
            .client
            .post("https://api.anthropic.com/v1/messages")
            .header("x-api-key", &self.api_key)
            .header("anthropic-version", "2023-06-01")
            .header("content-type", "application/json")
            .json(&json!({
                "model": self.model,
                "max_tokens": 4096,
                "system": system_prompt,
                "messages": [
                    { "role": "user", "content": user_message }
                ]
            }))
            .send()
            .await?;

        let body: serde_json::Value = response.json().await?;
        let text = body["content"][0]["text"]
            .as_str()
            .unwrap_or("")
            .to_string();

        Ok(text)
    }
}
