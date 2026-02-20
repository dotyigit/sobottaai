use super::{LlmConfig, LlmProvider};
use reqwest::Client;
use serde_json::json;
use std::time::Duration;

pub struct AnthropicProvider {
    client: Client,
    api_key: String,
    model: String,
}

impl AnthropicProvider {
    pub fn new(config: &LlmConfig) -> Self {
        Self {
            client: Client::builder()
                .timeout(Duration::from_secs(30))
                .build()
                .unwrap_or_else(|_| Client::new()),
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
        log::info!("Anthropic: calling model={}", self.model);

        let response = self
            .client
            .post("https://api.anthropic.com/v1/messages")
            .header("x-api-key", &self.api_key)
            .header("anthropic-version", "2023-06-01")
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

        let status = response.status();
        let body: serde_json::Value = response.json().await?;

        if !status.is_success() {
            let err_msg = body["error"]["message"]
                .as_str()
                .unwrap_or("Unknown error");
            anyhow::bail!("Anthropic API error ({}): {}", status, err_msg);
        }

        let text = body["content"][0]["text"]
            .as_str()
            .ok_or_else(|| anyhow::anyhow!("Anthropic returned no content in response"))?
            .to_string();

        log::info!("Anthropic: response received ({} chars)", text.len());
        Ok(text)
    }
}
