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
    Ok(builtin_functions())
}

#[tauri::command]
pub async fn execute_ai_function(
    text: String,
    function_id: String,
) -> Result<String, String> {
    let functions = builtin_functions();
    let _func = functions
        .iter()
        .find(|f| f.id == function_id)
        .ok_or("AI function not found")?;

    // TODO: Phase 5 - wire up LLM provider to process text
    Ok(text)
}

#[tauri::command]
pub fn save_ai_function(function: AiFunction) -> Result<(), String> {
    // TODO: Phase 5 - persist custom AI functions to SQLite
    let _ = function;
    Ok(())
}

#[tauri::command]
pub fn delete_ai_function(function_id: String) -> Result<(), String> {
    // TODO: Phase 5 - delete from SQLite
    let _ = function_id;
    Ok(())
}
