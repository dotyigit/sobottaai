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
    let functions = builtin_functions();
    let func = functions
        .iter()
        .find(|f| f.id == function_id)
        .ok_or("AI function not found")?;

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
        .map_err(|e| format!("AI function failed: {}", e))?;

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
