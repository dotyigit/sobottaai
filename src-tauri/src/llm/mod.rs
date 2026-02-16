pub mod anthropic;
pub mod groq;
pub mod ollama;
pub mod openai;

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LlmConfig {
    pub provider: LlmProviderType,
    pub api_key: Option<String>,
    pub model: String,
    pub base_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum LlmProviderType {
    OpenAI,
    Anthropic,
    Groq,
    Ollama,
}

#[async_trait::async_trait]
pub trait LlmProvider: Send + Sync {
    async fn complete(
        &self,
        system_prompt: &str,
        user_message: &str,
    ) -> anyhow::Result<String>;
}

pub fn create_provider(config: &LlmConfig) -> Box<dyn LlmProvider> {
    match config.provider {
        LlmProviderType::OpenAI => Box::new(openai::OpenAiProvider::new(config)),
        LlmProviderType::Anthropic => Box::new(anthropic::AnthropicProvider::new(config)),
        LlmProviderType::Groq => Box::new(groq::GroqProvider::new(config)),
        LlmProviderType::Ollama => Box::new(ollama::OllamaProvider::new(config)),
    }
}
