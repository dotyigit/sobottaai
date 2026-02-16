use super::{LlmConfig, LlmProvider};
use reqwest::Client;
use serde_json::json;

pub struct GroqProvider {
    client: Client,
    api_key: String,
    model: String,
}

impl GroqProvider {
    pub fn new(config: &LlmConfig) -> Self {
        Self {
            client: Client::new(),
            api_key: config.api_key.clone().unwrap_or_default(),
            model: config.model.clone(),
        }
    }
}

#[async_trait::async_trait]
impl LlmProvider for GroqProvider {
    async fn complete(
        &self,
        system_prompt: &str,
        user_message: &str,
    ) -> anyhow::Result<String> {
        let response = self
            .client
            .post("https://api.groq.com/openai/v1/chat/completions")
            .header("Authorization", format!("Bearer {}", self.api_key))
            .json(&json!({
                "model": self.model,
                "messages": [
                    { "role": "system", "content": system_prompt },
                    { "role": "user", "content": user_message }
                ],
                "temperature": 0.3
            }))
            .send()
            .await?;

        let body: serde_json::Value = response.json().await?;
        let text = body["choices"][0]["message"]["content"]
            .as_str()
            .unwrap_or("")
            .to_string();

        Ok(text)
    }
}
