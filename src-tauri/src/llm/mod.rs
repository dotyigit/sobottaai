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

#[cfg(test)]
mod tests {
    use super::*;

    fn make_config(provider: LlmProviderType) -> LlmConfig {
        LlmConfig {
            provider,
            api_key: Some("test-key".into()),
            model: "test-model".into(),
            base_url: None,
        }
    }

    #[test]
    fn create_provider_openai() {
        let config = make_config(LlmProviderType::OpenAI);
        let _provider = create_provider(&config); // should not panic
    }

    #[test]
    fn create_provider_anthropic() {
        let config = make_config(LlmProviderType::Anthropic);
        let _provider = create_provider(&config);
    }

    #[test]
    fn create_provider_groq() {
        let config = make_config(LlmProviderType::Groq);
        let _provider = create_provider(&config);
    }

    #[test]
    fn create_provider_ollama() {
        let config = make_config(LlmProviderType::Ollama);
        let _provider = create_provider(&config);
    }

    #[test]
    fn create_provider_ollama_with_custom_base_url() {
        let config = LlmConfig {
            provider: LlmProviderType::Ollama,
            api_key: None,
            model: "llama3".into(),
            base_url: Some("http://custom:8080".into()),
        };
        let _provider = create_provider(&config);
    }

    #[test]
    fn create_provider_with_no_api_key() {
        let config = LlmConfig {
            provider: LlmProviderType::OpenAI,
            api_key: None,
            model: "gpt-4".into(),
            base_url: None,
        };
        let _provider = create_provider(&config); // should not panic
    }

    #[test]
    fn llm_config_serialization_roundtrip() {
        let config = make_config(LlmProviderType::OpenAI);
        let json = serde_json::to_string(&config).unwrap();
        let deserialized: LlmConfig = serde_json::from_str(&json).unwrap();
        assert_eq!(deserialized.model, "test-model");
        assert_eq!(deserialized.api_key, Some("test-key".into()));
    }

    #[test]
    fn llm_provider_type_serialization() {
        let types = vec![
            LlmProviderType::OpenAI,
            LlmProviderType::Anthropic,
            LlmProviderType::Groq,
            LlmProviderType::Ollama,
        ];
        for pt in types {
            let json = serde_json::to_string(&pt).unwrap();
            let deserialized: LlmProviderType = serde_json::from_str(&json).unwrap();
            assert_eq!(
                std::mem::discriminant(&pt),
                std::mem::discriminant(&deserialized)
            );
        }
    }
}
