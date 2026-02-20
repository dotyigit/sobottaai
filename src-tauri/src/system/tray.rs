use std::sync::Mutex;
use tauri::{
    menu::{CheckMenuItem, Menu, MenuItem, MenuItemKind, PredefinedMenuItem, Submenu},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Emitter, Manager,
};

/// Models available in the tray (matches frontend model-selector.tsx).
const LOCAL_MODELS: &[(&str, &str)] = &[
    ("whisper-tiny", "Whisper Tiny"),
    ("whisper-base", "Whisper Base"),
    ("whisper-small", "Whisper Small"),
    ("whisper-medium", "Whisper Medium"),
    ("whisper-large-v3-turbo", "Whisper Large V3 Turbo"),
    ("parakeet-tdt-0.6b-v2", "Parakeet TDT v2 (EN)"),
    ("parakeet-tdt-0.6b-v3", "Parakeet TDT v3 (Multi)"),
];

const CLOUD_MODELS: &[(&str, &str)] = &[
    ("cloud-openai-whisper", "OpenAI Whisper (Cloud)"),
    ("cloud-groq-whisper", "Groq Whisper (Cloud)"),
];

/// Languages available in the tray (matches frontend language-selector.tsx).
const LANGUAGES: &[(&str, &str)] = &[
    ("auto", "Auto-detect"),
    ("en", "English"),
    ("es", "Spanish"),
    ("fr", "French"),
    ("de", "German"),
    ("it", "Italian"),
    ("pt", "Portuguese"),
    ("nl", "Dutch"),
    ("ja", "Japanese"),
    ("ko", "Korean"),
    ("zh", "Chinese"),
    ("ru", "Russian"),
    ("ar", "Arabic"),
    ("tr", "Turkish"),
    ("pl", "Polish"),
    ("sv", "Swedish"),
];

/// AI functions (matches builtin list from ai_functions.rs).
const AI_FUNCTIONS: &[(&str, &str)] = &[
    ("none", "None"),
    ("email", "Professional Email"),
    ("code-prompt", "Code Prompt"),
    ("summarize", "Summarize"),
    ("casual", "Casual Rewrite"),
    ("translate", "Translate to English"),
];

/// Holds references to tray submenus so we can update check marks later.
pub struct TrayMenuState {
    model_submenu: Mutex<Option<Submenu<tauri::Wry>>>,
    lang_submenu: Mutex<Option<Submenu<tauri::Wry>>>,
    ai_fn_submenu: Mutex<Option<Submenu<tauri::Wry>>>,
}

impl TrayMenuState {
    pub fn new() -> Self {
        Self {
            model_submenu: Mutex::new(None),
            lang_submenu: Mutex::new(None),
            ai_fn_submenu: Mutex::new(None),
        }
    }
}

pub fn setup_tray(app: &AppHandle) -> tauri::Result<()> {
    let default_model = "whisper-base";
    let default_lang = "auto";
    let default_ai_fn = "none";

    // ── Model submenu ──
    let model_submenu = {
        let sub = Submenu::with_id(app, "model-menu", "Model", true)?;
        for (id, name) in LOCAL_MODELS {
            sub.append(&CheckMenuItem::with_id(
                app,
                format!("model:{}", id),
                *name,
                true,
                *id == default_model,
                None::<&str>,
            )?)?;
        }
        sub.append(&PredefinedMenuItem::separator(app)?)?;
        for (id, name) in CLOUD_MODELS {
            sub.append(&CheckMenuItem::with_id(
                app,
                format!("model:{}", id),
                *name,
                true,
                *id == default_model,
                None::<&str>,
            )?)?;
        }
        sub
    };

    // ── Language submenu ──
    let lang_submenu = {
        let sub = Submenu::with_id(app, "lang-menu", "Language", true)?;
        for (code, name) in LANGUAGES {
            sub.append(&CheckMenuItem::with_id(
                app,
                format!("lang:{}", code),
                *name,
                true,
                *code == default_lang,
                None::<&str>,
            )?)?;
        }
        sub
    };

    // ── AI Function submenu ──
    let ai_fn_submenu = {
        let sub = Submenu::with_id(app, "ai-fn-menu", "AI Function", true)?;
        for (id, name) in AI_FUNCTIONS {
            sub.append(&CheckMenuItem::with_id(
                app,
                format!("ai-fn:{}", id),
                *name,
                true,
                *id == default_ai_fn,
                None::<&str>,
            )?)?;
        }
        sub
    };

    // Store submenu handles so we can update check marks later
    {
        let state = app.state::<TrayMenuState>();
        *state.model_submenu.lock().unwrap() = Some(model_submenu.clone());
        *state.lang_submenu.lock().unwrap() = Some(lang_submenu.clone());
        *state.ai_fn_submenu.lock().unwrap() = Some(ai_fn_submenu.clone());
    }

    // ── App controls ──
    let show_item = MenuItem::with_id(app, "show", "Show SobottaAI", true, None::<&str>)?;
    let settings_item = MenuItem::with_id(app, "settings", "Settings...", true, None::<&str>)?;
    let quit_item = MenuItem::with_id(app, "quit", "Quit SobottaAI", true, None::<&str>)?;

    // ── Build the menu ──
    let menu = Menu::with_items(
        app,
        &[
            &model_submenu,
            &lang_submenu,
            &ai_fn_submenu,
            &PredefinedMenuItem::separator(app)?,
            &show_item,
            &settings_item,
            &PredefinedMenuItem::separator(app)?,
            &quit_item,
        ],
    )?;

    let tray_icon = {
        let icon_bytes = include_bytes!("../../icons/tray-icon@2x.png");
        tauri::image::Image::from_bytes(icon_bytes).expect("failed to load tray icon")
    };

    TrayIconBuilder::new()
        .icon(tray_icon)
        .icon_as_template(true)
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| {
            let id = event.id.as_ref();

            if let Some(model_id) = id.strip_prefix("model:") {
                update_submenu_checks(app, "model", model_id);
                let _ = app.emit("tray-model-changed", model_id.to_string());
                log::info!("Tray: model → {}", model_id);
                return;
            }

            if let Some(lang_code) = id.strip_prefix("lang:") {
                update_submenu_checks(app, "lang", lang_code);
                let _ = app.emit("tray-language-changed", lang_code.to_string());
                log::info!("Tray: language → {}", lang_code);
                return;
            }

            if let Some(fn_id) = id.strip_prefix("ai-fn:") {
                update_submenu_checks(app, "ai-fn", fn_id);
                let _ = app.emit("tray-ai-function-changed", fn_id.to_string());
                log::info!("Tray: AI function → {}", fn_id);
                return;
            }

            match id {
                "show" => {
                    show_main_window(app);
                }
                "settings" => {
                    show_main_window(app);
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.emit("navigate", "/settings");
                    }
                }
                "quit" => app.exit(0),
                _ => {}
            }
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                show_main_window(tray.app_handle());
            }
        })
        .build(app)?;

    Ok(())
}

/// Update check marks in a submenu group. `group` is "model", "lang", or "ai-fn".
fn update_submenu_checks(app: &AppHandle, group: &str, selected: &str) {
    let state = app.state::<TrayMenuState>();
    let submenu_lock = match group {
        "model" => &state.model_submenu,
        "lang" => &state.lang_submenu,
        "ai-fn" => &state.ai_fn_submenu,
        _ => return,
    };

    let guard = submenu_lock.lock().unwrap();
    let submenu = match guard.as_ref() {
        Some(s) => s,
        None => return,
    };

    let prefix = format!("{}:", group);
    if let Ok(items) = submenu.items() {
        for item in items {
            if let MenuItemKind::Check(check) = &item {
                let item_id = check.id().0.clone();
                if let Some(suffix) = item_id.strip_prefix(&prefix) {
                    let _ = check.set_checked(suffix == selected);
                }
            }
        }
    }
}

/// Update tray check marks from the frontend (called when settings are loaded/changed).
pub fn update_tray_selection(app: &AppHandle, model: &str, language: &str, ai_function: Option<&str>) {
    update_submenu_checks(app, "model", model);
    update_submenu_checks(app, "lang", language);
    update_submenu_checks(app, "ai-fn", ai_function.unwrap_or("none"));
}

/// Show the main window and restore dock icon on macOS.
fn show_main_window(app: &AppHandle) {
    // macOS: restore dock icon before showing the window
    #[cfg(target_os = "macos")]
    let _ = app.set_activation_policy(tauri::ActivationPolicy::Regular);

    if let Some(window) = app.get_webview_window("main") {
        let _ = window.unminimize();
        let _ = window.show();
        let _ = window.set_focus();
    }
}
