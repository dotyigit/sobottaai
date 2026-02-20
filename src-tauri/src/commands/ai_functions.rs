use crate::db;
use crate::llm::{self, LlmConfig, LlmProviderType};
use crate::rules;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AiFunction {
    pub id: String,
    pub name: String,
    pub prompt: String,
    pub provider: String,
    pub model: Option<String>,
    pub is_builtin: bool,
}

pub fn builtin_functions() -> Vec<AiFunction> {
    vec![
        AiFunction {
            id: "email".into(),
            name: "Professional Email".into(),
            prompt: "Rewrite the following as a professional email. Include a greeting and sign-off. Keep it concise.".into(),
            provider: "default".into(),
            model: None,
            is_builtin: true,
        },
        AiFunction {
            id: "code-prompt".into(),
            name: "Code Prompt".into(),
            prompt: "Convert the following spoken description into a clear, well-structured code prompt or specification.".into(),
            provider: "default".into(),
            model: None,
            is_builtin: true,
        },
        AiFunction {
            id: "summarize".into(),
            name: "Summarize".into(),
            prompt: "Summarize the following text concisely, capturing the key points.".into(),
            provider: "default".into(),
            model: None,
            is_builtin: true,
        },
        AiFunction {
            id: "casual".into(),
            name: "Casual Rewrite".into(),
            prompt: "Rewrite the following text in a casual, friendly tone.".into(),
            provider: "default".into(),
            model: None,
            is_builtin: true,
        },
        AiFunction {
            id: "translate".into(),
            name: "Translate to English".into(),
            prompt: "Translate the following text to English. If it is already in English, improve clarity.".into(),
            provider: "default".into(),
            model: None,
            is_builtin: true,
        },
    ]
}

#[tauri::command]
pub fn list_ai_functions() -> Result<Vec<AiFunction>, String> {
    let mut functions = builtin_functions();

    // Load custom functions from database
    if let Ok(custom) = db::ai_functions::list() {
        for item in custom {
            functions.push(AiFunction {
                id: item.id,
                name: item.name,
                prompt: item.prompt,
                provider: item.provider,
                model: item.model,
                is_builtin: false,
            });
        }
    }

    Ok(functions)
}

fn parse_provider_type(s: &str) -> LlmProviderType {
    match s.to_lowercase().as_str() {
        "anthropic" => LlmProviderType::Anthropic,
        "groq" => LlmProviderType::Groq,
        "ollama" => LlmProviderType::Ollama,
        _ => LlmProviderType::OpenAI,
    }
}

#[tauri::command]
pub async fn execute_ai_function(
    text: String,
    function_id: String,
    llm_provider: String,
    llm_api_key: String,
    llm_model: String,
) -> Result<String, String> {
    log::info!(
        "execute_ai_function: function={}, provider={}, model={}",
        function_id, llm_provider, llm_model
    );

    // Search built-in functions first, then custom ones from DB
    let all_functions = list_ai_functions()?;
    let func = all_functions
        .iter()
        .find(|f| f.id == function_id)
        .ok_or("AI function not found")?;

    let has_key = !llm_api_key.is_empty();
    log::info!(
        "execute_ai_function: found function '{}', has_api_key={}",
        func.name, has_key
    );

    let config = LlmConfig {
        provider: parse_provider_type(&llm_provider),
        api_key: if llm_api_key.is_empty() {
            None
        } else {
            Some(llm_api_key)
        },
        model: llm_model,
        base_url: None,
    };

    let provider = llm::create_provider(&config);
    let result = provider
        .complete(&func.prompt, &text)
        .await
        .map_err(|e| {
            log::error!("execute_ai_function: LLM call failed: {}", e);
            format!("AI function failed: {}", e)
        })?;

    if result.is_empty() {
        log::warn!("execute_ai_function: LLM returned empty response");
        return Err("AI function returned empty response".to_string());
    }

    log::info!(
        "execute_ai_function: success, result={} chars",
        result.len()
    );
    Ok(result)
}

#[tauri::command]
pub fn save_ai_function(function: AiFunction) -> Result<(), String> {
    let item = db::ai_functions::AiFunctionRow {
        id: function.id,
        name: function.name,
        prompt: function.prompt,
        provider: function.provider,
        model: function.model,
        is_builtin: false,
    };
    db::ai_functions::insert(&item).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_ai_function(function_id: String) -> Result<(), String> {
    db::ai_functions::delete(&function_id).map_err(|e| e.to_string())
}

/// Apply text processing rules (regex-based). Called from frontend pipeline.
#[tauri::command]
pub fn apply_rules(text: String, enabled_rule_ids: Vec<String>) -> Result<String, String> {
    let all_rules = rules::builtin_rules();
    let active_rules: Vec<rules::Rule> = all_rules
        .into_iter()
        .map(|mut r| {
            r.enabled = enabled_rule_ids.contains(&r.id);
            r
        })
        .collect();

    Ok(rules::apply_regex_rules(&text, &active_rules))
}

#[cfg(test)]
mod tests {
    use super::*;

    // ── builtin_functions ────────────────────────────────────

    #[test]
    fn builtin_functions_returns_five() {
        let funcs = builtin_functions();
        assert_eq!(funcs.len(), 5);
    }

    #[test]
    fn builtin_functions_have_unique_ids() {
        let funcs = builtin_functions();
        let mut ids: Vec<&str> = funcs.iter().map(|f| f.id.as_str()).collect();
        let original_len = ids.len();
        ids.sort();
        ids.dedup();
        assert_eq!(ids.len(), original_len);
    }

    #[test]
    fn builtin_functions_are_marked_builtin() {
        for f in builtin_functions() {
            assert!(f.is_builtin, "Function '{}' should be builtin", f.name);
        }
    }

    #[test]
    fn builtin_functions_have_non_empty_prompts() {
        for f in builtin_functions() {
            assert!(!f.prompt.is_empty(), "Function '{}' should have a prompt", f.name);
        }
    }

    #[test]
    fn builtin_functions_use_default_provider() {
        for f in builtin_functions() {
            assert_eq!(f.provider, "default", "Builtin functions should use 'default' provider");
        }
    }

    #[test]
    fn builtin_function_ids_are_correct() {
        let funcs = builtin_functions();
        let ids: Vec<&str> = funcs.iter().map(|f| f.id.as_str()).collect();
        assert!(ids.contains(&"email"));
        assert!(ids.contains(&"code-prompt"));
        assert!(ids.contains(&"summarize"));
        assert!(ids.contains(&"casual"));
        assert!(ids.contains(&"translate"));
    }

    // ── parse_provider_type ──────────────────────────────────

    #[test]
    fn parse_provider_type_openai() {
        assert!(matches!(parse_provider_type("openai"), LlmProviderType::OpenAI));
    }

    #[test]
    fn parse_provider_type_anthropic() {
        assert!(matches!(parse_provider_type("anthropic"), LlmProviderType::Anthropic));
    }

    #[test]
    fn parse_provider_type_groq() {
        assert!(matches!(parse_provider_type("groq"), LlmProviderType::Groq));
    }

    #[test]
    fn parse_provider_type_ollama() {
        assert!(matches!(parse_provider_type("ollama"), LlmProviderType::Ollama));
    }

    #[test]
    fn parse_provider_type_case_insensitive() {
        assert!(matches!(parse_provider_type("OPENAI"), LlmProviderType::OpenAI));
        assert!(matches!(parse_provider_type("Anthropic"), LlmProviderType::Anthropic));
        assert!(matches!(parse_provider_type("GROQ"), LlmProviderType::Groq));
        assert!(matches!(parse_provider_type("Ollama"), LlmProviderType::Ollama));
    }

    #[test]
    fn parse_provider_type_unknown_defaults_to_openai() {
        assert!(matches!(parse_provider_type("unknown"), LlmProviderType::OpenAI));
        assert!(matches!(parse_provider_type(""), LlmProviderType::OpenAI));
        assert!(matches!(parse_provider_type("default"), LlmProviderType::OpenAI));
    }

    // ── apply_rules (command) ────────────────────────────────

    #[test]
    fn apply_rules_no_enabled_ids() {
        let result = apply_rules("um hello world".into(), vec![]).unwrap();
        assert_eq!(result, "um hello world"); // nothing enabled → no changes
    }

    #[test]
    fn apply_rules_with_filler_removal() {
        let result = apply_rules(
            "um so like I think".into(),
            vec!["remove-fillers".into()],
        )
        .unwrap();
        assert_eq!(result, "I think");
    }

    #[test]
    fn apply_rules_with_punctuation() {
        let result = apply_rules(
            "hello world".into(),
            vec!["smart-punctuation".into()],
        )
        .unwrap();
        assert_eq!(result, "Hello world.");
    }

    #[test]
    fn apply_rules_both_filler_and_punctuation() {
        let result = apply_rules(
            "um hello world".into(),
            vec!["remove-fillers".into(), "smart-punctuation".into()],
        )
        .unwrap();
        assert_eq!(result, "Hello world.");
    }

    #[test]
    fn apply_rules_unknown_rule_id_ignored() {
        let result = apply_rules(
            "hello world".into(),
            vec!["nonexistent-rule".into()],
        )
        .unwrap();
        assert_eq!(result, "hello world");
    }

    // ── AiFunction serialization ─────────────────────────────

    #[test]
    fn ai_function_serialization_roundtrip() {
        let func = AiFunction {
            id: "test".into(),
            name: "Test Function".into(),
            prompt: "Do something".into(),
            provider: "openai".into(),
            model: Some("gpt-4".into()),
            is_builtin: false,
        };
        let json = serde_json::to_string(&func).unwrap();
        let deserialized: AiFunction = serde_json::from_str(&json).unwrap();
        assert_eq!(deserialized.id, "test");
        assert_eq!(deserialized.name, "Test Function");
        assert_eq!(deserialized.prompt, "Do something");
        assert_eq!(deserialized.model, Some("gpt-4".into()));
        assert!(!deserialized.is_builtin);
    }

    #[test]
    fn ai_function_camel_case_serialization() {
        let func = AiFunction {
            id: "test".into(),
            name: "Test".into(),
            prompt: "p".into(),
            provider: "openai".into(),
            model: None,
            is_builtin: true,
        };
        let json = serde_json::to_string(&func).unwrap();
        assert!(json.contains("\"isBuiltin\""));
    }
}
